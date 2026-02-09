import type { GitHubRepoData, AIPersonality, AIType } from './types';

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';

/**
 * Ollama LLM을 사용한 레포지토리 분석
 */
export async function analyzeWithLLM(
  repoData: GitHubRepoData
): Promise<AIPersonality> {
  const prompt = generatePrompt(repoData);

  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen2.5:14b',
        prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.7,
          top_p: 0.9,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API 에러: ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.response);

    // AI 타입별 이모지 및 메타데이터 추가
    return enrichResult(result);
  } catch (error) {
    console.error('LLM 분석 에러:', error);

    // Fallback: 간단한 규칙 기반 분석
    return fallbackAnalysis(repoData);
  }
}

/**
 * LLM 프롬프트 생성
 */
function generatePrompt(repoData: GitHubRepoData): string {
  const languageList = Object.entries(repoData.languages)
    .map(([lang, bytes]) => `${lang}: ${bytes} bytes`)
    .join('\n');

  const commitMessages = repoData.recentCommits
    .slice(0, 5)
    .map((c) => `- ${c.message}`)
    .join('\n');

  const readmePreview = repoData.readmeContent
    .substring(0, 2000)
    .replace(/\n+/g, '\n');

  return `당신은 GitHub 레포지토리를 분석하여 "어떤 AI 모델 타입과 가장 비슷한가"를 판단하는 전문가입니다.

다음 GitHub 레포지토리 데이터를 분석하세요:

**레포지토리**: ${repoData.name}
**설명**: ${repoData.description || '없음'}
**주 언어**: ${repoData.language || '알 수 없음'}
**Stars**: ${repoData.stars}, **Forks**: ${repoData.forks}
**생성일**: ${repoData.createdAt}
**테스트**: ${repoData.hasTests ? '있음' : '없음'}
**CI/CD**: ${repoData.hasCICD ? '있음' : '없음'}

**언어 분포**:
${languageList}

**최근 커밋 메시지**:
${commitMessages}

**README 내용**:
${readmePreview}

---

다음 8가지 AI 모델 타입 중 하나를 선택하세요:

1. **GPT-4** (The Perfectionist): 완벽주의자, 철저한 문서화, 높은 코드 품질
2. **GPT-3.5** (The Pragmatist): 실용주의자, 빠른 구현, 효율성 중시
3. **Claude Opus** (The Architect): 설계자, 체계적 구조, 안전성 강조
4. **Claude Sonnet** (The Balanced Creator): 균형잡힌, 창의적, 협업 친화적
5. **Gemini** (The Multi-Tasker): 다재다능, 여러 언어 사용, 실험적
6. **Llama** (The Open Source Champion): 오픈소스 정신, 커뮤니티 중심
7. **Mistral** (The Efficient Minimalist): 미니멀리스트, 효율성 극대화, 간결
8. **Cohere** (The Specialist): 특정 분야 전문화, 성능 최적화

JSON 형식으로만 응답하세요:
{
  "aiType": "GPT-4|GPT-3.5|Claude Opus|Claude Sonnet|Gemini|Llama|Mistral|Cohere",
  "confidence": 85,
  "reasoning": "선택한 이유를 2-3문장으로",
  "traits": ["특징1", "특징2", "특징3"],
  "strengths": ["강점1", "강점2"],
  "funnyComment": "재미있는 한 줄 코멘트 (한국어)"
}`;
}

/**
 * LLM 결과에 메타데이터 추가
 */
function enrichResult(result: any): AIPersonality {
  const aiTypeMetadata: Record<AIType, { emoji: string; title: string }> = {
    'GPT-4': {
      emoji: '🧠',
      title: 'GPT-4형: 만능 해결사',
    },
    'GPT-3.5': {
      emoji: '⚡',
      title: 'GPT-3.5형: 실용주의자',
    },
    'Claude Opus': {
      emoji: '📚',
      title: 'Claude Opus형: 신중한 완벽주의자',
    },
    'Claude Sonnet': {
      emoji: '✨',
      title: 'Claude Sonnet형: 균형잡힌 창작자',
    },
    Gemini: {
      emoji: '🌟',
      title: 'Gemini형: 혁신적인 실험가',
    },
    Llama: {
      emoji: '🦙',
      title: 'Llama형: 오픈소스 전도사',
    },
    Mistral: {
      emoji: '🌪️',
      title: 'Mistral형: 효율의 달인',
    },
    Cohere: {
      emoji: '🔍',
      title: 'Cohere형: 철학하는 코더',
    },
  };

  const aiType = result.aiType as AIType;
  const metadata = aiTypeMetadata[aiType];

  return {
    aiType,
    confidence: result.confidence || 80,
    emoji: metadata.emoji,
    title: metadata.title,
    oneLiner: result.reasoning || '',
    traits: result.traits || [],
    strengths: result.strengths || [],
    funnyComment: result.funnyComment || '분석 완료!',
    matchScore: result.confidence || 80,
  };
}

/**
 * Fallback 분석 (LLM 실패 시)
 */
function fallbackAnalysis(repoData: GitHubRepoData): AIPersonality {
  // 간단한 규칙 기반 분석
  let aiType: AIType = 'GPT-3.5';

  const readmeLength = repoData.readmeContent.length;
  const languageCount = Object.keys(repoData.languages).length;

  if (readmeLength > 5000 && repoData.hasTests) {
    aiType = 'GPT-4';
  } else if (languageCount >= 5) {
    aiType = 'Gemini';
  } else if (repoData.hasCICD) {
    aiType = 'Claude Opus';
  }

  return enrichResult({
    aiType,
    confidence: 70,
    reasoning: '자동 분석 결과입니다.',
    traits: ['분석됨', '자동 판정'],
    strengths: ['기본 분석'],
    funnyComment: 'LLM 분석이 실패하여 간단히 분석했습니다.',
  });
}

/**
 * Ollama 연결 확인
 */
export async function checkOllamaConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/version`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
