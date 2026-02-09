# AI Personality Analyzer - 최종 통합 설계서

**프로젝트명**: AI Personality Analyzer
**목표**: GitHub 레포지토리를 분석해서 "당신은 어떤 AI 모델 타입인가"를 알려주는 재미있는 웹 서비스
**개발 기간**: 1-2주 (MVP)
**작성일**: 2026-02-09

---

## 📋 Executive Summary

### 핵심 컨셉
사용자가 GitHub URL과 이메일을 입력하면, 백그라운드에서 레포지토리를 분석하여 **MBTI 스타일의 AI 성격 유형**을 판별하고, 결과를 이메일로 전송하는 재미있는 서비스입니다.

### 주요 특징
- 🎯 **8가지 AI 타입**: GPT-4, GPT-3.5, Claude Opus, Claude Sonnet, Gemini, Llama, Mistral, Cohere
- 📧 **이메일 기반 워크플로우**: 빠른 제출 → 백그라운드 분석 → 이메일 알림
- 🤖 **로컬 LLM 분석**: Ollama + qwen2.5로 토큰 비용 제로
- 🎨 **재미있는 UX**: 유머러스한 설명, AI 캐릭터, 공유 유도
- 🚀 **간단한 배포**: Docker Compose + Portainer

### 차별점
1. **즉시 응답**: 긴 분석 시간을 기다릴 필요 없이 즉시 제출 완료
2. **재미 중심**: 기술적 분석보다 "공유하고 싶은" 재미있는 결과
3. **제로 비용**: 로컬 LLM으로 완전 무료 운영 가능
4. **프라이버시**: 데이터를 외부로 전송하지 않음

---

## 🎯 팀별 설계 요약

### 1. QA/기획 (qa-planner)
**문서**: `AI_PERSONALITY_ANALYZER_DESIGN.md`

**AI 타입 정의 (8개)**:
1. **GPT-4 (The Perfectionist)**: 완벽주의자, 철저한 문서화
2. **GPT-3.5 (The Pragmatist)**: 실용주의자, 빠른 구현
3. **Claude Opus (The Architect)**: 설계자, 체계적 구조
4. **Claude Sonnet (The Balanced Creator)**: 균형잡힌 창작자
5. **Gemini (The Multi-Tasker)**: 다재다능, 다양한 기술 스택
6. **Llama (The Open Source Champion)**: 오픈소스 정신
7. **Mistral (The Efficient Minimalist)**: 미니멀리스트
8. **Cohere (The Specialist)**: 특정 분야 전문가

**분석 항목 (6개)**:
- 커밋 분석 (빈도, 크기, 메시지, 시간대)
- 코드 복잡도 (파일 크기, 함수 길이, 의존성)
- 문서화 수준 (README, 주석 비율, 문서 파일)
- 언어 다양성 (사용 언어 수, 주 언어, 분포)
- 프로젝트 완성도 (테스트, CI/CD, 활동성)
- 협업 활동 (이슈, PR, contributor)

**사용자 플로우**:
```
홈 → URL+이메일 입력 → 제출 완료 → 이메일 수신 → 결과 페이지 → 공유
```

---

### 2. 기술 엔지니어 (tech-architect)
**문서**: `TECH_STACK_DESIGN.md`, `DOCKER_COMPOSE_DESIGN.md`, `FUN_ELEMENTS_DESIGN.md`

**기술 스택**:
```yaml
Frontend:
  - Next.js 15 (App Router)
  - TypeScript
  - Tailwind CSS
  - shadcn/ui
  - Framer Motion

Backend:
  - Next.js API Routes
  - SQLite (결과 저장)
  - 파일 기반 캐시
  - 메모리 큐 (작업 관리)

LLM:
  - Ollama (로컬)
  - qwen2.5:latest 모델

Email:
  - Nodemailer (SMTP)
  - HTML 템플릿

External:
  - GitHub REST API (v3)
  - Octokit.js

Deploy:
  - Docker Compose
  - Portainer
  - Caddy (HTTPS)
```

**시스템 아키텍처**:
```
[Client] → URL + 이메일 입력
         ↓
[API Route] → 작업 큐 추가 → 즉시 응답: "이메일 확인하세요!"
         ↓
[Background Worker]
         → GitHub API (데이터 수집)
         → Ollama LLM (분석, 10-30초)
         → SQLite 저장
         → 이메일 전송 (HTML)
         ↓
[User Email] → 결과 링크 클릭
         ↓
[Result Page] → 공유 기능
```

