// src/app/api/plan/route.ts
// 운동 플랜 생성 및 조회 API

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { generatePlanResponse } from "@/lib/ai/client";
import {
  buildPlanSystemPrompt,
  buildPlanUserPrompt,
  buildPlanRepairPrompt,
} from "@/lib/ai/prompts";
import { parseAndValidatePlan, validatePlan } from "@/lib/plan/validatePlan";
import { getFallbackPlan } from "@/lib/plan/fallbackPlan";
import { migrateOldPlanToNew, isLegacyPlan } from "@/lib/plan/migrateOldPlan";
import { Plan } from "@/lib/plan/planSchema";

interface UserProfile {
  gender?: string;
  age?: string;
  height_weight?: string;
  goal?: string;
  experience?: string;
  frequency?: string;
  injuries?: string;
  equipment?: string;
}

/**
 * POST /api/plan
 * AI를 사용하여 새 운동 플랜 생성
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. 요청 바디 파싱
    let body: { profile: UserProfile };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "유효하지 않은 요청 형식입니다." },
        { status: 400 }
      );
    }

    const { profile } = body;
    if (!profile) {
      return NextResponse.json(
        { error: "프로필 정보가 필요합니다." },
        { status: 400 }
      );
    }

    // 3. AI로 플랜 생성 시도
    let finalPlan: Plan;
    const systemPrompt = buildPlanSystemPrompt();
    const userPrompt = buildPlanUserPrompt(profile);

    try {
      // 첫 번째 시도
      const aiResponse = await generatePlanResponse(systemPrompt, userPrompt);
      const validationResult = parseAndValidatePlan(aiResponse);

      if (validationResult.ok) {
        finalPlan = validationResult.data;
      } else {
        console.warn("첫 번째 AI 응답 검증 실패:", validationResult.error);

        // 두 번째 시도 (수정 프롬프트)
        const repairPrompt = buildPlanRepairPrompt(aiResponse, profile);
        const retryResponse = await generatePlanResponse(systemPrompt, repairPrompt);
        const retryResult = parseAndValidatePlan(retryResponse);

        if (retryResult.ok) {
          finalPlan = retryResult.data;
        } else {
          console.warn("두 번째 AI 응답 검증 실패:", retryResult.error);
          // 폴백 플랜 사용
          finalPlan = getFallbackPlan();
        }
      }
    } catch (aiError) {
      console.error("AI 호출 실패:", aiError);
      // 폴백 플랜 사용
      finalPlan = getFallbackPlan();
    }

    // 4. DB에 저장
    const supabase = await createSupabaseServerClient();

    // 기존 활성 플랜 비활성화
    await supabase
      .from("workout_plans")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .eq("is_active", true);

    // 새 플랜 저장
    const { data: savedPlan, error: saveError } = await supabase
      .from("workout_plans")
      .insert({
        user_id: user.id,
        plan_version: finalPlan.plan_version,
        plan_json: finalPlan,
        is_active: true,
      })
      .select()
      .single();

    if (saveError) {
      console.error("플랜 저장 실패:", saveError);
      // 저장 실패해도 플랜은 반환
      return NextResponse.json({
        plan: finalPlan,
        saved: false,
        message: "플랜이 생성되었지만 저장에 실패했습니다.",
      });
    }

    return NextResponse.json({
      plan: finalPlan,
      saved: true,
      plan_id: savedPlan.id,
    });
  } catch (error) {
    console.error("플랜 생성 오류:", error);

    // 절대 크래시하지 않음 - 폴백 반환
    return NextResponse.json({
      plan: getFallbackPlan(),
      saved: false,
      message: "오류가 발생하여 기본 플랜을 제공합니다.",
    });
  }
}

/**
 * GET /api/plan
 * 현재 사용자의 활성 플랜 조회
 */
export async function GET() {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. 활성 플랜 조회
    const supabase = await createSupabaseServerClient();
    const { data: planRecord, error } = await supabase
      .from("workout_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !planRecord) {
      return NextResponse.json({ plan: null, message: "활성 플랜이 없습니다." });
    }

    // 3. 레거시 플랜이면 마이그레이션
    let plan: Plan;
    const storedPlan = planRecord.plan_json;

    if (isLegacyPlan(storedPlan)) {
      try {
        plan = migrateOldPlanToNew(storedPlan);

        // 마이그레이션된 플랜으로 업데이트
        await supabase
          .from("workout_plans")
          .update({
            plan_version: plan.plan_version,
            plan_json: plan,
          })
          .eq("id", planRecord.id);
      } catch (migrateError) {
        console.error("레거시 플랜 마이그레이션 실패:", migrateError);
        // 마이그레이션 실패 시 폴백
        plan = getFallbackPlan();
      }
    } else {
      // 새 스키마 검증
      const validationResult = validatePlan(storedPlan);
      if (validationResult.ok) {
        plan = validationResult.data;
      } else {
        console.warn("저장된 플랜 검증 실패:", validationResult.error);
        plan = getFallbackPlan();
      }
    }

    return NextResponse.json({
      plan,
      plan_id: planRecord.id,
      created_at: planRecord.created_at,
    });
  } catch (error) {
    console.error("플랜 조회 오류:", error);
    return NextResponse.json(
      { error: "플랜 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
