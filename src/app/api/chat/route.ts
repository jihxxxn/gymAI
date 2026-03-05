// src/app/api/chat/route.ts
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // 서버에서만 읽힘 - 클라이언트에 노출 안됨
});

export async function POST(req: NextRequest) {
  try {
    const { messages, system } = await req.json();

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: system || "당신은 한국어로 대화하는 AI 퍼스널 트레이너입니다.",
      messages,
    });

    const text = response.content.find((b) => b.type === "text")?.text || "";
    return NextResponse.json({ text });

  } catch (error) {
    console.error("Anthropic API error:", error);
    return NextResponse.json(
      { error: "AI 응답 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
