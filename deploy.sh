#!/bin/bash

set -e

echo "🚀 AI Personality Analyzer 배포 시작..."

# 1. 환경 변수 확인
if [ ! -f .env.production ]; then
    echo "❌ .env.production 파일이 없습니다!"
    echo "💡 cp .env.production.example .env.production 후 값을 채워주세요. (커밋 금지)"
    exit 1
fi

# 2. 로컬 Ollama 확인
echo "🤖 로컬 Ollama 확인 중..."
if ! curl -s http://localhost:11434/api/version > /dev/null; then
    echo "❌ Ollama가 실행되고 있지 않습니다!"
    echo "💡 'ollama serve'로 Ollama를 먼저 시작하세요."
    exit 1
fi

# Ollama 모델 확인
echo "📦 Ollama 모델 확인 중..."
if ! ollama list | grep -q "qwen2.5:14b"; then
    echo "⚠️  qwen2.5:14b 모델이 없습니다."
    echo "📥 모델을 다운로드하시겠습니까? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        ollama pull qwen2.5:14b
    else
        echo "❌ 모델이 필요합니다. 배포를 중단합니다."
        exit 1
    fi
fi

# 3. 기존 컨테이너 중지 및 제거
echo "🛑 기존 컨테이너 중지 중..."
docker compose down 2>/dev/null || true

# 4. Docker 이미지 빌드
echo "📦 Docker 이미지 빌드 중..."
docker compose build --no-cache

# 5. 컨테이너 시작
echo "🎬 서비스 시작 중..."
docker compose up -d

# 6. 헬스체크
echo "🏥 헬스체크 대기 중 (20초)..."
sleep 20

if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ 배포 완료!"
    echo ""
    echo "🌐 서비스 URL:"
    echo "   - 로컬: http://localhost:3001"
    echo "   - 도메인: https://ai-analyzer.yndl.dev (DNS 설정 필요)
    echo ""
    echo "📊 상태 확인: curl https://ai-analyzer.yndl.dev/api/health"
    echo "📋 로그 확인: docker compose logs -f"
else
    echo "❌ 헬스체크 실패!"
    echo "📋 로그를 확인하세요: docker compose logs"
    exit 1
fi
