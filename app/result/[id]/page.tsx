'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { AnalysisResult } from '@/lib/types';

export default function ResultPage() {
  const params = useParams();
  const id = params.id as string;

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/result/${id}`);

        if (!response.ok) {
          throw new Error('결과를 불러올 수 없습니다.');
        }

        const data = await response.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin text-4xl text-emerald-400">⣾</div>
          <p className="text-[#8b949e] font-mono text-sm">
            <span className="text-emerald-400">$</span> Loading analysis results...
          </p>
        </div>
      </main>
    );
  }

  if (error || !result) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="bg-[#0d1117] border border-red-500/50 rounded-lg p-8 max-w-md">
          <p className="text-red-400 font-mono text-sm flex items-start gap-2">
            <span>✗</span>
            <span>Error: {error || '결과를 찾을 수 없습니다.'}</span>
          </p>
        </div>
      </main>
    );
  }

  const { aiType, emoji, title, oneLiner, traits, strengths, funnyComment, confidence } = result.result;

  // AI 타입별 네온 컬러
  const typeColors: Record<string, { border: string; glow: string; text: string }> = {
    'GPT-4': { border: 'border-emerald-400', glow: 'shadow-[0_0_30px_rgba(52,211,153,0.3)]', text: 'text-emerald-400' },
    'GPT-3.5': { border: 'border-cyan-400', glow: 'shadow-[0_0_30px_rgba(34,211,238,0.3)]', text: 'text-cyan-400' },
    'Claude Opus': { border: 'border-purple-400', glow: 'shadow-[0_0_30px_rgba(192,132,252,0.3)]', text: 'text-purple-400' },
    'Claude Sonnet': { border: 'border-violet-400', glow: 'shadow-[0_0_30px_rgba(167,139,250,0.3)]', text: 'text-violet-400' },
    'Gemini': { border: 'border-amber-400', glow: 'shadow-[0_0_30px_rgba(251,191,36,0.3)]', text: 'text-amber-400' },
    'Llama': { border: 'border-red-400', glow: 'shadow-[0_0_30px_rgba(248,113,113,0.3)]', text: 'text-red-400' },
    'Mistral': { border: 'border-fuchsia-400', glow: 'shadow-[0_0_30px_rgba(232,121,249,0.3)]', text: 'text-fuchsia-400' },
    'Cohere': { border: 'border-blue-400', glow: 'shadow-[0_0_30px_rgba(96,165,250,0.3)]', text: 'text-blue-400' },
  };

  const colors = typeColors[aiType] || { border: 'border-gray-400', glow: 'shadow-[0_0_30px_rgba(156,163,175,0.3)]', text: 'text-gray-400' };

  return (
    <main className="min-h-screen bg-[#0a0a0f] py-12 px-6 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a2e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a2e_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>

      <div className="max-w-5xl mx-auto space-y-6 relative z-10">
        {/* Main Result Terminal */}
        <div className={`bg-[#0d1117] rounded-lg border ${colors.border} ${colors.glow} overflow-hidden`}>
          {/* Terminal Header */}
          <div className="bg-[#161b22] px-4 py-3 flex items-center justify-between border-b border-[#30363d]">
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
              </div>
              <span className="text-[#8b949e] text-sm font-mono ml-4">analysis-result.log</span>
            </div>
            <div className={`${colors.text} text-xs font-mono px-3 py-1 bg-[#0d1117] rounded border ${colors.border}`}>
              confidence: {confidence}%
            </div>
          </div>

          {/* Main Result */}
          <div className="p-8 md:p-12">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <span className="text-emerald-400 font-mono">$</span>
                <div className="flex-1">
                  <p className="text-[#8b949e] font-mono text-sm mb-4">cat ./result.txt</p>

                  {/* ASCII Art Box */}
                  <div className={`border ${colors.border} rounded p-6 bg-[#0d1117]/50`}>
                    <div className="text-center space-y-4">
                      <div className="text-7xl md:text-8xl">{emoji}</div>
                      <div className={`text-3xl md:text-4xl font-bold ${colors.text} font-mono`}>
                        {title}
                      </div>
                      <p className="text-[#c9d1d9] text-base md:text-lg max-w-2xl mx-auto">
                        {oneLiner}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Funny Comment */}
        <div className="bg-[#0d1117] border border-amber-400/50 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <span className="text-amber-400 font-mono text-sm">//</span>
            <p className="text-amber-400/90 font-mono text-sm italic flex-1">
              {funnyComment}
            </p>
          </div>
        </div>

        {/* Traits & Strengths */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Traits */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg overflow-hidden">
            <div className="bg-[#161b22] px-4 py-3 border-b border-[#30363d]">
              <h3 className="text-cyan-400 font-mono text-sm flex items-center gap-2">
                <span>{'>'}</span> traits.json
              </h3>
            </div>
            <div className="p-6">
              <ul className="space-y-3 font-mono text-sm">
                {traits.map((trait, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#c9d1d9]">
                    <span className="text-cyan-400">•</span>
                    <span>{trait}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Strengths */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg overflow-hidden">
            <div className="bg-[#161b22] px-4 py-3 border-b border-[#30363d]">
              <h3 className="text-emerald-400 font-mono text-sm flex items-center gap-2">
                <span>{'>'}</span> strengths.json
              </h3>
            </div>
            <div className="p-6">
              <ul className="space-y-3 font-mono text-sm">
                {strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#c9d1d9]">
                    <span className="text-emerald-400">+</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Repository Info */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-6">
          <div className="space-y-3 font-mono text-sm">
            <div className="flex items-start gap-2">
              <span className="text-[#8b949e]">repo:</span>
              <a
                href={result.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${colors.text} hover:underline break-all`}
              >
                {result.repoUrl}
              </a>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#8b949e]">analyzed_at:</span>
              <span className="text-[#c9d1d9]">
                {new Date(result.analyzedAt).toLocaleString('ko-KR')}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#8b949e]">result_id:</span>
              <span className="text-[#6e7681]">{id}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="/"
            className="group flex-1 relative overflow-hidden bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-6 py-4 rounded-lg font-mono text-sm hover:bg-emerald-500/20 hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all text-center"
          >
            <span className="flex items-center justify-center gap-2">
              <span>$</span>
              <span>./analyze.sh --new</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
            </span>
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              const msg = document.getElementById('copy-msg');
              if (msg) {
                msg.classList.remove('hidden');
                setTimeout(() => msg.classList.add('hidden'), 2000);
              }
            }}
            className="group flex-1 relative overflow-hidden bg-[#161b22] border border-[#30363d] text-[#c9d1d9] px-6 py-4 rounded-lg font-mono text-sm hover:border-cyan-400 hover:text-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all text-center"
          >
            <span className="flex items-center justify-center gap-2">
              <span>$</span>
              <span>pbcopy &lt; result_url</span>
            </span>
          </button>
        </div>

        {/* Copy confirmation */}
        <div id="copy-msg" className="hidden bg-emerald-500/10 border border-emerald-500/50 rounded-lg p-4">
          <p className="text-emerald-400 font-mono text-sm text-center">
            ✓ URL copied to clipboard
          </p>
        </div>
      </div>
    </main>
  );
}
