#!/bin/bash

set -e

echo "🌐 Cloudflare DNS 레코드 추가 스크립트"
echo ""

# 환경 변수 확인
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN 환경 변수가 설정되지 않았습니다."
    echo "💡 Cloudflare API Token을 생성하고 설정하세요:"
    echo "   export CLOUDFLARE_API_TOKEN='your-token-here'"
    exit 1
fi

# 서버 IP 주소 입력 (또는 자동 감지)
if [ -z "$SERVER_IP" ]; then
    echo "📍 서버 IP 주소를 입력하세요 (또는 엔터를 눌러 자동 감지):"
    read -r SERVER_IP

    if [ -z "$SERVER_IP" ]; then
        echo "🔍 공인 IP 자동 감지 중..."
        SERVER_IP=$(curl -s https://api.ipify.org)
        echo "   감지된 IP: $SERVER_IP"
    fi
fi

# Cloudflare Zone ID 가져오기 (yndl.dev)
echo "🔍 Cloudflare Zone 정보 조회 중..."
ZONE_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=yndl.dev" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json")

ZONE_ID=$(echo $ZONE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ZONE_ID" ]; then
    echo "❌ yndl.dev Zone을 찾을 수 없습니다."
    echo "   API Token 권한을 확인하세요."
    exit 1
fi

echo "✅ Zone ID: $ZONE_ID"

# DNS 레코드 존재 여부 확인
echo "🔍 기존 DNS 레코드 확인 중..."
EXISTING_RECORD=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=ai-analyzer.yndl.dev" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json")

RECORD_ID=$(echo $EXISTING_RECORD | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$RECORD_ID" ]; then
    echo "⚠️  DNS 레코드가 이미 존재합니다. 업데이트할까요? (y/n)"
    read -r response

    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        # DNS 레코드 업데이트
        echo "🔄 DNS 레코드 업데이트 중..."
        RESPONSE=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data "{\"type\":\"A\",\"name\":\"ai-analyzer\",\"content\":\"$SERVER_IP\",\"ttl\":1,\"proxied\":true}")

        if echo "$RESPONSE" | grep -q '"success":true'; then
            echo "✅ DNS 레코드 업데이트 완료!"
        else
            echo "❌ DNS 레코드 업데이트 실패:"
            echo "$RESPONSE"
            exit 1
        fi
    else
        echo "⏭️  건너뜀"
        exit 0
    fi
else
    # 새로운 DNS 레코드 추가
    echo "➕ DNS 레코드 추가 중..."
    RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "{\"type\":\"A\",\"name\":\"ai-analyzer\",\"content\":\"$SERVER_IP\",\"ttl\":1,\"proxied\":true}")

    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo "✅ DNS 레코드 추가 완료!"
    else
        echo "❌ DNS 레코드 추가 실패:"
        echo "$RESPONSE"
        exit 1
    fi
fi

echo ""
echo "🎉 완료!"
echo ""
echo "📝 설정된 DNS 레코드:"
echo "   도메인: ai-analyzer.yndl.dev"
echo "   타입: A"
echo "   IP: $SERVER_IP"
echo "   Proxy: 활성화 (Cloudflare CDN/SSL)"
echo ""
echo "⏱️  DNS 전파까지 1-5분 정도 소요될 수 있습니다."
echo "🔍 확인: https://ai-analyzer.yndl.dev"
