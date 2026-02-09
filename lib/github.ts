import { Octokit } from 'octokit';
import type { GitHubRepoData } from './types';

// GitHub API 클라이언트
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // 선택사항
});

/**
 * GitHub 레포지토리 데이터 수집
 */
export async function fetchGitHubRepo(
  owner: string,
  repo: string
): Promise<GitHubRepoData> {
  try {
    // 1. 기본 레포지토리 정보
    const { data: repoData } = await octokit.rest.repos.get({
      owner,
      repo,
    });

    // 2. 언어 분포
    const { data: languages } = await octokit.rest.repos.listLanguages({
      owner,
      repo,
    });

    // 3. 최근 커밋 (최대 10개)
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: 10,
    });

    const recentCommits = commits.map((commit) => ({
      message: commit.commit.message,
      date: commit.commit.author?.date || '',
      author: commit.commit.author?.name || 'Unknown',
    }));

    // 4. README 내용
    let readmeContent = '';
    try {
      const { data: readme } = await octokit.rest.repos.getReadme({
        owner,
        repo,
      });

      // Base64 디코딩
      if (readme.content) {
        readmeContent = Buffer.from(readme.content, 'base64').toString('utf-8');
      }
    } catch (error) {
      console.warn('README not found');
      readmeContent = '';
    }

    // 5. 테스트 및 CI/CD 확인
    const hasTests = await checkForTests(owner, repo);
    const hasCICD = await checkForCICD(owner, repo);

    return {
      owner,
      repo,
      name: repoData.name,
      description: repoData.description,
      language: repoData.language,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssues: repoData.open_issues_count,
      createdAt: repoData.created_at || '',
      updatedAt: repoData.updated_at || '',
      pushedAt: repoData.pushed_at || '',
      languages,
      recentCommits,
      readmeContent,
      hasTests,
      hasCICD,
    };
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error(
        `레포지토리를 찾을 수 없습니다. URL을 확인하거나, Private 레포지토리는 분석할 수 없습니다.`
      );
    }
    if (error.status === 403) {
      throw new Error(
        `GitHub API Rate Limit 초과. 잠시 후 다시 시도해주세요.`
      );
    }
    if (error instanceof Error) {
      throw new Error(`GitHub API 에러: ${error.message}`);
    }
    throw error;
  }
}

/**
 * 테스트 디렉토리 확인
 */
async function checkForTests(owner: string, repo: string): Promise<boolean> {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: '',
    });

    if (Array.isArray(data)) {
      const dirs = data.map((item) => item.name.toLowerCase());
      return dirs.some(
        (dir) =>
          dir.includes('test') ||
          dir.includes('spec') ||
          dir.includes('__tests__')
      );
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * CI/CD 설정 확인
 */
async function checkForCICD(owner: string, repo: string): Promise<boolean> {
  try {
    // .github/workflows 확인
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: '.github/workflows',
    });

    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    // .travis.yml, .circleci 등 확인
    const ciFiles = ['.travis.yml', '.circleci/config.yml', '.gitlab-ci.yml'];

    for (const file of ciFiles) {
      try {
        await octokit.rest.repos.getContent({
          owner,
          repo,
          path: file,
        });
        return true;
      } catch {
        continue;
      }
    }

    return false;
  }
}

/**
 * Rate Limit 확인
 */
export async function checkRateLimit(): Promise<{
  remaining: number;
  resetAt: Date;
}> {
  const { data } = await octokit.rest.rateLimit.get();

  return {
    remaining: data.rate.remaining,
    resetAt: new Date(data.rate.reset * 1000),
  };
}