**MVP 핵심 결정**:
- ✅ OAuth 제거 → 인증 없는 GitHub API (60 req/h)
- ✅ 이메일 기반 → 긴 분석 시간 UX 문제 해결
- ✅ 로컬 LLM → 토큰 비용 제로, 실험 자유도 높음
- ✅ 파일 캐시 → Redis 등 인프라 복잡도 제거
- ✅ Docker → 간편한 배포와 관리

**개발 일정**: 1-2주
```
Day 1-2:  인프라 셋업
Day 3-4:  백엔드 코어
Day 5-6:  분석 로직
Day 7-8:  이메일 시스템
Day 9-10: 프론트엔드
Day 11-12: 테스트 & 개선
Day 13-14: 배포
```

---

### 3. UI/UX 디자이너 (ui-designer)
**문서**: `ai-personality-analyzer-design.md`

**디자인 컨셉**:
- **톤앤매너**: 재미있고 친근한 (Playful & Friendly)
- **스타일**: 테크 감성 + 현대적 미니멀
- **목표**: "공유하고 싶은" 인터랙티브한 경험

**컬러 팔레트**:
```css
Primary:   #6366f1 (Indigo) - 신뢰, 테크
Secondary: #8b5cf6 (Violet) - 창의성, AI
Accent:    #ec4899 (Pink)   - 재미, 활기

AI Type Colors:
  GPT-4:     #10b981 (Emerald)
  Claude:    #3b82f6 (Blue)
  Gemini:    #f59e0b (Amber)
  Llama:     #ef4444 (Red)
  Mistral:   #8b5cf6 (Violet)
  DeepSeek:  #06b6d4 (Cyan)
```

**3개 페이지 디자인**:

1. **랜딩 페이지**:
   - Hero Section: 큰 타이틀 + URL 입력 폼
   - How It Works: 3단계 프로세스
   - AI 타입 미리보기 슬라이더
   - 실제 Tailwind CSS 코드 제공

2. **로딩 페이지** (제출 완료):
   - "이메일을 확인하세요!" 메시지
   - 재미있는 애니메이션
   - 예상 소요 시간 안내

3. **결과 페이지**:
   - AI 타입 히어로 카드 (대형, 그라디언트)
   - 성격 특징 그리드
   - 분석 통계 차트
   - 공유 버튼들
   - 다른 레포 분석하기

**애니메이션**:
- Framer Motion으로 페이지 전환
- 카드 호버 효과
- 로딩 스피너 & 진행바
- 결과 등장 애니메이션

**반응형 디자인**:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Mobile: 1열, Tablet: 2열, Desktop: 3열 */}
</div>
```

---

## 🔧 통합 설계 결정 사항

### 아키텍처 통합
```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│  (Next.js Frontend + Tailwind CSS + Framer Motion)      │
└──────────────────┬──────────────────────────────────────┘
                   │ POST /api/analyze
                   ↓
┌─────────────────────────────────────────────────────────┐
│               Next.js API Routes                         │
│  - 작업 큐에 추가                                        │
│  - 즉시 응답: "이메일로 결과를 보내드릴게요!"            │
└──────────────────┬──────────────────────────────────────┘
                   │
    ┌──────────────┴──────────────┐
    │                             │
    ↓                             ↓
┌─────────────┐           ┌──────────────┐
│  SQLite DB  │           │ 파일 캐시     │
│  (결과저장) │           │ (.cache/)    │
└─────────────┘           └──────────────┘
    ↑
    │ 백그라운드 워커
    │
┌───┴──────────────────────────────────────────────────────┐
│  Background Worker                                        │
│  1. GitHub API (Octokit) → 데이터 수집                   │
│  2. Ollama LLM → 분석 (10-30초)                         │
│  3. SQLite 저장 + 캐시 저장                              │
│  4. Nodemailer → 이메일 전송 (HTML 템플릿)               │
└───────────────────────────────────────────────────────────┘
                   ↓
            ┌─────────────┐
            │  User Email │
            │  (HTML)     │
            └──────┬──────┘
                   │ 링크 클릭
                   ↓
            ┌─────────────┐
            │ Result Page │
            │ (/result/id)│
            └─────────────┘
```

### AI 타입 매칭 로직 (LLM 기반)
```typescript
// 수집 데이터
interface SimplifiedRepoData {
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  languages: Record<string, number>;
  recentCommits: { message: string; date: string }[];
  readmeContent: string;
}

