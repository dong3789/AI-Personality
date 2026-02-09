import { NextResponse } from 'next/server';
import { analysisWorker } from '@/lib/worker';
import { checkOllamaConnection } from '@/lib/llm';
import { checkRateLimit } from '@/lib/github';

export async function GET() {
  try {
    // 1. 워커 상태
    const workerStatus = analysisWorker.getStatus();

    // 2. Ollama 연결 상태
    const ollamaConnected = await checkOllamaConnection();

    // 3. GitHub Rate Limit (선택사항)
    let githubRateLimit = null;
    try {
      githubRateLimit = await checkRateLimit();
    } catch (error) {
      // GitHub 토큰이 없으면 무시
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      worker: workerStatus,
      services: {
        ollama: ollamaConnected ? 'connected' : 'disconnected',
        github: githubRateLimit
          ? {
              remaining: githubRateLimit.remaining,
              resetAt: githubRateLimit.resetAt,
            }
          : 'not authenticated',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
