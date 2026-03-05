// src/lib/plan/migrateOldPlan.ts
// 레거시 플랜을 새 스키마로 마이그레이션

import { Plan, Day, Exercise, SplitId, LegacyPlan, LegacyDay, LegacyExercise } from "./planSchema";

/**
 * 한글 이름을 영문 exercise_key로 변환
 */
function slugify(koreanName: string): string {
  // 한글 -> 로마자 간단 매핑 (일반적인 운동 이름 기준)
  const mappings: Record<string, string> = {
    "벤치 프레스": "bench_press",
    "벤치프레스": "bench_press",
    "인클라인 덤벨 프레스": "incline_dumbbell_press",
    "인클라인 프레스": "incline_press",
    "오버헤드 프레스": "overhead_press",
    "숄더 프레스": "shoulder_press",
    "사이드 레터럴 레이즈": "lateral_raise",
    "레터럴 레이즈": "lateral_raise",
    "트라이셉 푸쉬다운": "tricep_pushdown",
    "트라이셉 익스텐션": "tricep_extension",
    "랫 풀다운": "lat_pulldown",
    "풀다운": "lat_pulldown",
    "시티드 로우": "seated_row",
    "케이블 로우": "cable_row",
    "덤벨 로우": "dumbbell_row",
    "바벨 로우": "barbell_row",
    "페이스 풀": "face_pull",
    "바이셉 컬": "bicep_curl",
    "덤벨 컬": "dumbbell_curl",
    "스쿼트": "squat",
    "레그 프레스": "leg_press",
    "루마니안 데드리프트": "romanian_deadlift",
    "레그 컬": "leg_curl",
    "레그 익스텐션": "leg_extension",
    "카프 레이즈": "calf_raise",
    "런지": "lunge",
    "힙 쓰러스트": "hip_thrust",
    "플랭크": "plank",
    "크런치": "crunch",
    "데드리프트": "deadlift",
    "풀업": "pull_up",
    "푸쉬업": "push_up",
    "딥스": "dips",
    "체스트 플라이": "chest_fly",
    "펙덱 플라이": "pec_deck_fly",
    "케이블 플라이": "cable_fly",
    "리버스 플라이": "reverse_fly",
    "업라이트 로우": "upright_row",
    "슈러그": "shrug",
    "해머 컬": "hammer_curl",
    "프리쳐 컬": "preacher_curl",
    "스컬 크러셔": "skull_crusher",
    "클로즈 그립 벤치": "close_grip_bench",
    "고블릿 스쿼트": "goblet_squat",
    "불가리안 스플릿 스쿼트": "bulgarian_split_squat",
    "시티드 레그 컬": "seated_leg_curl",
    "라잉 레그 컬": "lying_leg_curl",
    "스탠딩 카프 레이즈": "standing_calf_raise",
    "시티드 카프 레이즈": "seated_calf_raise",
  };

  // 매핑 테이블에서 찾기
  const normalized = koreanName.trim();
  if (mappings[normalized]) {
    return mappings[normalized];
  }

  // 없으면 간단한 변환: 공백 -> _, 특수문자 제거, 소문자
  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[가-힣]+/g, (match) => {
      // 간단한 해시 기반 키 생성
      let hash = 0;
      for (let i = 0; i < match.length; i++) {
        hash = (hash * 31 + match.charCodeAt(i)) % 100000;
      }
      return `exercise_${hash}`;
    });
}

/**
 * 장비 추론 (운동 이름 기반)
 */
function inferEquipment(exerciseName: string): string {
  const name = exerciseName.toLowerCase();

  if (name.includes("덤벨") || name.includes("dumbbell")) return "덤벨";
  if (name.includes("바벨") || name.includes("barbell")) return "바벨";
  if (name.includes("케이블") || name.includes("cable")) return "케이블";
  if (name.includes("머신") || name.includes("machine")) return "머신";
  if (name.includes("프레스") && !name.includes("레그")) return "바벨";
  if (name.includes("풀다운") || name.includes("로우")) return "케이블";
  if (name.includes("레그 프레스") || name.includes("레그 컬") || name.includes("레그 익스텐션")) return "머신";
  if (name.includes("푸쉬업") || name.includes("풀업") || name.includes("플랭크") || name.includes("크런치")) return "맨몸";

  return "머신"; // 기본값
}

/**
 * split 이름에서 split_id 추론
 */