// LLM 프롬프트
const prompt = `
당신은 GitHub 레포지토리를 분석하여 AI 모델 타입을 판별하는 전문가입니다.

레포지토리 데이터:
${JSON.stringify(repoData)}

다음 8가지 AI 타입 중 하나를 선택하세요:
1. GPT-4 (만능 해결사)
2. GPT-3.5 (실용주의자)
3. Claude Opus (설계자)
4. Claude Sonnet (균형창작자)
5. Gemini (다재다능)
6. Llama (오픈소스)
7. Mistral (미니멀리스트)
8. Cohere (전문가)

JSON 응답:
{
  "aiType": "GPT-4|Claude|...",
  "confidence": 0-100,
  "traits": ["특징1", "특징2"],
  "strengths": ["강점1", "강점2"],
  "funnyComment": "재미있는 한 줄 코멘트"
}
`;

// Ollama API 호출
const response = await fetch('http://ollama:11434/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    model: 'qwen2.5:latest',
    prompt,
    format: 'json'
  })
});
```

### 이메일 템플릿 통합
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* 그라디언트 배경, 카드 디자인, 애니메이션 */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">{{EMOJI}}</div>
      <h1>분석 완료!</h1>
    </div>

    <div class="content">
      <div class="ai-type">{{AI_TYPE}}</div>
      <div class="one-liner">{{ONE_LINER}}</div>

      <div class="funny-comment">💬 {{FUNNY_COMMENT}}</div>

      <div class="traits">
        {{#each TRAITS}}
        <div class="trait">{{this}}</div>
        {{/each}}
      </div>

      <a href="{{RESULT_URL}}" class="button">
        🔗 결과 자세히 보기
      </a>

      <a href="{{TWITTER_SHARE_URL}}">
        🐦 트위터에 공유
      </a>
    </div>
  </div>
</body>
</html>
```

---

## 📁 프로젝트 구조 (최종)

