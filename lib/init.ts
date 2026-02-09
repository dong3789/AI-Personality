import { initDatabase } from './db';
import { initCache } from './cache';
import { analysisWorker } from './worker';

let initialized = false;

/**
 * 애플리케이션 초기화
 */
export function initApp(): void {
  if (initialized) return;

  console.log('🚀 AI Personality Analyzer 초기화...');

  // 1. 데이터베이스 초기화
  initDatabase();
  console.log('✅ 데이터베이스 초기화 완료');

  // 2. 캐시 디렉토리 초기화
  initCache();
  console.log('✅ 캐시 초기화 완료');

  // 3. 백그라운드 워커 시작
  analysisWorker.start();
  console.log('✅ 워커 시작 완료');

  initialized = true;
  console.log('🎉 초기화 완료!\n');
}
