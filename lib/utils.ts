import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// GitHub URL 파싱
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // URL에서 # 이후 부분 제거 (fragment)
  const cleanUrl = url.split('#')[0].trim();

  const regex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?$/;
  const match = cleanUrl.match(regex);

  if (!match) {
    return null;
  }

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ''), // .git 제거
  };
}

// 이메일 유효성 검사
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// UUID 생성 (간단한 버전)
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 날짜 포맷팅
export function formatDate(date: Date): string {
  return date.toISOString();
}

// 에러 메시지 생성
export function createErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
