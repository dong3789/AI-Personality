import type { AnalysisJob, AnalysisResult } from './types';
import { fetchGitHubRepo } from './github';
import { analyzeWithLLM } from './llm';
import { getCache, setCache } from './cache';
import { updateJobStatus, saveResult } from './db';
import { jobQueue } from './queue';
import { parseGitHubUrl, generateId } from './utils';
import { sendResultEmail } from './email';

/**
 * 백그라운드 워커
 */
export class AnalysisWorker {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * 워커 시작
   */
  start(): void {
    if (this.isRunning) {
      console.log('워커가 이미 실행 중입니다.');
      return;
    }

    this.isRunning = true;
    console.log('✅ 분석 워커 시작');

    // 5초마다 큐 확인
    this.intervalId = setInterval(() => {
      this.processNext();
    }, 5000);

    // 즉시 한 번 실행
    this.processNext();
  }

  /**
   * 워커 중지
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('⏹️  분석 워커 중지');
  }

  /**
   * 다음 작업 처리
   */
  private async processNext(): Promise<void> {
    const job = jobQueue.dequeue();

    if (!job) {
      return; // 큐가 비어있음
    }

    console.log(`🔄 작업 처리 시작: ${job.id}`);

    try {
      // 1. GitHub URL 파싱
      const parsed = parseGitHubUrl(job.githubUrl);
      if (!parsed) {
        throw new Error('올바르지 않은 GitHub URL입니다.');
      }

      const { owner, repo } = parsed;

      // 2. 캐시 확인
      const cached = await getCache(owner, repo);

      let repoData;
      let result;

      if (cached) {
        console.log(`💾 캐시 히트: ${owner}/${repo}`);
        repoData = cached.githubData;
        result = cached.result;
      } else {
        console.log(`🔍 GitHub 데이터 수집 중: ${owner}/${repo}`);

        // 3. GitHub 데이터 수집
        repoData = await fetchGitHubRepo(owner, repo);

        console.log(`🤖 LLM 분석 중: ${owner}/${repo}`);

        // 4. LLM 분석
        result = await analyzeWithLLM(repoData);

        // 5. 캐시 저장
        await setCache(owner, repo, repoData, result);
      }

      // 6. 결과 저장
      const resultId = generateId();
      const analysisResult: AnalysisResult = {
        id: resultId,
        repoUrl: job.githubUrl,
        email: job.email,
        result,
        repoData,
        analyzedAt: new Date().toISOString(),
        shareUrl: `${process.env.APP_URL || 'http://localhost:3000'}/result/${resultId}`,
      };

      saveResult(analysisResult);

      // Job과 결과 연결
      const { linkJobToResult } = await import('./db');
      linkJobToResult(job.id, resultId);

      // 7. 이메일 전송 (선택사항)
      try {
        console.log(`📧 이메일 전송 중: ${job.email}`);
        await sendResultEmail(analysisResult);
        console.log(`✅ 이메일 전송 완료: ${job.email}`);
      } catch (emailError) {
        console.warn(`⚠️  이메일 전송 실패 (계속 진행):`, emailError);
        // 이메일 실패는 무시하고 계속 진행
      }

      // 8. Job 상태 업데이트
      updateJobStatus(job.id, 'completed');
      jobQueue.complete(job.id);

      console.log(`✅ 작업 완료: ${job.id}`);
    } catch (error) {
      console.error(`❌ 작업 실패: ${job.id}`, error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      updateJobStatus(job.id, 'failed', errorMessage);
      jobQueue.fail(job.id);
    }
  }

  /**
   * 현재 상태
   */
  getStatus(): {
    isRunning: boolean;
    queueSize: number;
    processingCount: number;
  } {
    return {
      isRunning: this.isRunning,
      queueSize: jobQueue.size(),
      processingCount: jobQueue.processingCount(),
    };
  }
}

// 싱글톤 인스턴스
export const analysisWorker = new AnalysisWorker();