```
ai-personality-analyzer/
├── app/
│   ├── page.tsx                    # 랜딩: URL + 이메일 입력
│   ├── submitted/
│   │   └── page.tsx                # "이메일 확인하세요!"
│   ├── result/
│   │   └── [id]/
│   │       └── page.tsx            # 공유 가능한 결과 페이지
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts            # POST: 작업 큐 추가
│   │   ├── og/
│   │   │   └── [id]/route.tsx      # OG 이미지 동적 생성
│   │   └── health/
│   │       └── route.ts            # 헬스체크
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                         # shadcn/ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── badge.tsx
│   ├── SubmitForm.tsx              # URL + 이메일 입력 폼
│   ├── PersonalityCard.tsx         # 결과 카드
│   ├── ShareButtons.tsx            # 공유 버튼
│   └── LoadingAnimation.tsx        # 로딩 애니메이션
│
├── lib/
│   ├── github.ts                   # GitHub API 클라이언트
│   ├── llm.ts                      # Ollama API 클라이언트
│   ├── email.ts                    # Nodemailer
│   ├── db.ts                       # SQLite
│   ├── cache.ts                    # 파일 캐시
│   ├── queue.ts                    # 메모리 큐
│   ├── worker.ts                   # 백그라운드 워커
│   ├── types.ts                    # TypeScript 타입
│   └── utils.ts
│
├── templates/
│   └── email/
│       ├── result.html             # 이메일 HTML
│       └── result.txt              # 텍스트 버전
│
├── public/
│   ├── ai-characters/              # AI 타입별 캐릭터 이미지
│   │   ├── gpt4.png
│   │   ├── claude.png
│   │   ├── gemini.png
│   │   └── ...
│   └── og-images/                  # 공유용 이미지
│
├── .cache/                         # 파일 캐시 (gitignore)
├── data/
│   └── database.sqlite             # SQLite DB
│
├── docker-compose.yml
├── Dockerfile
├── Caddyfile
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🔍 통합 검토 결과

### ✅ 일관성 체크

| 항목 | QA/기획 | 기술 엔지니어 | UI/UX | 통합 상태 |
|------|---------|--------------|-------|----------|
| AI 타입 개수 | 8개 | 6개 제안 | 6개 디자인 | ✅ **8개로 통일** |
| 사용자 플로우 | URL 입력→분석→결과 | URL+이메일→백그라운드 | 랜딩→로딩→결과 | ✅ **이메일 기반으로 통일** |
| 기술 스택 | Next.js 권장 | Next.js 15 확정 | Next.js 기반 | ✅ **일치** |
| 분석 방법 | 메트릭 기반 | LLM 기반 | - | ✅ **LLM 채택** |
| 배포 방식 | Vercel/Netlify 제안 | Docker + Portainer | - | ✅ **Docker 채택** |
| 캐싱 전략 | Redis 제안 | 파일 캐시 | - | ✅ **파일 캐시 채택** |

### 🔧 조정 사항

1. **AI 타입 개수**: 기술 엔지니어와 UI 디자이너가 6개를 제안했으나, QA/기획의 8개 타입을 채택하여 더 다양한 결과 제공

2. **사용자 플로우**: 기술 엔지니어의 "이메일 기반" 제안 채택
   - **이유**: 10-30초 분석 시간을 기다리는 것보다, 즉시 제출하고 이메일로 받는 게 UX에 좋음
   - **변경**: UI 디자이너의 "로딩 페이지"는 "제출 완료 페이지"로 변경

3. **분석 방법**: LLM 기반 분석 채택
   - **이유**: 복잡한 메트릭 계산보다 LLM이 더 "인간적인" 분석 제공
   - **장점**: 토큰 비용 제로 (로컬 Ollama), 프롬프트만 수정하면 분석 방식 변경 가능

4. **배포**: Docker Compose 채택
   - **이유**: Ollama를 함께 배포해야 하므로 Vercel 불가
   - **장점**: 로컬 서버에서 완전히 독립적으로 운영 가능

### ⚠️ 리스크 및 해결책

| 리스크 | 영향 | 해결책 |
|--------|------|--------|
| Ollama 분석 시간 10-30초 | 사용자 이탈 | ✅ 이메일 기반 워크플로우 |
| GitHub API Rate Limit (60 req/h) | 동시 사용자 제한 | ✅ 24시간 캐시 + 추후 PAT 옵션 |
| LLM 일관성 부족 | 같은 레포 다른 결과 | ✅ 프롬프트 엔지니어링 + temperature 조절 |
| 이메일 전송 실패 | 결과 못 받음 | ✅ 재시도 로직 + 결과 URL 직접 제공 옵션 |
| 로컬 서버 운영 | 인프라 관리 | ✅ Portainer로 쉬운 관리 |

---

## 🎯 MVP 개발 우선순위

### Phase 1: 코어 기능 (Week 1)
**목표**: "작동하는" 프로토타입

**Day 1-2: 인프라**
- [ ] Next.js 15 프로젝트 초기화
- [ ] Docker Compose 설정 (Next.js + Ollama + Caddy)
- [ ] Ollama 모델 다운로드 (qwen2.5:latest)
- [ ] SQLite 스키마 설계

**Day 3-4: 백엔드 코어**
- [ ] GitHub API 클라이언트 (`lib/github.ts`)
- [ ] Ollama API 클라이언트 (`lib/llm.ts`)
- [ ] 파일 캐시 시스템 (`lib/cache.ts`)
- [ ] 작업 큐 시스템 (`lib/queue.ts`)

**Day 5-6: 분석 로직**
- [ ] LLM 프롬프트 작성 (8가지 AI 타입)
- [ ] 백그라운드 워커 (`lib/worker.ts`)
- [ ] 에러 핸들링 및 재시도

**Day 7: 이메일 시스템**
- [ ] Nodemailer 설정
- [ ] HTML 이메일 템플릿 작성
- [ ] AI 캐릭터 이미지 제작/수집

### Phase 2: 프론트엔드 & 테스트 (Week 2)

**Day 8-9: UI 개발**
- [ ] 랜딩 페이지 (URL + 이메일 입력 폼)
- [ ] 제출 완료 페이지
- [ ] 결과 페이지 (`/result/[id]`)
- [ ] AI 타입 카드 디자인
- [ ] 공유 버튼 (Twitter, 링크 복사)

**Day 10-11: 개선**
- [ ] 다양한 레포지토리로 테스트
- [ ] 프롬프트 튜닝 (더 재미있게!)
- [ ] UI/UX 개선
- [ ] OG 이미지 동적 생성

**Day 12-14: 배포**
- [ ] Docker 이미지 빌드
- [ ] Portainer에 배포
- [ ] Caddy HTTPS 설정
- [ ] 최종 테스트
- [ ] 모니터링 설정

---

## 📊 성공 지표

### MVP 완성 조건
- [ ] GitHub URL + 이메일 입력 가능
- [ ] 백그라운드 분석 정상 작동
- [ ] 이메일 전송 성공
- [ ] 결과 페이지 표시 정상
- [ ] 공유 기능 작동
- [ ] 5개 이상 다른 레포로 테스트 성공

### MVP 목표
- ✅ "작동하는" 프로토타입
- ✅ 친구들에게 보여줄 수 있는 수준
- ✅ 아이디어 검증
- ✅ 재미있는 결과로 공유 유도

### 향후 개선 사항
- [ ] 더 많은 AI 타입 추가 (12개, 16개)
- [ ] 코드 스타일 분석 추가
- [ ] 비교 기능 (두 레포 비교)
- [ ] 리더보드 (가장 많이 분석된 레포)
- [ ] 사용자 계정 시스템
- [ ] 통계 대시보드

---

## 💰 예상 비용 및 성능

### 비용
- **개발 단계**: $0 (로컬 개발)
- **배포 후**:
  - VPS (Hetzner/DigitalOcean): $5-10/월
  - 도메인: $10/년
  - **총 예상**: $5-10/월

### 성능
- Initial Load: < 2초
- GitHub 데이터 수집: 3-5초
- LLM 분석: 10-30초 (백그라운드)
- 이메일 전송: 1-2초
- Cache Hit: < 500ms

---

## 🔐 보안 고려사항

1. **Input Validation**: GitHub URL 정규식 검증
2. **Rate Limiting**: 클라이언트 측 요청 제한 (1분에 3번)
3. **이메일 검증**: 유효한 이메일 주소 확인
4. **캐시 보안**: `.cache` 폴더 .gitignore 추가
5. **환경 변수**: 민감한 정보 .env로 관리
6. **XSS 방지**: 사용자 입력 sanitize
7. **HTTPS**: Caddy로 자동 SSL 인증서

---

## 📝 환경 변수 (.env.example)

```bash
# Ollama API (로컬 Ollama 사용)
OLLAMA_API_URL=http://host.docker.internal:11434

