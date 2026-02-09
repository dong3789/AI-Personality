'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function AnalyzingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get('jobId');

  const [status, setStatus] = useState<string>('pending');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('분석 준비 중...');

  useEffect(() => {
    if (!jobId) {
      router.push('/');
      return;
    }

    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/job/${jobId}`);
        const data = await response.json();

        setStatus(data.status);

        if (data.status === 'pending') {
          setProgress(10);
          setMessage('🔍 분석 대기 중...');
        } else if (data.status === 'processing') {
          setProgress(50);
          setMessage('🤖 AI가 코드를 분석하고 있어요...');
        } else if (data.status === 'completed') {
          setProgress(100);
          setMessage('✅ 분석 완료!');

          // 결과 페이지로 이동
          setTimeout(() => {
            if (data.resultId) {
              router.push(`/result/${data.resultId}`);
            }
          }, 1000);
        } else if (data.status === 'failed') {
          setProgress(0);
          setMessage(`❌ 분석 실패: ${data.error || '알 수 없는 오류'}`);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('상태 확인 실패:', error);
      }
    };

    // 즉시 한 번 실행
    checkStatus();

    // 2초마다 폴링
    interval = setInterval(checkStatus, 2000);

    return () => clearInterval(interval);
  }, [jobId, router]);

  if (!jobId) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a2e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a2e_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] animate-pulse"></div>

      <div className="max-w-3xl w-full relative z-10">
        {/* Terminal Window */}
        <div className="bg-[#0d1117] rounded-lg border border-emerald-400/50 shadow-[0_0_30px_rgba(52,211,153,0.2)] overflow-hidden">
          {/* Terminal Header */}
          <div className="bg-[#161b22] px-4 py-3 flex items-center gap-2 border-b border-[#30363d]">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
            </div>
            <span className="text-[#8b949e] text-sm font-mono ml-4">
              ~/ai-analyzer/logs/analysis.log
            </span>
          </div>

          {/* Terminal Body */}
          <div className="p-8 font-mono space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <p className="text-emerald-400 flex items-center gap-2">
                <span className="animate-pulse">▶</span>
                <span>./analyze.sh --running</span>
              </p>
              <div className="h-px bg-[#30363d]"></div>
            </div>

            {/* Progress Steps */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                {progress >= 10 ? (
                  <span className="text-emerald-400">✓</span>
                ) : (
                  <span className="text-[#6e7681] animate-spin">⣾</span>
                )}
                <span className={progress >= 10 ? 'text-[#8b949e]' : 'text-emerald-400'}>
                  [01] Initializing analysis engine...
                </span>
              </div>

              <div className="flex items-center gap-3">
                {progress >= 50 ? (
                  <span className="text-emerald-400">✓</span>
                ) : progress >= 10 ? (
                  <span className="text-cyan-400 animate-spin">⣾</span>
                ) : (
                  <span className="text-[#6e7681]">○</span>
                )}
                <span className={
                  progress >= 50
                    ? 'text-[#8b949e]'
                    : progress >= 10
                    ? 'text-cyan-400'
                    : 'text-[#6e7681]'
                }>
                  [02] Fetching repository data...
                </span>
              </div>

              <div className="flex items-center gap-3">
                {progress >= 50 ? (
                  <span className="text-cyan-400 animate-spin">⣾</span>
                ) : (
                  <span className="text-[#6e7681]">○</span>
                )}
                <span className={progress >= 50 ? 'text-purple-400' : 'text-[#6e7681]'}>
                  [03] Running AI model analysis...
                </span>
              </div>

              <div className="flex items-center gap-3">
                {progress >= 100 ? (
                  <span className="text-emerald-400">✓</span>
                ) : (
                  <span className="text-[#6e7681]">○</span>
                )}
                <span className={progress >= 100 ? 'text-emerald-400' : 'text-[#6e7681]'}>
                  [04] Generating personality report...
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[#6e7681]">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-[#161b22] rounded overflow-hidden border border-[#30363d]">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 rounded transition-all duration-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Status Message */}
            <div className="bg-[#161b22] border border-[#30363d] rounded p-4">
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 text-lg animate-pulse">⚡</span>
                <div className="flex-1">
                  <p className="text-cyan-400 text-sm mb-1">Status</p>
                  <p className="text-[#c9d1d9] text-xs">
                    {status === 'pending' && '대기 중...'}
                    {status === 'processing' && 'AI가 코드를 분석하고 있어요...'}
                    {status === 'completed' && '분석 완료! 결과 페이지로 이동합니다...'}
                    {status === 'failed' && '분석 실패'}
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-emerald-500/5 border border-emerald-500/30 rounded p-4">
              <div className="flex items-start gap-3">
                <span className="text-emerald-400">#</span>
                <p className="text-[#8b949e] text-xs">
                  Analyzing code patterns, commit history, and project structure.
                  <br />
                  Estimated time: 30-60 seconds
                </p>
              </div>
            </div>

            {/* Blinking cursor */}
            <div className="flex items-center gap-2 text-emerald-400">
              <span>$</span>
              <span className="animate-pulse">_</span>
            </div>
          </div>
        </div>

        {/* Bottom hint */}
        <p className="text-[#6e7681] text-xs font-mono mt-4 text-center">
          💡 Detailed README = More accurate results
        </p>
      </div>
    </main>
  );
}

export default function AnalyzingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnalyzingContent />
    </Suspense>
  );
}
