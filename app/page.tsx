'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [githubUrl, setGithubUrl] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [githubFocused, setGithubFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ githubUrl, email }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = `/analyzing?jobId=${data.jobId}`;
      } else {
        setError(data.error || '분석 요청에 실패했습니다.');
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a2e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a2e_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]"></div>

      <div className="max-w-4xl w-full relative z-10">
        {/* ASCII Art Header */}
        <pre className="text-emerald-400 text-xs md:text-sm mb-8 font-mono opacity-60 overflow-x-auto">
{`    ___    ____   ____                                ___ __
   /   |  /  _/  / __ \\___  ______________  ____  ____ _/ (_) /___  __
  / /| |  / /   / /_/ / _ \\/ ___/ ___/ __ \\/ __ \\/ __ \`/ / / __/ / / /
 / ___ |_/ /   / ____/  __/ /  (__  ) /_/ / / / / /_/ / / / /_/ /_/ /
/_/  |_/___/  /_/    \\___/_/  /____/\\____/_/ /_/\\__,_/_/_/\\__/\\__, /
                                                              /____/   `}
        </pre>

        {/* Terminal Window */}
        <div className="bg-[#0d1117] rounded-lg border border-[#30363d] shadow-2xl overflow-hidden">
          {/* Terminal Header */}
          <div className="bg-[#161b22] px-4 py-3 flex items-center gap-2 border-b border-[#30363d]">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
            </div>
            <span className="text-[#8b949e] text-sm font-mono ml-4">~/ai-personality-analyzer</span>
          </div>

          {/* Terminal Body */}
          <div className="p-8 font-mono">
            <div className="space-y-6">
              {/* Welcome Text */}
              <div className="space-y-2">
                <p className="text-[#58a6ff]">
                  <span className="text-emerald-400">$</span> cat README.md
                </p>
                <p className="text-[#8b949e] text-sm md:text-base">
                  # AI Personality Analyzer
                </p>
                <p className="text-[#c9d1d9] text-sm">
                  Discover which AI model matches your GitHub repository&apos;s personality.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* GitHub URL Input */}
                <div>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="text-emerald-400">$</span>
                    <span className="text-[#8b949e]">git clone</span>
                  </div>
                  <div className={`bg-[#161b22] border rounded px-4 py-3 transition-all ${
                    githubFocused ? 'border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'border-[#30363d]'
                  }`}>
                    <input
                      type="text"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      onFocus={() => setGithubFocused(true)}
                      onBlur={() => setGithubFocused(false)}
                      placeholder="https://github.com/username/repo"
                      className="w-full bg-transparent text-[#c9d1d9] placeholder-[#6e7681] focus:outline-none font-mono text-sm"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="text-emerald-400">$</span>
                    <span className="text-[#8b949e]">echo</span>
                    <span className="text-[#c9d1d9]">&quot;your-email&quot; &gt;&gt; .env</span>
                  </div>
                  <div className={`bg-[#161b22] border rounded px-4 py-3 transition-all ${
                    emailFocused ? 'border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'border-[#30363d]'
                  }`}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      placeholder="dev@example.com"
                      className="w-full bg-transparent text-[#c9d1d9] placeholder-[#6e7681] focus:outline-none font-mono text-sm"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`group relative w-full md:w-auto px-6 py-3 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 font-mono rounded transition-all ${
                      loading
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-emerald-500/20 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-emerald-400">$</span>
                      {loading ? (
                        <>
                          <span className="inline-block animate-pulse">./analyze.sh</span>
                          <span className="inline-block animate-spin">⣾</span>
                        </>
                      ) : (
                        <>
                          <span>./analyze.sh --run</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
                        </>
                      )}
                    </span>
                  </button>
                </div>

                {/* Success Message */}
                {message && (
                  <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/50 rounded">
                    <p className="text-emerald-400 font-mono text-sm flex items-center gap-2">
                      <span>✓</span>
                      <span>{message}</span>
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded">
                    <p className="text-red-400 font-mono text-sm flex items-start gap-2">
                      <span>✗</span>
                      <span>Error: {error}</span>
                    </p>
                  </div>
                )}
              </form>

              {/* Stats Footer */}
              <div className="pt-6 border-t border-[#30363d] grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-cyan-400 font-mono text-xl font-bold">8</div>
                  <div className="text-[#6e7681] text-xs font-mono">models</div>
                </div>
                <div>
                  <div className="text-emerald-400 font-mono text-xl font-bold">&lt;1s</div>
                  <div className="text-[#6e7681] text-xs font-mono">analysis</div>
                </div>
                <div>
                  <div className="text-purple-400 font-mono text-xl font-bold">$0</div>
                  <div className="text-[#6e7681] text-xs font-mono">cost</div>
                </div>
              </div>

              {/* Privacy Note */}
              <p className="text-[#6e7681] text-xs font-mono pt-2">
                <span className="text-emerald-400">#</span> Your data is analyzed securely and not stored
              </p>
            </div>
          </div>
        </div>

        {/* Bottom hint */}
        <p className="text-[#6e7681] text-xs font-mono mt-4 text-center">
          Press <kbd className="px-2 py-1 bg-[#161b22] border border-[#30363d] rounded">Enter</kbd> to submit
        </p>
      </div>
    </main>
  );
}
