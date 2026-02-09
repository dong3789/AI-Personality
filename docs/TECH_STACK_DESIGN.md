# AI Personality Analyzer - 기술 설계 문서 (MVP)

## 프로젝트 개요
GitHub 레포지토리를 분석하여 "당신은 어떤 AI 모델 타입인가?"를 알려주는 **재미있는** 웹 애플리케이션

### 핵심 컨셉: "AI 성격 테스트 - 이메일로 결과 받기"
1. 사용자가 GitHub URL + 이메일 입력
2. 백그라운드에서 분석 (10-30초)
3. 분석 완료되면 이메일로 결과 전송
4. 이메일에는 공유 가능한 결과 페이지 링크 포함
5. **재미있는 요소**: AI 성격 캐릭터 이미지, 농담 섞인 설명, 공유 유도

---

## 1. 기술 스택 선정

### 1.1 프론트엔드
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI 기반)
- **Animation**: Framer Motion
- **Form Handling**: React Hook Form + Zod
- **State Management**: React Context API (필요시 Zustand)

**선정 이유**:
- Next.js는 SSR/SSG를 통한 SEO 최적화와 빠른 초기 로딩 제공
- TypeScript로 타입 안정성 확보
- Tailwind CSS로 빠른 UI 개발
- shadcn/ui로 일관된 디자인 시스템 구축

### 1.2 백엔드
- **API**: Next.js API Routes (App Router의 Route Handlers)
- **Runtime**: Node.js 20+
- **Database**: SQLite (간단한 결과 저장)
- **Cache**: 파일 시스템 기반 캐시 (`.cache/` 폴더)
- **Queue**: 간단한 메모리 큐 (Bull Queue는 과한 듯)
- **LLM**: 로컬 LLM (Ollama + qwen2.5:latest)
- **Email**: Nodemailer (SMTP) 또는 Resend API

**선정 이유**:
- Next.js API Routes로 프론트엔드와 백엔드 통합 관리
- SQLite로 가벼운 데이터 저장 (분석 결과, 이메일 로그)
- 파일 기반 캐시로 인프라 복잡도 최소화
- 로컬 LLM으로 토큰 비용 제로
- Nodemailer로 이메일 전송 (무료 SMTP)