# Email (Nodemailer - Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=AI Personality Analyzer <noreply@yoursite.com>

# Database
DATABASE_PATH=./data/database.sqlite

# App
APP_URL=https://ai-personality.yourdomain.com
NODE_ENV=production

# Optional
# GITHUB_TOKEN=ghp_xxxxxxxxxxxxx  # 추후 Rate Limit 해결용
```

---

## 🚀 배포 명령어

### 초기 설정 (로컬 Ollama 사용)
```bash
# 1. 로컬 Ollama 확인 및 시작
ollama serve &  # 백그라운드 실행

# 2. Ollama 모델 다운로드 (없으면)
ollama pull qwen2.5:latest

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local 편집 (OLLAMA_API_URL=http://host.docker.internal:11434)

# 4. Docker 이미지 빌드
docker compose build

# 5. 서비스 시작
docker compose up -d

# 6. 헬스체크
curl http://localhost:3000/api/health
```

### 모니터링
```bash
# 로그 확인
docker compose logs -f

# 리소스 사용량
docker stats

# 컨테이너 상태
docker compose ps
```

### 백업
```bash
# 데이터 백업
./backup.sh

# 복원
cp backups/20260209_120000/database.sqlite ./data/
```

---

## 🎉 재미 요소 (Fun Elements)

### AI 캐릭터 별명
- 🧠 GPT-4: "만능 해결사"
- 📚 Claude: "신중한 완벽주의자"
- ✨ Gemini: "혁신적인 실험가"
- 🦙 LLaMA: "오픈소스 전도사"
- 🌪️ Mistral: "효율의 달인"
- 🔍 DeepSeek: "철학하는 코더"

### 재미있는 멘트 예시
- "README 쓰는 걸 즐기는 희귀종 발견!"
- "커밋 메시지 쓰는 데 코드 짜는 시간보다 더 오래 걸리시죠?"
- "100줄로 될 걸 왜 1000줄로 써요?"

### 로딩 메시지
- "🔍 GitHub에서 코드 습관 엿보는 중..."
- "🤔 커밋 메시지 읽고 성격 분석 중..."
- "🎨 코드 스타일 감상 중..."

---

## 📞 팀 연락처

- **QA/기획**: qa-planner@ai-personality-analyzer
- **기술 엔지니어**: tech-architect@ai-personality-analyzer
- **UI/UX 디자이너**: ui-designer@ai-personality-analyzer
- **프로젝트 리드**: team-lead@ai-personality-analyzer

---

## 📚 참고 문서

1. `AI_PERSONALITY_ANALYZER_DESIGN.md` - 요구사항 및 AI 타입 정의
2. `TECH_STACK_DESIGN.md` - 기술 스택 및 아키텍처
3. `DOCKER_COMPOSE_DESIGN.md` - Docker 배포 설계
4. `FUN_ELEMENTS_DESIGN.md` - 재미 요소 설계
5. `ai-personality-analyzer-design.md` - UI/UX 디자인

---

**문서 버전**: 1.0
**최종 승인**: 2026-02-09
**다음 단계**: 개발 시작 🚀
