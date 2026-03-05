// src/lib/supabase.ts
// Supabase 클라이언트 설정

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── 타입 정의 ────────────────────────────────────────────────────────────────
export type UserProfile = {
  id?: string;
  user_id: string;
  gender?: string;
  age?: string;
  height_weight?: string;
  goal?: string;
  experience?: string;
  frequency?: string;
  injuries?: string;
  equipment?: string;
};

export type WorkoutPlan = {
  id?: string;
  user_id: string;
  plan_data: object;
};

export type WorkoutSession = {
  id?: string;
  user_id: string;
  session_date: string;
  session_data: object;
};

// ─── Auth 함수들 ───────────────────────────────────────────────────────────────

// 회원가입
export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  return { data, error };
}

// 로그인
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

// 로그아웃
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// 현재 유저 가져오기
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ─── 프로필 함수들 ─────────────────────────────────────────────────────────────

// 프로필 저장 (없으면 insert, 있으면 update)
export async function saveProfile(profile: UserProfile) {
  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(profile, { onConflict: "user_id" })
    .select()
    .single();
  return { data, error };
}

// 프로필 불러오기
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return { data, error };
}

// ─── 운동 플랜 함수들 ──────────────────────────────────────────────────────────

// 플랜 저장
export async function saveWorkoutPlan(userId: string, planData: object) {
  // 기존 플랜 삭제 후 새로 저장
  await supabase.from("workout_plans").delete().eq("user_id", userId);

  const { data, error } = await supabase
    .from("workout_plans")
    .insert({ user_id: userId, plan_data: planData })
    .select()
    .single();
  return { data, error };
}

// 플랜 불러오기
export async function getWorkoutPlan(userId: string) {
  const { data, error } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return { data, error };
}

// ─── 운동 세션 함수들 ──────────────────────────────────────────────────────────

// 세션 저장
export async function saveWorkoutSession(
  userId: string,
  sessionDate: string,
  sessionData: object
) {
  const { data, error } = await supabase
    .from("workout_sessions")
    .upsert(
      { user_id: userId, session_date: sessionDate, session_data: sessionData },
      { onConflict: "user_id,session_date" }
    )
    .select()
    .single();
  return { data, error };
}

// 전체 세션 불러오기
export async function getAllSessions(userId: string) {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("session_date", { ascending: false });
  return { data, error };
}
