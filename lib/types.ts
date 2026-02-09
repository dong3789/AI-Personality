// AI 타입 정의
export type AIType =
  | 'GPT-4'
  | 'GPT-3.5'
  | 'Claude Opus'
  | 'Claude Sonnet'
  | 'Gemini'
  | 'Llama'
  | 'Mistral'
  | 'Cohere';

// GitHub 레포지토리 데이터
export interface GitHubRepoData {
  owner: string;
  repo: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  languages: Record<string, number>;
  recentCommits: {
    message: string;
    date: string;
    author: string;
  }[];
  readmeContent: string;
  hasTests: boolean;
  hasCICD: boolean;
}

// AI 성격 분석 결과
export interface AIPersonality {
  aiType: AIType;
  confidence: number;
  emoji: string;
  title: string;
  oneLiner: string;
  traits: string[];
  strengths: string[];
  funnyComment: string;
  matchScore: number;
}

// 분석 작업
export interface AnalysisJob {
  id: string;
  githubUrl: string;
  email: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  error?: string;
}

// 최종 분석 결과
export interface AnalysisResult {
  id: string;
  repoUrl: string;
  email: string;
  result: AIPersonality;
  repoData: GitHubRepoData;
  analyzedAt: string;
  shareUrl: string;
}

// 캐시 데이터
export interface CacheData {
  owner: string;
  repo: string;
  analyzedAt: string;
  expiresAt: string;
  githubData: GitHubRepoData;
  result: AIPersonality;
}
