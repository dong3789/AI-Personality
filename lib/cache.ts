import fs from 'fs/promises';
import path from 'path';
import type { CacheData, GitHubRepoData, AIPersonality } from './types';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간

/**
 * 캐시 디렉토리 초기화
 */
export async function initCache(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('캐시 디렉토리 생성 실패:', error);
  }
}

/**
 * 캐시 키 생성
 */
function getCacheKey(owner: string, repo: string): string {
  return `${owner}-${repo}.json`;
}

/**
 * 캐시 파일 경로
 */
function getCachePath(owner: string, repo: string): string {
  return path.join(CACHE_DIR, getCacheKey(owner, repo));
}

/**
 * 캐시 조회
 */
export async function getCache(
  owner: string,
  repo: string
): Promise<CacheData | null> {
  try {
    const cachePath = getCachePath(owner, repo);
    const content = await fs.readFile(cachePath, 'utf-8');
    const data: CacheData = JSON.parse(content);

    // 만료 확인
    const now = new Date().getTime();
    const expiresAt = new Date(data.expiresAt).getTime();

    if (now > expiresAt) {
      // 만료된 캐시 삭제
      await deleteCache(owner, repo);
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
}

/**
 * 캐시 저장
 */
export async function setCache(
  owner: string,
  repo: string,
  githubData: GitHubRepoData,
  result: AIPersonality
): Promise<void> {
  try {
    await initCache();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_DURATION);

    const cacheData: CacheData = {
      owner,
      repo,
      analyzedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      githubData,
      result,
    };

    const cachePath = getCachePath(owner, repo);
    await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2), 'utf-8');
  } catch (error) {
    console.error('캐시 저장 실패:', error);
  }
}

/**
 * 캐시 삭제
 */
export async function deleteCache(owner: string, repo: string): Promise<void> {
  try {
    const cachePath = getCachePath(owner, repo);
    await fs.unlink(cachePath);
  } catch (error) {
    // 파일이 없으면 무시
  }
}

/**
 * 전체 캐시 정리
 */
export async function clearAllCache(): Promise<number> {
  try {
    const files = await fs.readdir(CACHE_DIR);
    let deleted = 0;

    for (const file of files) {
      if (file.endsWith('.json')) {
        await fs.unlink(path.join(CACHE_DIR, file));
        deleted++;
      }
    }

    return deleted;
  } catch (error) {
    return 0;
  }
}

/**
 * 만료된 캐시 정리
 */
export async function cleanExpiredCache(): Promise<number> {
  try {
    const files = await fs.readdir(CACHE_DIR);
    const now = new Date().getTime();
    let deleted = 0;

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(CACHE_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const data: CacheData = JSON.parse(content);

      const expiresAt = new Date(data.expiresAt).getTime();
      if (now > expiresAt) {
        await fs.unlink(filePath);
        deleted++;
      }
    }

    return deleted;
  } catch (error) {
    return 0;
  }
}
