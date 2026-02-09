# 🤖 AI Personality Analyzer

GitHub 레포지토리를 AI 모델 성격으로 분석하는 웹 애플리케이션

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://ai-analyzer.yndl.dev)

## ✨ 특징

- 🔍 **GitHub 레포지토리 분석**: 레포지토리 URL만 입력하면 자동 분석
- 🎨 **8가지 AI 타입**: GPT-4, GPT-3.5, Claude Opus, Claude Sonnet, Gemini, Llama, Mistral, Cohere
- 🚀 **실시간 진행 상황**: 분석 진행도를 실시간으로 확인
- 💾 **캐싱 시스템**: 24시간 캐싱으로 빠른 재분석
- 📧 **이메일 전송**: 분석 결과를 이메일로 전송 (선택사항)
- 🌐 **완전 로컬**: 로컬 Ollama 사용으로 API 비용 없음

## 🏗️ 기술 스택

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **LLM**: Ollama (qwen2.5:14b)
- **Database**: SQLite
- **Deployment**: Docker, Caddy, Cloudflare Tunnel

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 20+
- Ollama ([설치 가이드](https://ollama.ai))
- Docker & Docker Compose

### 1. Ollama 모델 설치

```bash
ollama pull qwen2.5:14b
ollama serve
```

### 2. 개발 환경 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local

# 개발 서버 시작
npm run dev
```

http://localhost:3000 에서 확인

### 3. Docker로 실행

```bash
# 개발 환경
docker compose -f docker-compose.dev.yml up

# 프로덕션 환경
docker compose up -d
```

## 🎯 사용 방법

1. **레포지토리 입력**: GitHub 레포지토리 URL 입력
   - 예: `https://github.com/username/repo`

2. **이메일 입력** (선택사항): 결과를 받을 이메일 주소

3. **분석 시작**: "분석 시작" 버튼 클릭

4. **결과 확인**:
   - 실시간 진행 상황 확인
   - 분석 완료 후 결과 페이지로 자동 이동
   - 이메일로도 결과 수신 (설정 시)

## 📊 AI 타입

### 🧠 GPT-4
혁신적이고 다재다능한 올라운더

### 💬 GPT-3.5
빠르고 효율적인 커뮤니케이터

### 🎯 Claude Opus
깊이 있고 신중한 사색가

### ⚡ Claude Sonnet
균형잡힌 실용주의자

### 🌟 Gemini
창의적이고 다양한 관점을 가진 탐험가

### 🦙 Llama
개방적이고 커뮤니티 지향적인 협력자

### 🔮 Mistral
효율적이고 정확한 전문가

### 🎭 Cohere
언어에 특화된 커뮤니케이터

## 🔧 환경 변수

```env
# Ollama API
OLLAMA_API_URL=http://localhost:11434

# Database
DATABASE_PATH=./data/database.sqlite

# Email (선택사항)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=AI Personality Analyzer <noreply@example.com>

# App
APP_URL=http://localhost:3000
NODE_ENV=development
```

## 📁 프로젝트 구조

```
ai-personality-analyzer/
├── app/                    # Next.js 앱 라우터
│   ├── api/               # API 엔드포인트
│   ├── analyzing/         # 분석 진행 페이지
│   └── result/[id]/       # 결과 페이지
├── lib/                    # 핵심 로직
│   ├── llm.ts             # Ollama LLM 클라이언트
│   ├── github.ts          # GitHub API 통합
│   ├── db.ts              # SQLite 데이터베이스
│   ├── worker.ts          # 백그라운드 워커
│   └── cache.ts           # 파일 기반 캐싱
├── docs/                   # 설계 문서
├── docker-compose.yml      # 프로덕션 배포
└── docker-compose.dev.yml  # 개발 환경
```

## 🚢 배포

### 로컬 Ollama와 함께 배포

```bash
# deploy.sh 실행
chmod +x deploy.sh
./deploy.sh
```

배포 스크립트가 자동으로:
- ✅ Ollama 실행 확인
- ✅ 필요한 모델 확인
- ✅ Docker 이미지 빌드
- ✅ 서비스 시작
- ✅ 헬스체크 수행

### Cloudflare Tunnel 설정

1. Cloudflare Zero Trust 대시보드에서 Tunnel 생성
2. Public Hostname 추가:
   - Subdomain: `ai-analyzer`
   - Service: `http://caddy:80`

## 🎨 스크린샷

### 메인 페이지
![Main Page](docs/screenshots/main.png)

### 분석 중
![Analyzing](docs/screenshots/analyzing.png)

### 결과 페이지
![Result](docs/screenshots/result.png)

## 🤝 기여

기여를 환영합니다! Pull Request를 보내주세요.

## 📄 라이선스

MIT License

## 🔗 링크

- **라이브 데모**: https://ai-analyzer.yndl.dev
- **GitHub**: https://github.com/dong3789/AI-Personality
- **Ollama**: https://ollama.ai

---

Made with ❤️ by [dong3789](https://github.com/dong3789)

🤖 Powered by [Ollama](https://ollama.ai) & [Qwen2.5](https://qwenlm.github.io/)
