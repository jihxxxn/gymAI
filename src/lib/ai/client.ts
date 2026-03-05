// src/lib/ai/client.ts
// 서버 사이드 AI 클라이언트 (Claude API 사용)

import Anthropic from "@anthropic-ai/sdk";

// 싱글톤 클라이언트 인스턴스
let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

export interface AICompletionOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Claude API를 호출하여 텍스트 응답을 반환
 * 서버 사이드에서만 사용 가능
 */
export async function generateCompletion(
  options: AICompletionOptions
): Promise<string> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: options.maxTokens || 2048,
    system: options.systemPrompt,
    messages: [
      {
        role: "user",
        content: options.userPrompt,
      },
    ],
  });

  // 응답에서 텍스트 추출
  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("AI 응답에서 텍스트를 찾을 수 없습니다.");
  }

  return textContent.text;
}

/**
 * 플랜 생성을 위한 래퍼 함수
 */
export async function generatePlanResponse(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  return generateCompletion({
    systemPrompt,
    userPrompt,
    maxTokens: 4096, // 플랜은 더 긴 응답 필요
    temperature: 0.7,
  });
}