### 1.3 외부 API
- **GitHub REST API v3**: 기본 레포지토리 정보 (인증 없이 60 req/h 사용)
- **API Client**: Octokit.js
- **Local LLM**: Ollama API (http://localhost:11434)

**사용할 API 엔드포인트**:
```
GitHub REST API:
- GET /repos/{owner}/{repo}
- GET /repos/{owner}/{repo}/commits
- GET /repos/{owner}/{repo}/languages
- GET /repos/{owner}/{repo}/readme

Ollama API:
- POST /api/generate (분석 결과 생성)
```

### 1.4 배포
- **Container**: Docker + Docker Compose
- **Orchestration**: Portainer (로컬 서버)
- **Services**:
  - `nextjs-app`: Next.js 애플리케이션
  - `ollama`: Ollama LLM 서버
  - `sqlite`: 볼륨 마운트로 데이터 영속화
- **Reverse Proxy**: Caddy (자동 HTTPS)

**장점**:
- 모든 서비스를 한 번에 관리
- Portainer UI로 쉬운 모니터링
- 로컬 서버에서 완전히 독립적으로 운영

---

## 2. 시스템 아키텍처

### 2.1 전체 흐름도 (이메일 기반)
```
[Client Browser]
    ↓ (1) GitHub URL + 이메일 입력
[Next.js Frontend]
    ↓ (2) POST /api/analyze
[Next.js API Route]
    ↓ (3) 분석 작업 큐에 추가
[Job Queue]
    ↓ (4) 즉시 응답: "이메일로 결과를 보내드릴게요!"
[Client] → "제출 완료!" 페이지 표시

--- 백그라운드 ---
[Background Worker]
    ↓ (5) 캐시 확인
[File Cache] → 히트 시 바로 (9)
    ↓ (6) 캐시 미스
[GitHub API] → 데이터 수집
    ↓ (7) Ollama LLM 분석 (10-30초)
[Analysis Result]
    ↓ (8) SQLite에 저장 + 캐시 저장
    ↓ (9) 이메일 전송 (HTML 템플릿)
[User Email]
    - 결과 요약 (AI 타입)
    - 재미있는 설명
    - 공유 링크: /result/{id}
    - 이미지: AI 캐릭터
```

### 2.2 데이터 처리 파이프라인

**Phase 1: 작업 큐 추가**
```typescript
interface AnalysisJob {
  id: string;                    // UUID
  githubUrl: string;
  email: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}
```

**Phase 2: 데이터 수집** (백그라운드)
```typescript
interface SimplifiedRepoData {
  owner: string;
  repo: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  openIssues: number;
  languages: Record<string, number>;
  recentCommits: { message: string; date: string }[];
  readmeContent: string;
}
```

**Phase 3: LLM 분석 결과**
```typescript
interface AIPersonality {
  aiType: 'GPT-4' | 'Claude' | 'Gemini' | 'LLaMA' | 'Mistral' | 'DeepSeek';
  confidence: number;              // 0-100
  emoji: string;                   // "🤖" "🧠" "✨" 등
  title: string;                   // "GPT-4형: 만능 해결사"
  oneLiner: string;                // "당신의 코드는 스위스 아미 나이프 같아요!"
  traits: string[];                // ["다재다능함", "균형잡힌", "문서화 마스터"]
  strengths: string[];
  funnyComment: string;            // "README 쓰는 걸 즐기는 희귀종"
  matchScore: number;
}
```

**Phase 4: 이메일 + 결과 페이지**
```typescript
interface AnalysisResult {
  id: string;
  repoUrl: string;
  email: string;
  result: AIPersonality;
  repoData: SimplifiedRepoData;
  analyzedAt: string;
  shareUrl: string;                // /result/{id}
}
```

### 2.3 캐싱 전략 (MVP - 파일 기반)

**캐시 키 전략**:
```typescript
const cacheKey = `${owner}-${repo}.json`;
const cachePath = `.cache/${cacheKey}`;
```

**캐시 구조**:
```typescript
{
  "owner": "facebook",
  "repo": "react",
  "analyzedAt": "2026-02-09T12:00:00Z",
  "expiresAt": "2026-02-10T12:00:00Z", // 24시간
  "githubData": { /* raw data */ },
  "result": { /* analysis result */ }
}
```

**캐시 무효화**:
- 24시간 경과 시
- 사용자가 "재분석" 버튼 클릭 시 (force=true)
- `.cache` 폴더는 .gitignore에 추가

---

## 3. GitHub API 연동

### 3.1 Rate Limit 대응 방안 (MVP)

**GitHub API Rate Limits**:
- **Unauthenticated**: 60 requests/hour (IP 기준)
- MVP에서는 인증 없이 시작

**대응 전략**:
1. **최소 API 호출**: 레포당 3-4개 엔드포인트만 호출
2. **Aggressive Caching**: 24시간 캐시로 재요청 방지
3. **Rate Limit 모니터링**: 응답 헤더 체크 후 사용자에게 알림
4. **에러 핸들링**: 한도 초과 시 친절한 에러 메시지

```typescript
// 간단한 Rate limit 체크
async function checkRateLimit(octokit) {
  const { data } = await octokit.rateLimit.get();
  const remaining = data.rate.remaining;

  if (remaining < 10) {
    const resetTime = new Date(data.rate.reset * 1000);
    throw new Error(
      `GitHub API 한도 초과. ${resetTime.toLocaleTimeString()}에 재시도하세요.`
    );
  }

  return remaining;
}
```

### 3.2 인증 처리 (MVP에서는 생략)

MVP에서는 OAuth 구현을 스킵하고, 추후 필요 시 추가:
- Phase 1 (MVP): 인증 없음, 60 req/h로 시작
- Phase 2: Personal Access Token 입력 옵션 추가
- Phase 3: GitHub OAuth 구현

---

## 4. 분석 알고리즘 로직 (MVP - LLM 기반)

### 4.1 MVP 접근: LLM에게 위임

기존 복잡한 메트릭 계산 대신, **로컬 LLM에게 GitHub 데이터를 주고 분석 요청**

**수집하는 GitHub 데이터** (최소한):
```typescript
interface SimplifiedRepoData {
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  openIssues: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;

  // 언어 분포
  languages: Record<string, number>;

  // 최근 커밋 (10개)
  recentCommits: {
    message: string;
    date: string;
  }[];

  // README 내용 (첫 500줄)
  readmeContent: string;
}
```

**LLM 프롬프트 전략**:
```typescript
const prompt = `
당신은 GitHub 레포지토리를 분석해서 "어떤 AI 모델 타입과 가장 비슷한가"를 판단하는 전문가입니다.

다음 GitHub 레포지토리 데이터를 분석하세요:

레포지토리: ${data.name}
설명: ${data.description}
주 언어: ${data.language}
Stars: ${data.stars}, Forks: ${data.forks}
생성일: ${data.createdAt}

언어 분포:
${JSON.stringify(data.languages, null, 2)}

최근 커밋 메시지:
${data.recentCommits.map(c => `- ${c.message}`).join('\n')}

README 내용:
${data.readmeContent.substring(0, 2000)}

---

다음 4가지 AI 모델 타입 중 하나를 선택하세요:

1. GPT-4 Type: 다재다능하고 균형잡힌, 잘 문서화된 프로젝트
2. Claude Type: 신중하고 세밀한, 안전성을 중시하는 프로젝트
3. Gemini Type: 멀티모달하고 혁신적인, 실험적인 프로젝트
4. LLaMA Type: 오픈소스 커뮤니티 기반, 효율적인 프로젝트

JSON 형식으로 응답하세요:
{
  "aiType": "GPT-4|Claude|Gemini|LLaMA",
  "confidence": 0-100,
  "reasoning": "선택한 이유를 2-3문장으로",
  "traits": ["특징1", "특징2", "특징3"],
  "strengths": ["강점1", "강점2"],
  "personality": "MBTI 스타일로 한 줄 요약"
}
`;
```

### 4.2 Ollama API 호출

```typescript
async function analyzeWithLLM(repoData: SimplifiedRepoData): Promise<AIPersonality> {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen2.5:latest', // 또는 llama3.2
      prompt: generatePrompt(repoData),
      stream: false,
      format: 'json'
    })
  });

  const result = await response.json();
  return JSON.parse(result.response);
}
```

**장점**:
- 복잡한 메트릭 계산 로직 불필요
- LLM이 더 "인간적인" 분석 제공
- 토큰 비용 제로 (로컬)
- 유연성: 프롬프트만 수정하면 분석 방식 변경 가능

**단점 & 대응**:
- ⚠️ **느린 응답 시간** (10-30초) → SSE 스트리밍으로 실시간 피드백
- ⚠️ **일관성 부족** → 프롬프트 엔지니어링 + temperature 조절
- ⚠️ **JSON 파싱 실패 가능** → Retry 로직 + fallback

---

## 5. 프로젝트 구조 (이메일 기반)

```
ai-personality-analyzer/
├── app/
│   ├── page.tsx                  # 홈: GitHub URL + 이메일 입력
│   ├── submitted/
│   │   └── page.tsx              # "이메일 확인하세요!" 페이지
│   ├── result/
│   │   └── [id]/
│   │       └── page.tsx          # 공유 가능한 결과 페이지
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts          # POST: 작업 큐 추가
│   │   └── health/
│   │       └── route.ts          # 헬스체크
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── badge.tsx
│   ├── SubmitForm.tsx            # URL + 이메일 입력 폼
│   ├── PersonalityCard.tsx       # 결과 카드 (이메일 & 웹)
│   ├── ShareButtons.tsx          # 공유 버튼들
│   └── FunnyLoader.tsx           # 재미있는 로딩 애니메이션
├── lib/
│   ├── github.ts                 # GitHub API
│   ├── llm.ts                    # Ollama API
│   ├── email.ts                  # 이메일 전송 (Nodemailer)
│   ├── db.ts                     # SQLite 클라이언트
│   ├── cache.ts                  # 파일 캐시
│   ├── queue.ts                  # 작업 큐 (간단한 메모리 큐)
│   ├── worker.ts                 # 백그라운드 워커
│   ├── types.ts                  # 타입 정의
│   └── utils.ts                  # 유틸 함수들
├── templates/
│   └── email/
│       ├── result.html           # 이메일 HTML 템플릿
│       └── result.txt            # 텍스트 버전
├── .cache/                       # 파일 캐시 (gitignore)
├── data/
│   └── database.sqlite           # SQLite DB
├── public/
│   ├── ai-characters/            # AI 타입별 캐릭터 이미지
│   │   ├── gpt4.png
│   │   ├── claude.png
│   │   ├── gemini.png
│   │   ├── llama.png
│   │   └── mistral.png
│   └── og-images/                # OG 이미지 (공유용)
├── docker-compose.yml            # Docker 설정
├── Dockerfile                    # Next.js 컨테이너
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 6. 환경 변수

```bash
# .env.example

# Ollama API (로컬 Ollama 사용)
OLLAMA_API_URL=http://host.docker.internal:11434

# Email (Nodemailer - Gmail SMTP 예시)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=AI Personality Analyzer <noreply@yoursite.com>

# 또는 Resend API (더 간단함)
# RESEND_API_KEY=re_xxxxxxxxxxxxx

# Database
DATABASE_PATH=./data/database.sqlite

# App
APP_URL=https://ai-personality.yourdomain.com
NODE_ENV=production

# Optional: GitHub PAT
# GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
```

---

## 7. 개발 로드맵 (1-2주)

### Day 1-2: 인프라 셋업
- [ ] Next.js 15 프로젝트 초기화
- [ ] Docker Compose 설정 (Next.js + Ollama)
- [ ] Ollama 모델 다운로드 (`ollama pull qwen2.5:latest`)
- [ ] SQLite 스키마 설계 및 초기화
- [ ] 기본 환경 변수 설정

### Day 3-4: 백엔드 코어
- [ ] GitHub API 클라이언트 (`lib/github.ts`)
- [ ] Ollama API 클라이언트 (`lib/llm.ts`)
- [ ] 파일 캐시 시스템 (`lib/cache.ts`)
- [ ] SQLite DB 헬퍼 (`lib/db.ts`)
- [ ] 작업 큐 시스템 (`lib/queue.ts`)

### Day 5-6: 분석 로직
- [ ] LLM 프롬프트 작성 (재미있게!)
- [ ] 분석 워커 (`lib/worker.ts`)
- [ ] 백그라운드 처리 로직
- [ ] 에러 핸들링 및 재시도

### Day 7-8: 이메일 시스템
- [ ] Nodemailer 설정 (`lib/email.ts`)
- [ ] HTML 이메일 템플릿 (`templates/email/result.html`)
- [ ] AI 캐릭터 이미지 제작/수집
- [ ] 이메일 전송 테스트

### Day 9-10: 프론트엔드
- [ ] 홈페이지: URL + 이메일 입력 폼 (재미있는 디자인!)
- [ ] "제출 완료!" 페이지
- [ ] 결과 페이지 (`/result/[id]`)
- [ ] AI 타입 카드 디자인
- [ ] 공유 버튼 (Twitter, LinkedIn, 복사)
- [ ] OG 이미지 동적 생성

### Day 11-12: 테스트 & 개선
- [ ] 다양한 레포지토리로 테스트
- [ ] 프롬프트 튜닝 (더 재미있게!)
- [ ] UI/UX 개선
- [ ] 성능 최적화

### Day 13-14: 배포
- [ ] Docker 이미지 빌드
- [ ] Portainer에 배포
- [ ] Caddy 리버스 프록시 설정 (HTTPS)
- [ ] 모니터링 설정
- [ ] 최종 테스트

### 추후 개선 사항
- [ ] 더 많은 AI 타입 추가
- [ ] 코드 스타일 분석 추가
- [ ] 비교 기능 (두 레포 비교)
- [ ] 리더보드 (가장 많이 분석된 레포)

---

## 8. MVP 핵심 기술 선택 근거

| 선택 | 이유 |
|------|------|
| **Next.js 15** | SSR/SSG, API Routes 통합, 빠른 개발 |
| **TypeScript** | 타입 안정성, 개발 생산성 향상 |
| **Tailwind CSS** | 빠른 UI 개발, 일관된 디자인 |
| **파일 캐시** | 인프라 복잡도 제로, 충분한 성능 |
| **Ollama (로컬 LLM)** | 토큰 비용 제로, 프라이버시, 실험 자유도 |
| **REST API (인증 없음)** | 빠른 시작, OAuth 구현 생략 |
| **SSE 스트리밍** | 긴 대기 시간 UX 개선 |

## 11. MVP 성공 기준

✅ **MVP 완성 조건**:
- [ ] GitHub URL 입력하면 분석 시작
- [ ] 실시간 진행상황 표시
- [ ] AI 타입 결과 화면 출력
- [ ] 재분석 가능
- [ ] 5개 이상 다른 레포로 테스트 성공

🎯 **MVP 목표**:
- "작동하는" 프로토타입
- 친구들에게 보여줄 수 있는 수준
- 아이디어 검증

---

## 9. 예상 비용 및 성능 (MVP)

### 비용
- **개발 단계**: $0 (로컬 개발)
- **배포 후**:
  - Vercel Hobby: $0 (제한적)
  - Ollama 서버: VPS $5-10/월 (Hetzner, DigitalOcean)
  - **총 예상**: $0 (로컬) ~ $10/월 (배포)

### 성능 현실
- **Initial Load**: < 2초
- **GitHub Data Collection**: 3-5초
- **LLM Analysis**: 10-30초 ⚠️ (로컬 LLM, CPU/GPU 의존)
- **Total Analysis Time**: 15-35초
- **Cache Hit**: < 500ms

**대기 시간 UX 개선**:
- SSE 스트리밍으로 실시간 진행상황 표시
  - "GitHub 데이터 수집 중..."
  - "README 분석 중..."
  - "커밋 패턴 분석 중..."
  - "AI 타입 매칭 중..."
- 진행바 + 예상 남은 시간 표시
- 재미있는 로딩 메시지

---

## 10. 보안 고려사항 (MVP)

1. **Input Validation**: GitHub URL 정규식 검증
   ```typescript
   const GITHUB_REPO_REGEX = /^https?:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/;
   ```

2. **Rate Limiting**: 클라이언트 측 요청 제한 (1분에 3번)

3. **캐시 보안**: `.cache` 폴더를 .gitignore에 추가

4. **환경 변수**: Ollama URL은 서버 측에서만 사용

5. **에러 처리**: 민감한 정보 노출 방지

**추후 고려** (Post-MVP):
- CORS 설정
- CSP Headers
- GitHub PAT 암호화 저장

---

**문서 작성**: 2026-02-09
**작성자**: 기술 스택 엔지니어
**버전**: 1.0