function inferSplitId(splitName: string, daysCount: number): SplitId {
  const name = splitName.toLowerCase();

  if (name.includes("전신") || name.includes("풀바디")) {
    return "2day_fullbody";
  }
  if (name.includes("푸쉬") || name.includes("push") || name.includes("pull") || name.includes("legs")) {
    return "3day_push_pull_legs";
  }
  if (name.includes("상하체") || name.includes("upper") || name.includes("lower")) {
    return "4day_upper_lower";
  }
  if (daysCount >= 5 && daysCount <= 6) {
    if (name.includes("ppl") || daysCount === 6) {
      return "6day_ppl_twice";
    }
    return "5day_bro_split";
  }

  // 일수에 따른 기본 추론
  if (daysCount <= 2) return "2day_fullbody";
  if (daysCount === 3) return "3day_push_pull_legs";
  if (daysCount === 4) return "4day_upper_lower";
  if (daysCount === 5) return "5day_bro_split";
  return "6day_ppl_twice";
}

/**
 * 레거시 운동을 새 스키마로 변환
 */
function migrateExercise(
  legacy: LegacyExercise,
  usedKeys: Set<string>
): Exercise {
  let baseKey = slugify(legacy.name);
  let finalKey = baseKey;
  let suffix = 2;

  // 중복 키 처리
  while (usedKeys.has(finalKey)) {
    finalKey = `${baseKey}_${suffix}`;
    suffix++;
  }
  usedKeys.add(finalKey);

  return {
    exercise_key: finalKey,
    name_ko: legacy.name,
    muscle_ko: legacy.muscle || "전신",
    equipment_ko: legacy.equipment || inferEquipment(legacy.name),
    sets: legacy.sets || 3,
    reps: String(legacy.reps || "10"),
    rest_seconds: legacy.rest_seconds || 60,
    instructions_ko: legacy.instructions || "올바른 자세로 수행하세요.",
  };
}

/**
 * 레거시 Day를 새 스키마로 변환
 */
function migrateDay(
  legacy: LegacyDay,
  warmup: string[],
  cooldown: string[],
  usedKeys: Set<string>
): Day {
  return {
    day_index: legacy.day || 1,
    title_ko: legacy.name || `Day ${legacy.day}`,
    focus_ko: legacy.focus || "전신",
    estimated_minutes: legacy.duration || 45,
    warmup: warmup.length > 0 ? warmup : ["5분 가벼운 유산소", "동적 스트레칭"],
    exercises: legacy.exercises.map((ex) => migrateExercise(ex, usedKeys)),
    cooldown: cooldown.length > 0 ? cooldown : ["5분 정적 스트레칭"],
  };
}

/**
 * 레거시 플랜을 새 스키마로 마이그레이션
 */
export function migrateOldPlanToNew(old: unknown): Plan {
  // 타입 체크
  if (!old || typeof old !== "object") {
    throw new Error("유효하지 않은 레거시 플랜");
  }

  const legacy = old as Partial<LegacyPlan>;
  const usedKeys = new Set<string>();

  // 웜업/쿨다운 추출
  const warmup = legacy.warmup?.exercises || ["5분 가벼운 유산소", "동적 스트레칭"];
  const cooldown = legacy.cooldown?.exercises || ["5분 정적 스트레칭"];

  // days 마이그레이션
  const days: Day[] = (legacy.days || []).map((d) =>
    migrateDay(d, warmup, cooldown, usedKeys)
  );

  // days가 없으면 기본값
  if (days.length === 0) {
    throw new Error("days 배열이 비어있습니다");
  }

  // split_id 추론
  const splitId = inferSplitId(legacy.split || "", days.length);

  return {
    plan_version: "1.0",
    split_id: splitId,
    split_name_ko: legacy.split || `${days.length}일 분할 루틴`,
    weekly_schedule_ko:
      legacy.weeklySchedule ||
      `주 ${days.length}회 운동. 운동일 사이에 충분한 휴식을 취하세요.`,
    days,
    notes_ko: [
      "각 운동 전 가벼운 무게로 워밍업 세트를 수행하세요.",
      "통증이 있으면 즉시 중단하고 전문가와 상담하세요.",
    ],
  };
}

/**
 * 플랜이 레거시 형식인지 확인
 */
export function isLegacyPlan(plan: unknown): boolean {
  if (!plan || typeof plan !== "object") return false;
  const p = plan as Record<string, unknown>;

  // 새 스키마에는 plan_version이 있음
  if (p.plan_version === "1.0") return false;

  // 레거시 스키마 특징: split, weeklySchedule, warmup.exercises
  const hasSplit = typeof p.split === "string";
  const hasWeeklySchedule = typeof p.weeklySchedule === "string";
  const hasWarmupExercises = p.warmup && typeof (p.warmup as Record<string, unknown>).exercises !== "undefined";

  return hasSplit || hasWeeklySchedule || Boolean(hasWarmupExercises);
}
