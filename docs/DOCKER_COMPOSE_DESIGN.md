# Docker Compose 설계

## docker-compose.yml

```yaml
version: '3.8'

services:
  # Next.js 애플리케이션
  nextjs:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ai-personality-nextjs
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - OLLAMA_API_URL=http://host.docker.internal:11434  # 로컬 Ollama 사용
      - DATABASE_PATH=/app/data/database.sqlite
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - EMAIL_FROM=${EMAIL_FROM}
      - APP_URL=${APP_URL}
    volumes:
      - ./data:/app/data
      - ./.cache:/app/.cache
    ports:
      - "3000:3000"
    extra_hosts:
      - "host.docker.internal:host-gateway"  # 로컬 호스트 접근
    networks:
      - ai-personality-network

  # Caddy 리버스 프록시 (HTTPS)
  caddy:
    image: caddy:latest
    container_name: ai-personality-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
      - caddy-config:/config
    depends_on:
      - nextjs
    networks:
      - ai-personality-network

volumes:
  caddy-data:
    driver: local
  caddy-config:
    driver: local

networks:
  ai-personality-network:
    driver: bridge
```

## Caddyfile

```
{
    email your-email@example.com
}

ai-personality.yourdomain.com {
    reverse_proxy nextjs:3000

    # 로깅
    log {
        output file /var/log/caddy/access.log
        format json
    }

    # 압축
    encode gzip

    # 헬스체크 엔드포인트
    handle /health {
        reverse_proxy nextjs:3000
    }
}
```

## Dockerfile (Next.js)

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 환경 변수 설정
ENV NEXT_TELEMETRY_DISABLED 1

# 빌드
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 사용자 생성
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 필요한 파일만 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 데이터 디렉토리 생성
RUN mkdir -p /app/data /app/.cache
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

## next.config.js (Standalone 모드)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // 이미지 최적화
  images: {
    domains: ['avatars.githubusercontent.com'],
  },

  // 환경 변수 검증
  env: {
    OLLAMA_API_URL: process.env.OLLAMA_API_URL,
    APP_URL: process.env.APP_URL,
  },
};

module.exports = nextConfig;
```

## 배포 스크립트

### deploy.sh (로컬 Ollama 사용)
```bash
#!/bin/bash

echo "🚀 AI Personality Analyzer 배포 시작..."

# 환경 변수 확인
if [ ! -f .env.local ]; then
    echo "❌ .env.local 파일이 없습니다!"
    exit 1
fi

# 로컬 Ollama 확인
echo "🤖 로컬 Ollama 확인 중..."
if ! curl -s http://localhost:11434/api/version > /dev/null; then
    echo "❌ Ollama가 실행되고 있지 않습니다!"
    echo "💡 'ollama serve'로 Ollama를 먼저 시작하세요."
    exit 1
fi

# Ollama 모델 확인
echo "📦 Ollama 모델 확인 중..."
if ! ollama list | grep -q "qwen2.5:latest"; then
    echo "📥 qwen2.5:latest 다운로드 중..."
    ollama pull qwen2.5:latest
fi

# Docker 이미지 빌드
echo "📦 Docker 이미지 빌드 중..."
docker compose build

# 서비스 시작
echo "🎬 서비스 시작 중..."
docker compose up -d

# 헬스체크
echo "🏥 헬스체크 대기 중..."
sleep 10
curl -f http://localhost:3000/api/health || exit 1

echo "✅ 배포 완료!"
echo "🌐 앱 URL: http://localhost:3000"
echo "📊 Portainer: http://localhost:9000"
echo "🤖 Ollama: http://localhost:11434 (로컬)"
```

### check-ollama.sh (Ollama 확인)
```bash
#!/bin/bash

echo "🔍 Ollama 상태 확인 중..."

# Ollama 프로세스 확인
if pgrep -x "ollama" > /dev/null; then
    echo "✅ Ollama 실행 중"
else
    echo "❌ Ollama가 실행되고 있지 않습니다"
    echo "💡 'ollama serve'로 시작하세요"
    exit 1
fi

# API 응답 확인
if curl -s http://localhost:11434/api/version > /dev/null; then
    echo "✅ Ollama API 응답 정상"
    echo "📋 버전 정보:"
    curl -s http://localhost:11434/api/version | jq
else
    echo "❌ Ollama API 응답 없음"
    exit 1
fi

# 설치된 모델 확인
echo ""
echo "📦 설치된 모델:"
ollama list

# qwen2.5:latest 확인
if ollama list | grep -q "qwen2.5:latest"; then
    echo "✅ qwen2.5:latest 모델 설치됨"
else
    echo "⚠️  qwen2.5:latest 모델 없음"
    echo "💡 'ollama pull qwen2.5:latest'로 설치하세요"
fi
```

## Portainer Stack 설정

Portainer UI에서 직접 설정:

1. **Stacks** → **Add stack**
2. **Name**: `ai-personality-analyzer`
3. **Web editor**: 위의 `docker-compose.yml` 내용 붙여넣기
4. **Environment variables** 추가:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   EMAIL_FROM=AI Personality <noreply@yourdomain.com>
   APP_URL=https://ai-personality.yourdomain.com
   ```
5. **Deploy the stack**

## 모니터링

### 로그 확인
```bash
# 전체 로그
docker compose logs -f

# Next.js 로그만
docker compose logs -f nextjs

# Ollama 로그만
docker compose logs -f ollama
```

### 리소스 사용량
```bash
docker stats
```

### 컨테이너 상태
```bash
docker compose ps
```

## 백업

### 데이터 백업
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# SQLite 백업
cp ./data/database.sqlite "$BACKUP_DIR/"

# 캐시 백업 (선택사항)
cp -r ./.cache "$BACKUP_DIR/"

echo "✅ 백업 완료: $BACKUP_DIR"
```

## 트러블슈팅

### Ollama 연결 실패 (로컬 Ollama)
```bash
# 1. 로컬 Ollama 실행 확인
pgrep -x ollama || echo "Ollama가 실행되고 있지 않습니다"

# 2. Ollama 시작 (백그라운드)
ollama serve &

# 3. API 테스트
curl http://localhost:11434/api/version

# 4. Docker 컨테이너에서 접근 테스트
docker exec -it ai-personality-nextjs curl http://host.docker.internal:11434/api/version

# 5. 방화벽 확인 (macOS)
# 시스템 설정 > 보안 및 개인정보보호 > 방화벽에서 Ollama 허용
```

### 이메일 전송 실패
```bash
# Next.js 로그에서 SMTP 에러 확인
docker logs ai-personality-nextjs | grep -i smtp

# SMTP 연결 테스트
docker exec -it ai-personality-nextjs node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});
transporter.verify().then(console.log).catch(console.error);
"
```

### 디스크 공간 부족
```bash
# 사용하지 않는 Docker 리소스 정리
docker system prune -a --volumes

# Ollama 모델 확인
docker exec ai-personality-ollama ollama list
```
