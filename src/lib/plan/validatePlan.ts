// src/lib/plan/validatePlan.ts
// 플랜 유효성 검증 헬퍼

import { PlanSchema, Plan } from "./planSchema";
import { ZodError } from "zod";

export type ValidationResult =
  | { ok: true; data: Plan }
  | { ok: false; error: string };

/**
 * 플랜 JSON 유효성 검증
 * @param plan - 검증할 플랜 객체 (unknown)
 * @returns ValidationResult
 */
export function validatePlan(plan: unknown): ValidationResult {
  try {
    const validatedPlan = PlanSchema.parse(plan);

    // 추가 검증: exercise_key 중복 체크
    const allKeys = new Set<string>();
    for (const day of validatedPlan.days) {
      for (const exercise of day.exercises) {
        if (allKeys.has(exercise.exercise_key)) {
          return {
            ok: false,
            error: `중복된 exercise_key: ${exercise.exercise_key}`,
          };
        }
        allKeys.add(exercise.exercise_key);
      }
    }

    return { ok: true, data: validatedPlan };
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.issues.map((e) => `${e.path.join(".")}: ${e.message}`);
      return { ok: false, error: messages.join("; ") };
    }
    return { ok: false, error: "알 수 없는 검증 오류" };
  }
}

/**
 * JSON 문자열에서 플랜 파싱 + 검증
 * @param jsonString - JSON 문자열
 * @returns ValidationResult
 */
export function parseAndValidatePlan(jsonString: string): ValidationResult {
  try {
    // JSON 파싱 시도
    const parsed = JSON.parse(jsonString);
    return validatePlan(parsed);
  } catch (err) {
    // JSON 파싱 실패 시 코드 블록 제거 후 재시도
    const cleanedJson = cleanJsonString(jsonString);
    try {
      const parsed = JSON.parse(cleanedJson);
      return validatePlan(parsed);
    } catch {
      return { ok: false, error: "JSON 파싱 실패: 유효하지 않은 JSON 형식" };
    }
  }
}

/**
 * AI 응답에서 JSON 추출 (마크다운 코드 블록 제거)
 */
function cleanJsonString(input: string): string {
  let cleaned = input.trim();

  // 마크다운 코드 블록 제거: ```json ... ``` 또는 ``` ... ```
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
  const match = cleaned.match(codeBlockRegex);
  if (match) {
    cleaned = match[1].trim();
  }

  // 앞뒤 불필요한 텍스트 제거 (JSON 객체만 추출)
  const jsonStartIndex = cleaned.indexOf("{");
  const jsonEndIndex = cleaned.lastIndexOf("}");
  if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
    cleaned = cleaned.slice(jsonStartIndex, jsonEndIndex + 1);
  }

  return cleaned;
}
