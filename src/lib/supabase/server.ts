// src/lib/supabase/server.ts
// 서버 사이드 Supabase 클라이언트 (App Router Route Handlers용)

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Route Handler에서 사용할 서버 클라이언트 생성
 * 쿠키 기반 인증 세션 사용
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Route Handler에서 응답 후 쿠키 설정 시도 시 무시
          }
        },
      },
    }
  );
}

/**
 * Service Role 키를 사용하는 관리자 클라이언트
 * RLS를 우회할 수 있으므로 주의해서 사용
 */
export function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.");
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}

/**
 * 현재 인증된 사용자 가져오기
 */
export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
