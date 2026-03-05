// src/lib/ai/prompts.ts
// AI 프롬프트 빌더

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
 * 주당 운동 횟수에서 split_id 결정
 */
function determineSplitId(frequency: string): string {
  const freq = frequency?.toLowerCase() || "";

  if (freq.includes("2") || freq.includes("두")) return "2day_fullbody";
  if (freq.includes("3") || freq.includes("세")) return "3day_push_pull_legs";
  if (freq.includes("4") || freq.includes("네")) return "4day_upper_lower";
  if (freq.includes("5") || freq.includes("다섯")) return "5day_bro_split";
  if (freq.includes("6") || freq.includes("여섯") || freq.includes("매일")) return "6day_ppl_twice";

  return "3day_push_pull_legs"; // 기본값
}

/**
 * 시스템 프롬프트 생성
 */
export function buildPlanSystemPrompt(): string {
  return `당신은 전문 피트니스 트레이너입니다. 사용자의 프로필을 기반으로 맞춤형 운동 플랜을 JSON 형식으로 생성합니다.

중요 규칙:
1. 반드시 유효한 JSON만 반환하세요. 마크다운 코드 블록(\`\`\`)이나 설명 없이 순수 JSON만 출력하세요.
2. 모든 사용자 대상 문자열은 한국어로 작성하세요.
3. 아래 스키마를 정확히 따르세요.
4. 숫자 필드는 숫자로, reps는 반드시 문자열("8-10", "12" 등)로 작성하세요.
5. exercise_key는 소문자 영문, 숫자, 언더스코어(_)만 사용하고 플랜 내에서 고유해야 합니다.

안전 지침:
- 초보자에게 안전한 운동 위주로 구성하세요.
- 고급 올림픽 리프트(스내치, 클린앤저크 등)는 피하세요.
- 1RM 프로그래밍은 피하세요.
- 총 운동 시간은 45-60분 이내로 구성하세요.
- 반드시 웜업과 쿨다운을 포함하세요.
- 부상이 있는 경우 해당 부위를 피하는 대체 운동을 제안하세요.

JSON 스키마:
{
  "plan_version": "1.0",
  "split_id": "2day_fullbody | 3day_push_pull_legs | 4day_upper_lower | 5day_bro_split | 6day_ppl_twice",
  "split_name_ko": "분할 방식 한글 이름",
  "weekly_schedule_ko": "주간 스케줄 설명 (예: 주 3회, 월/수/금 권장)",
  "days": [
    {
      "day_index": 1,
      "title_ko": "운동 제목 (예: 푸쉬 데이)",
      "focus_ko": "주요 타겟 근육",
      "estimated_minutes": 50,
      "warmup": ["웜업 동작1", "웜업 동작2"],
      "exercises": [
        {
          "exercise_key": "bench_press",
          "name_ko": "벤치 프레스",
          "muscle_ko": "가슴",
          "equipment_ko": "바벨",
          "sets": 3,
          "reps": "8-10",
          "rest_seconds": 90,
          "instructions_ko": "자세 설명"
        }
      ],
      "cooldown": ["쿨다운 동작1", "쿨다운 동작2"]
    }
  ],
  "notes_ko": ["주의사항1", "주의사항2"]
}`;
}

/**
 * 사용자 프롬프트 생성
 */
export function buildPlanUserPrompt(profile: UserProfile): string {
  const splitId = determineSplitId(profile.frequency || "3");

  return `다음 사용자 프로필을 기반으로 맞춤형 운동 플랜을 JSON으로 생성해주세요.

사용자 프로필:
- 성별: ${profile.gender || "미지정"}
- 나이: ${profile.age || "미지정"}
- 키/몸무게: ${profile.height_weight || "미지정"}
- 운동 목표: ${profile.goal || "전반적인 체력 향상"}
- 운동 경험: ${profile.experience || "초보자"}
- 주당 운동 횟수: ${profile.frequency || "주 3회"}
- 부상/주의사항: ${profile.injuries || "없음"}
- 사용 가능한 장비: ${profile.equipment || "헬스장 전체 장비"}

권장 split_id: ${splitId}

위 프로필을 기반으로 개인화된 운동 플랜을 생성하세요. JSON만 반환하세요.`;
}

/**
 * 수정 프롬프트 생성 (AI 응답이 유효하지 않을 때)
 */
export function buildPlanRepairPrompt(badOutput: string, profile: UserProfile): string {
  return `이전 응답이 유효한 JSON이 아니었습니다. 다음 오류를 수정하고 올바른 JSON만 반환해주세요.

이전 잘못된 응답:
${badOutput.slice(0, 500)}${badOutput.length > 500 ? "..." : ""}

요구사항:
1. 마크다운 코드 블록(\`\`\`) 없이 순수 JSON만 출력
2. 모든 문자열은 한국어
3. reps는 문자열 (예: "8-10")
4. exercise_key는 소문자_숫자_언더스코어만 사용
5. plan_version은 "1.0"

사용자 프로필:
- 성별: ${profile.gender || "미지정"}
- 나이: ${profile.age || "미지정"}
- 운동 목표: ${profile.goal || "전반적인 체력 향상"}
- 운동 경험: ${profile.experience || "초보자"}
- 주당 운동 횟수: ${profile.frequency || "주 3회"}

올바른 JSON 플랜을 다시 생성해주세요.`;
}
