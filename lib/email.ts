import nodemailer from 'nodemailer';
import type { AnalysisResult } from './types';

/**
 * 이메일 전송기 생성
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * 결과 이메일 전송
 */
export async function sendResultEmail(result: AnalysisResult): Promise<void> {
  const transporter = createTransporter();

  const { aiType, emoji, title, oneLiner, traits, strengths, funnyComment } =
    result.result;

  // HTML 이메일
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 50px rgba(0,0,0,0.3);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .emoji {
            font-size: 80px;
        }
        .content {
            padding: 40px 30px;
        }
        .ai-type {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            margin: 20px 0 10px;
            text-align: center;
        }
        .one-liner {
            font-size: 18px;
            color: #666;
            text-align: center;
            font-style: italic;
            margin-bottom: 30px;
        }
        .section {
            margin: 25px 0;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .trait {
            background: #f0f4ff;
            padding: 10px 15px;
            border-radius: 10px;
            margin: 8px 0;
            border-left: 4px solid #667eea;
        }
        .funny-comment {
            background: #fff9e6;
            padding: 20px;
            border-radius: 10px;
            border-left: 5px solid #ffc107;
            margin: 20px 0;
            font-style: italic;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 40px;
            border-radius: 30px;
            text-decoration: none;
            font-weight: bold;
            font-size: 16px;
            margin: 20px auto;
            display: block;
            text-align: center;
            max-width: 200px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">${emoji}</div>
            <h1>분석 완료!</h1>
        </div>

        <div class="content">
            <div class="ai-type">${title}</div>
            <div class="one-liner">${oneLiner}</div>

            <div class="funny-comment">
                💬 ${funnyComment}
            </div>

            <div class="section">
                <div class="section-title">🎯 핵심 특징</div>
                ${traits.map((trait) => `<div class="trait">${trait}</div>`).join('')}
            </div>

            <div class="section">
                <div class="section-title">💪 강점</div>
                ${strengths.map((strength) => `<div class="trait">${strength}</div>`).join('')}
            </div>

            <a href="${result.shareUrl}" class="button">
                🔗 결과 자세히 보기
            </a>
        </div>

        <div class="footer">
            <p>🤖 AI Personality Analyzer</p>
            <p>당신의 GitHub 레포지토리는 어떤 AI 타입일까요?</p>
            <p><a href="${process.env.APP_URL}">다른 레포도 분석해보기</a></p>
        </div>
    </div>
</body>
</html>
  `;

  // 텍스트 버전
  const textContent = `
🎉 분석 완료!

${emoji} ${title}

${oneLiner}

💬 ${funnyComment}

🎯 핵심 특징:
${traits.map((t, i) => `${i + 1}. ${t}`).join('\n')}

💪 강점:
${strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

🔗 결과 자세히 보기: ${result.shareUrl}

---
🤖 AI Personality Analyzer
${process.env.APP_URL}
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'AI Personality Analyzer <noreply@example.com>',
    to: result.email,
    subject: `🎉 당신의 레포는 ${aiType}형 입니다!`,
    text: textContent,
    html: htmlContent,
  });
}

/**
 * 테스트 이메일 전송
 */
export async function sendTestEmail(to: string): Promise<void> {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: '✅ AI Personality Analyzer 테스트 이메일',
    text: '이메일 설정이 정상적으로 작동합니다!',
    html: '<p>✅ 이메일 설정이 정상적으로 작동합니다!</p>',
  });
}
