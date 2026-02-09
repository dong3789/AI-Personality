import { NextRequest, NextResponse } from 'next/server';
import { parseGitHubUrl, isValidEmail, generateId } from '@/lib/utils';
import { createJob } from '@/lib/db';
import { jobQueue } from '@/lib/queue';
import { initApp } from '@/lib/init';
import type { AnalysisJob } from '@/lib/types';

// 앱 초기화
initApp();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { githubUrl, email } = body;

    // 1. 입력 검증
    if (!githubUrl || !email) {
      return NextResponse.json(
        { error: 'GitHub URL과 이메일을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 2. GitHub URL 검증
    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: '올바른 GitHub URL을 입력해주세요. 예: https://github.com/username/repo' },
        { status: 400 }
      );
    }

    // 3. 이메일 검증
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 주소를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 4. Job 생성
    const job: AnalysisJob = {
      id: generateId(),
      githubUrl,
      email,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // 5. DB에 저장
    createJob(job);

    // 6. 큐에 추가
    jobQueue.enqueue(job);

    console.log(`📝 새 작업 추가: ${job.id} - ${githubUrl}`);

    // 7. 즉시 응답
    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: '분석을 시작했습니다! 잠시 후 이메일로 결과를 보내드립니다.',
      estimatedTime: '30초 - 1분',
    });
  } catch (error) {
    console.error('분석 요청 에러:', error);

    return NextResponse.json(
      {
        error: '분석 요청 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
