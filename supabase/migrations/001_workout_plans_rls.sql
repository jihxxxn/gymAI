-- ============================================================================
-- GymAI Supabase Migration Script
-- 실행 방법: Supabase Dashboard > SQL Editor에서 이 스크립트를 복사하여 실행
-- ============================================================================

-- 1. workout_plans 테이블 생성 (새 스키마)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_version TEXT NOT NULL DEFAULT '1.0',
  plan_json JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. profiles 테이블 생성 (권장)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. 기존 user_profiles 테이블이 있다면 유지 (호환성)
-- ============================================================================
-- 기존 테이블 구조 확인 후 필요시 아래 주석 해제
-- ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 4. 인덱스 생성
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON public.workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_active ON public.workout_plans(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- 5. RLS (Row Level Security) 활성화
-- ============================================================================
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. workout_plans RLS 정책
-- ============================================================================
-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Users can insert own workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Users can update own workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Users can delete own workout plans" ON public.workout_plans;

-- 새 정책 생성
CREATE POLICY "Users can view own workout plans"
  ON public.workout_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout plans"
  ON public.workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout plans"
  ON public.workout_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout plans"
  ON public.workout_plans FOR DELETE
  USING (auth.uid() = user_id);

-- 7. profiles RLS 정책
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 8. user_profiles 테이블 RLS (기존 테이블용)
-- ============================================================================
-- 기존 user_profiles 테이블이 있다면 RLS 활성화
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

    -- 기존 정책 삭제
    DROP POLICY IF EXISTS "Users can view own user profile" ON public.user_profiles;
    DROP POLICY IF EXISTS "Users can insert own user profile" ON public.user_profiles;
    DROP POLICY IF EXISTS "Users can update own user profile" ON public.user_profiles;

    -- 새 정책 생성
    CREATE POLICY "Users can view own user profile"
      ON public.user_profiles FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert own user profile"
      ON public.user_profiles FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own user profile"
      ON public.user_profiles FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 9. workout_sessions 테이블 RLS (기존 테이블용)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workout_sessions' AND table_schema = 'public') THEN
    ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view own sessions" ON public.workout_sessions;
    DROP POLICY IF EXISTS "Users can insert own sessions" ON public.workout_sessions;
    DROP POLICY IF EXISTS "Users can update own sessions" ON public.workout_sessions;

    CREATE POLICY "Users can view own sessions"
      ON public.workout_sessions FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert own sessions"
      ON public.workout_sessions FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own sessions"
      ON public.workout_sessions FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 10. updated_at 자동 업데이트 트리거
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- workout_plans 트리거
DROP TRIGGER IF EXISTS set_workout_plans_updated_at ON public.workout_plans;
CREATE TRIGGER set_workout_plans_updated_at
  BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- profiles 트리거
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 11. 사용자당 하나의 활성 플랜만 유지하는 함수 (선택적)
-- ============================================================================
-- API에서 처리하므로 이 함수는 선택적입니다.
-- 필요하다면 아래 주석을 해제하세요.

/*
CREATE OR REPLACE FUNCTION public.ensure_single_active_plan()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.workout_plans
    SET is_active = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_active_plan_trigger ON public.workout_plans;
CREATE TRIGGER ensure_single_active_plan_trigger
  AFTER INSERT OR UPDATE OF is_active ON public.workout_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_active_plan();
*/

-- ============================================================================
-- 마이그레이션 완료!
-- ============================================================================
