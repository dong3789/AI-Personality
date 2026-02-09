import type { AnalysisJob } from './types';

// 간단한 메모리 기반 큐
class JobQueue {
  private queue: AnalysisJob[] = [];
  private processing: Set<string> = new Set();

  /**
   * 작업 추가
   */
  enqueue(job: AnalysisJob): void {
    this.queue.push(job);
  }

  /**
   * 다음 작업 가져오기
   */
  dequeue(): AnalysisJob | null {
    // 처리 중이 아닌 첫 번째 작업
    const job = this.queue.find((j) => !this.processing.has(j.id));

    if (job) {
      this.processing.add(job.id);
      // 큐에서는 제거하지 않음 (완료되면 제거)
    }

    return job || null;
  }

  /**
   * 작업 완료 처리
   */
  complete(jobId: string): void {
    this.processing.delete(jobId);
    this.queue = this.queue.filter((j) => j.id !== jobId);
  }

  /**
   * 작업 실패 처리
   */
  fail(jobId: string): void {
    this.processing.delete(jobId);
    // 실패한 작업도 큐에서 제거
    this.queue = this.queue.filter((j) => j.id !== jobId);
  }

  /**
   * 큐 크기
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * 처리 중인 작업 수
   */
  processingCount(): number {
    return this.processing.size;
  }

  /**
   * 큐가 비어있는지
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }
}

// 싱글톤 인스턴스
export const jobQueue = new JobQueue();
