// src/lib/plan/planSchema.ts
// Zod 스키마 정의 - NEW 표준 플랜 스키마

import { z } from "zod";

// 운동 개별 항목 스키마
export const ExerciseSchema = z.object({
  exercise_key: z
    .string()
    .regex(/^[a-z0-9_]+$/, "exercise_key는 소문자, 숫자, 언더스코어만 허용"),
  name_ko: z.string().min(1, "운동 이름 필수"),
  muscle_ko: z.string().min(1, "근육 부위 필수"),
  equipment_ko: z.string().min(1, "장비 필수"),
  sets: z.number().int().min(1).max(10),
  reps: z.string().min(1, "반복 횟수 필수"), // "8-10", "12" 등 문자열
  rest_seconds: z.number().int().min(0).max(300),
  instructions_ko: z.string().min(1, "지시사항 필수"),
});

// 일일 운동 스키마
export const DaySchema = z.object({
  day_index: z.number().int().min(1).max(7),
  title_ko: z.string().min(1, "제목 필수"),
  focus_ko: z.string().min(1, "포커스 필수"),
  estimated_minutes: z.number().int().min(10).max(120),
  warmup: z.array(z.string()).min(1, "웜업 최소 1개"),
  exercises: z.array(ExerciseSchema).min(1, "운동 최소 1개"),
  cooldown: z.array(z.string()).min(1, "쿨다운 최소 1개"),
});

// Split ID enum
export const SplitIdSchema = z.enum([
  "2day_fullbody",
  "3day_push_pull_legs",
  "4day_upper_lower",
  "5day_bro_split",
  "6day_ppl_twice",
]);

// 전체 플랜 스키마
export const PlanSchema = z.object({
  plan_version: z.literal("1.0"),
  split_id: SplitIdSchema,
  split_name_ko: z.string().min(1),
  weekly_schedule_ko: z.string().min(1),
  days: z.array(DaySchema).min(1).max(7),
  notes_ko: z.array(z.string()).default([]),
});

// 타입 추출
export type Exercise = z.infer<typeof ExerciseSchema>;
export type Day = z.infer<typeof DaySchema>;
export type SplitId = z.infer<typeof SplitIdSchema>;
export type Plan = z.infer<typeof PlanSchema>;

// 레거시 플랜 타입 (마이그레이션용)
export interface LegacyExercise {
  name: string;
  reps: string | number;
  sets: number;
  muscle: string;
  instructions: string;
  rest_seconds: number;
  equipment?: string;
}

export interface LegacyDay {
  day: number;
  name: string;
  focus: string;
  duration: number;
  exercises: LegacyExercise[];
}

export interface LegacyPlan {
  split: string;
  weeklySchedule: string;
  warmup: {
    duration: number;
    exercises: string[];
  };
  cooldown: {
    duration: number;
    exercises: string[];
  };
  days: LegacyDay[];
}
