"use client";

import { useState, useEffect, useRef } from "react";
import {
  supabase,
  signUp,
  signIn,
  signOut,
  saveProfile,
  getProfile,
  saveWorkoutPlan,
  getWorkoutPlan,
  saveWorkoutSession,
  getAllSessions,
} from "@/lib/supabase";

// ─── Exercise Database ──────────────────────────────────────────────────────
const EXERCISE_DB = [
  { id: 1, name: "벤치 프레스", muscle: "가슴", equipment: "바벨", difficulty: "beginner", instructions: "바를 가슴 너비로 잡고 천천히 내렸다가 밀어올리세요." },
  { id: 2, name: "랫 풀다운", muscle: "등", equipment: "케이블", difficulty: "beginner", instructions: "바를 가슴 앞까지 당기며 날개뼈를 모아주세요." },
  { id: 3, name: "숄더 프레스", muscle: "어깨", equipment: "덤벨", difficulty: "beginner", instructions: "덤벨을 귀 옆에서 위로 밀어올리세요." },
  { id: 4, name: "스쿼트", muscle: "하체", equipment: "바벨", difficulty: "beginner", instructions: "발을 어깨너비로 벌리고 무릎이 발끝을 넘지 않게 앉으세요." },
  { id: 5, name: "레그 프레스", muscle: "하체", equipment: "머신", difficulty: "beginner", instructions: "발판을 밀어내듯 다리를 펴주세요." },
  { id: 6, name: "덤벨 컬", muscle: "이두", equipment: "덤벨", difficulty: "beginner", instructions: "팔꿈치를 고정한 채 덤벨을 말아올리세요." },
  { id: 7, name: "트라이셉스 푸시다운", muscle: "삼두", equipment: "케이블", difficulty: "beginner", instructions: "팔꿈치를 고정하고 케이블을 아래로 눌러주세요." },
  { id: 8, name: "케이블 로우", muscle: "등", equipment: "케이블", difficulty: "beginner", instructions: "상체를 고정하고 케이블을 배꼽 방향으로 당기세요." },
  { id: 9, name: "레그 컬", muscle: "햄스트링", equipment: "머신", difficulty: "beginner", instructions: "누운 상태에서 발꿈치로 허벅지 뒤를 말아올리세요." },
  { id: 10, name: "케이블 크런치", muscle: "복근", equipment: "케이블", difficulty: "beginner", instructions: "케이블을 잡고 상체를 말아 복근을 수축하세요." },
  { id: 11, name: "인클라인 덤벨 프레스", muscle: "가슴", equipment: "덤벨", difficulty: "beginner", instructions: "인클라인 벤치에 누워 덤벨을 위로 밀어올리세요." },
  { id: 12, name: "레그 익스텐션", muscle: "대퇴사두", equipment: "머신", difficulty: "beginner", instructions: "머신에 앉아 다리를 위로 뻗어주세요." },
  { id: 13, name: "페이스 풀", muscle: "후면 어깨", equipment: "케이블", difficulty: "beginner", instructions: "케이블을 얼굴 방향으로 당기며 팔꿈치를 벌려주세요." },
  { id: 14, name: "힙 어브덕션", muscle: "엉덩이", equipment: "머신", difficulty: "beginner", instructions: "머신에 앉아 다리를 양옆으로 벌려주세요." },
  { id: 15, name: "플랭크", muscle: "코어", equipment: "없음", difficulty: "beginner", instructions: "팔꿈치와 발끝으로 버티며 몸을 일자로 유지하세요." },
  { id: 16, name: "덤벨 로우", muscle: "등", equipment: "덤벨", difficulty: "beginner", instructions: "한쪽 무릎을 벤치에 올리고 덤벨을 옆구리로 당기세요." },
  { id: 17, name: "사이드 레터럴 레이즈", muscle: "측면 어깨", equipment: "덤벨", difficulty: "beginner", instructions: "팔을 옆으로 들어 어깨 높이까지 올리세요." },
  { id: 18, name: "칼프 레이즈", muscle: "종아리", equipment: "없음", difficulty: "beginner", instructions: "발끝으로 서서 종아리 근육을 수축하세요." },
];

const ONBOARDING_QUESTIONS = [
  { key: "gender", text: "안녕하세요! 저는 당신의 AI 퍼스널 트레이너예요 💪\n\n먼저 성별을 알려주세요.", options: ["남성", "여성", "기타"] },
  { key: "age", text: "나이가 어떻게 되시나요?", options: ["10대", "20대", "30대", "40대", "50대 이상"] },
  { key: "height_weight", text: "키와 몸무게를 알려주세요.\n(예: 175cm, 70kg)", options: null },
  { key: "goal", text: "운동 목표가 무엇인가요?", options: ["체지방 감소", "근육 증가", "전반적인 건강", "체력 향상"] },
  { key: "experience", text: "헬스 경험이 어느 정도 되시나요?", options: ["완전 초보 (처음)", "초보 (3개월 미만)", "초급 (3~6개월)"] },
  { key: "frequency", text: "일주일에 몇 번 운동하고 싶으신가요?", options: ["주 2회", "주 3회", "주 4회", "주 5회", "주 6회"] },
  { key: "injuries", text: "부상이나 신체적 제한 사항이 있으신가요?", options: ["없음", "무릎 통증", "허리 통증", "어깨 통증", "기타"] },
  { key: "equipment", text: "사용 가능한 기구를 알려주세요.", options: ["풀장비 헬스장", "덤벨만", "머신 위주", "맨몸 운동만"] },
];

async function callAI(messages, systemPrompt) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system: systemPrompt }),
  });
  const data = await response.json();
  return data.text || "";
}

function generateId() { return Math.random().toString(36).slice(2, 9); }
function today() { return new Date().toLocaleDateString("ko-KR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }); }
function todayKey() { return new Date().toISOString().slice(0, 10); }

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function GymAI() {
  const [screen, setScreen] = useState("loading"); // loading | login | app
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "", name: "" });
  const [isSignup, setIsSignup] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userProfile, setUserProfile] = useState({});
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [sessions, setSessions] = useState({});
  const [todaySession, setTodaySession] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Supabase Auth 세션 감지 ────────────────────────────────────────────────
  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user);
      } else {
        setScreen("login");
      }
    });

    // 로그인/로그아웃 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserData(session.user);
      } else {
        setScreen("login");
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserData(authUser) {
    setUser(authUser);
    setScreen("app");

    // 프로필 불러오기
    const { data: profile } = await getProfile(authUser.id);
    if (profile) {
      setUserProfile(profile);
    }

    // 운동 플랜 불러오기
    const { data: planData } = await getWorkoutPlan(authUser.id);
    if (planData?.plan_data) {
      setWorkoutPlan(planData.plan_data);
      setOnboardingDone(true);
      const name = authUser.user_metadata?.name || authUser.email.split("@")[0];
      setMessages([{ id: generateId(), role: "assistant", text: `다시 오셨군요, ${name}님! 💪\n\n"오늘 운동 알려줘", "루틴 보여줘"를 입력해보세요!` }]);
    } else {
      startOnboarding();
    }

    // 세션 기록 불러오기
    const { data: sessionList } = await getAllSessions(authUser.id);
    if (sessionList) {
      const sessionMap = {};
      sessionList.forEach(s => { sessionMap[s.session_date] = s.session_data; });
      setSessions(sessionMap);
    }
  }

  function startOnboarding() {
    const q = ONBOARDING_QUESTIONS[0];
    setMessages([{ id: generateId(), role: "assistant", text: q.text, options: q.options, questionKey: q.key }]);
  }

  // ─── 로그인 / 회원가입 ────────────────────────────────────────────────────────
  async function handleAuth() {
    if (!loginForm.email || !loginForm.password) return;
    setAuthLoading(true);
    setAuthError("");

    if (isSignup) {
      if (!loginForm.name) { setAuthError("이름을 입력해주세요."); setAuthLoading(false); return; }
      console.log("=== 회원가입 시도 ===");
      console.log("Email:", loginForm.email);
      console.log("Name:", loginForm.name);
      const { data, error } = await signUp(loginForm.email, loginForm.password, loginForm.name);
      console.log("SignUp 결과 - data:", data);
      console.log("SignUp 결과 - error:", error);
      if (error) {
        setAuthError(error.message === "User already registered" ? "이미 가입된 이메일이에요." : "회원가입 실패: " + error.message);
      }
    } else {
      console.log("=== 로그인 시도 ===");
      console.log("Email:", loginForm.email);
      const { data, error } = await signIn(loginForm.email, loginForm.password);
      console.log("SignIn 결과 - data:", data);
      console.log("SignIn 결과 - error:", error);
      if (error) {
        console.log("로그인 에러 발생:", error.message);
        setAuthError("이메일 또는 비밀번호가 틀렸어요.");
      }
    }
    setAuthLoading(false);
  }

  async function handleLogout() {
    await signOut();
    setMessages([]); setWorkoutPlan(null);
    setUserProfile({}); setOnboardingDone(false); setOnboardingStep(0);
  }

  // ─── 온보딩 ────────────────────────────────────────────────────────────────
  async function handleOptionSelect(option, questionKey) {
    addMessage("user", option);
    const newProfile = { ...userProfile, [questionKey]: option };
    setUserProfile(newProfile);

    const nextStep = onboardingStep + 1;
    if (nextStep < ONBOARDING_QUESTIONS.length) {
      setOnboardingStep(nextStep);
      const q = ONBOARDING_QUESTIONS[nextStep];
      setTimeout(() => addMessage("assistant", q.text, q.options, q.key), 600);
    } else {
      await finishOnboarding(newProfile);
    }
  }

  async function finishOnboarding(profile) {
    setIsTyping(true);
    addMessage("assistant", "완벽해요! 🎉 맞춤형 운동 루틴을 만들고 있어요...");

    // Supabase에 프로필 저장
    await saveProfile({ user_id: user.id, ...profile });

    const plan = await generateWorkoutPlan(profile);
    setWorkoutPlan(plan);

    // Supabase에 플랜 저장
    await saveWorkoutPlan(user.id, plan);

    setOnboardingDone(true);
    setIsTyping(false);
    const name = user.user_metadata?.name || user.email.split("@")[0];
    // 새 스키마 vs 레거시 스키마 호환
    const splitName = plan.split_name_ko || plan.split;
    addMessage("assistant", `${name}님을 위한 ${splitName}이 완성되었습니다! 💪\n\n'운동 계획' 탭에서 루틴을 확인하거나 "오늘 운동 알려줘"라고 말씀해 보세요!`);
  }

  async function handleTextInput(text) {
    if (!text.trim()) return;
    setInputText("");
    addMessage("user", text);
    setIsTyping(true);

    if (!onboardingDone && onboardingStep < ONBOARDING_QUESTIONS.length) {
      const q = ONBOARDING_QUESTIONS[onboardingStep];
      const newProfile = { ...userProfile, [q.key]: text };
      setUserProfile(newProfile);
      const nextStep = onboardingStep + 1;
      setOnboardingStep(nextStep);
      if (nextStep < ONBOARDING_QUESTIONS.length) {
        setIsTyping(false);
        addMessage("assistant", ONBOARDING_QUESTIONS[nextStep].text, ONBOARDING_QUESTIONS[nextStep].options, ONBOARDING_QUESTIONS[nextStep].key);
      } else {
        await finishOnboarding(newProfile);
      }
      return;
    }

    const reply = await handleChatMessage(text);
    setIsTyping(false);
    addMessage("assistant", reply);
  }

  function addMessage(role, text, options = null, questionKey = null) {
    setMessages(prev => [...prev, { id: generateId(), role, text, options, questionKey }]);
  }

  // ─── AI 플랜 생성 ──────────────────────────────────────────────────────────
  async function generateWorkoutPlan(profile) {
    const freq = profile.frequency || "주 3회";
    const days = parseInt(freq.replace(/[^0-9]/g, "")) || 3;
    const systemPrompt = `당신은 한국어로 대화하는 전문 퍼스널 트레이너입니다. 반드시 유효한 JSON만 반환하세요.`;
    const prompt = `다음 조건에 맞는 ${days}일 운동 루틴을 JSON으로 생성해주세요:
- 목표: ${profile.goal || "전반적인 건강"}, 주 빈도: ${days}일, 기구: ${profile.equipment || "풀장비 헬스장"}, 부상: ${profile.injuries || "없음"}, 경험: 초보자
JSON 구조:
{"split":"${days}일 분할 루틴","weeklySchedule":"요일 일정","warmup":{"duration":10,"exercises":["스트레칭1","스트레칭2"]},"cooldown":{"duration":5,"exercises":["쿨다운1"]},"days":[{"day":1,"name":"상체","focus":"가슴, 등","duration":50,"exercises":[{"name":"벤치 프레스","sets":3,"reps":"10","rest_seconds":90,"instructions":"설명","muscle":"가슴"}]}]}`;
    try {
      const text = await callAI([{ role: "user", content: prompt }], systemPrompt);
      const clean = text.replace(/```json|```/g, "").trim();
      return JSON.parse(clean);
    } catch {
      return buildFallbackPlan(days);
    }
  }

  function buildFallbackPlan(days) {
    const plans = {
      2: [
        { day: 1, name: "전신 A", focus: "가슴, 등, 하체", duration: 50, exercises: [
          { name: "벤치 프레스", sets: 3, reps: "10", rest_seconds: 90, instructions: "가슴으로 내리고 밀어올리세요", muscle: "가슴" },
          { name: "랫 풀다운", sets: 3, reps: "12", rest_seconds: 90, instructions: "날개뼈를 모으며 당기세요", muscle: "등" },
          { name: "레그 프레스", sets: 3, reps: "15", rest_seconds: 90, instructions: "발판을 밀어내듯 펴세요", muscle: "하체" },
          { name: "플랭크", sets: 3, reps: "30초", rest_seconds: 60, instructions: "몸을 일자로 유지하세요", muscle: "코어" },
        ]},
        { day: 2, name: "전신 B", focus: "어깨, 팔, 하체", duration: 50, exercises: [
          { name: "숄더 프레스", sets: 3, reps: "10", rest_seconds: 90, instructions: "귀 옆에서 위로 밀어올리세요", muscle: "어깨" },
          { name: "덤벨 컬", sets: 3, reps: "12", rest_seconds: 60, instructions: "팔꿈치 고정 후 말아올리세요", muscle: "이두" },
          { name: "스쿼트", sets: 3, reps: "12", rest_seconds: 90, instructions: "무릎이 발끝 넘지 않게 앉으세요", muscle: "하체" },
          { name: "케이블 크런치", sets: 3, reps: "15", rest_seconds: 60, instructions: "복근을 수축하며 내려가세요", muscle: "복근" },
        ]},
      ],
      3: [
        { day: 1, name: "상체 (밀기)", focus: "가슴, 어깨, 삼두", duration: 50, exercises: [
          { name: "벤치 프레스", sets: 3, reps: "10", rest_seconds: 90, instructions: "가슴으로 내리고 밀어올리세요", muscle: "가슴" },
          { name: "숄더 프레스", sets: 3, reps: "10", rest_seconds: 90, instructions: "귀 옆에서 위로 밀어올리세요", muscle: "어깨" },
          { name: "트라이셉스 푸시다운", sets: 3, reps: "12", rest_seconds: 60, instructions: "팔꿈치 고정 후 아래로 누르세요", muscle: "삼두" },
        ]},
        { day: 2, name: "하체", focus: "대퇴사두, 햄스트링, 엉덩이", duration: 50, exercises: [
          { name: "레그 프레스", sets: 4, reps: "12", rest_seconds: 90, instructions: "발판을 밀어내듯 펴세요", muscle: "하체" },
          { name: "레그 컬", sets: 3, reps: "12", rest_seconds: 90, instructions: "발꿈치로 말아올리세요", muscle: "햄스트링" },
          { name: "칼프 레이즈", sets: 3, reps: "20", rest_seconds: 60, instructions: "종아리를 수축하세요", muscle: "종아리" },
        ]},
        { day: 3, name: "상체 (당기기)", focus: "등, 이두, 후면 어깨", duration: 50, exercises: [
          { name: "랫 풀다운", sets: 4, reps: "12", rest_seconds: 90, instructions: "날개뼈를 모으며 당기세요", muscle: "등" },
          { name: "케이블 로우", sets: 3, reps: "12", rest_seconds: 90, instructions: "배꼽 방향으로 당기세요", muscle: "등 중부" },
          { name: "덤벨 컬", sets: 3, reps: "12", rest_seconds: 60, instructions: "팔꿈치 고정 후 말아올리세요", muscle: "이두" },
        ]},
      ],
      4: [
        { day: 1, name: "가슴 & 삼두", focus: "가슴, 삼두", duration: 50, exercises: [
          { name: "벤치 프레스", sets: 4, reps: "10", rest_seconds: 90, instructions: "가슴으로 내리고 밀어올리세요", muscle: "가슴" },
          { name: "인클라인 덤벨 프레스", sets: 3, reps: "12", rest_seconds: 90, instructions: "인클라인에서 밀어올리세요", muscle: "가슴 상부" },
          { name: "트라이셉스 푸시다운", sets: 3, reps: "12", rest_seconds: 60, instructions: "아래로 누르세요", muscle: "삼두" },
        ]},
        { day: 2, name: "등 & 이두", focus: "등, 이두", duration: 50, exercises: [
          { name: "랫 풀다운", sets: 4, reps: "12", rest_seconds: 90, instructions: "날개뼈를 모으며 당기세요", muscle: "등" },
          { name: "케이블 로우", sets: 3, reps: "12", rest_seconds: 90, instructions: "배꼽 방향으로 당기세요", muscle: "등 중부" },
          { name: "덤벨 컬", sets: 3, reps: "12", rest_seconds: 60, instructions: "말아올리세요", muscle: "이두" },
        ]},
        { day: 3, name: "하체", focus: "전체 하체", duration: 55, exercises: [
          { name: "레그 프레스", sets: 4, reps: "12", rest_seconds: 90, instructions: "발판을 밀어내듯 펴세요", muscle: "하체" },
          { name: "레그 컬", sets: 3, reps: "12", rest_seconds: 90, instructions: "말아올리세요", muscle: "햄스트링" },
          { name: "칼프 레이즈", sets: 4, reps: "20", rest_seconds: 60, instructions: "종아리를 수축하세요", muscle: "종아리" },
        ]},
        { day: 4, name: "어깨 & 복근", focus: "어깨, 복근", duration: 45, exercises: [
          { name: "숄더 프레스", sets: 4, reps: "10", rest_seconds: 90, instructions: "위로 밀어올리세요", muscle: "어깨" },
          { name: "사이드 레터럴 레이즈", sets: 3, reps: "15", rest_seconds: 60, instructions: "옆으로 올리세요", muscle: "측면 어깨" },
          { name: "플랭크", sets: 3, reps: "30초", rest_seconds: 60, instructions: "일자로 유지하세요", muscle: "코어" },
        ]},
      ],
      5: [
        { day: 1, name: "가슴", focus: "가슴 전체", duration: 45, exercises: [
          { name: "벤치 프레스", sets: 4, reps: "10", rest_seconds: 90, instructions: "가슴으로 내리고 밀어올리세요", muscle: "가슴" },
          { name: "인클라인 덤벨 프레스", sets: 3, reps: "12", rest_seconds: 90, instructions: "인클라인에서 밀어올리세요", muscle: "가슴 상부" },
          { name: "케이블 플라이", sets: 3, reps: "15", rest_seconds: 60, instructions: "가슴을 모아주세요", muscle: "가슴" },
        ]},
        { day: 2, name: "등", focus: "등 전체", duration: 45, exercises: [
          { name: "랫 풀다운", sets: 4, reps: "12", rest_seconds: 90, instructions: "날개뼈를 모으며 당기세요", muscle: "등" },
          { name: "케이블 로우", sets: 3, reps: "12", rest_seconds: 90, instructions: "배꼽 방향으로 당기세요", muscle: "등 중부" },
          { name: "덤벨 로우", sets: 3, reps: "12", rest_seconds: 75, instructions: "옆구리로 당기세요", muscle: "광배근" },
        ]},
        { day: 3, name: "어깨", focus: "어깨 전체", duration: 40, exercises: [
          { name: "숄더 프레스", sets: 4, reps: "10", rest_seconds: 90, instructions: "위로 밀어올리세요", muscle: "어깨" },
          { name: "사이드 레터럴 레이즈", sets: 3, reps: "15", rest_seconds: 60, instructions: "옆으로 올리세요", muscle: "측면 어깨" },
          { name: "페이스 풀", sets: 3, reps: "15", rest_seconds: 60, instructions: "얼굴 방향으로 당기세요", muscle: "후면 어깨" },
        ]},
        { day: 4, name: "하체", focus: "전체 하체", duration: 55, exercises: [
          { name: "레그 프레스", sets: 4, reps: "12", rest_seconds: 90, instructions: "발판을 밀어내듯 펴세요", muscle: "대퇴사두" },
          { name: "레그 컬", sets: 3, reps: "12", rest_seconds: 90, instructions: "말아올리세요", muscle: "햄스트링" },
          { name: "레그 익스텐션", sets: 3, reps: "15", rest_seconds: 60, instructions: "다리를 펴세요", muscle: "대퇴사두" },
          { name: "칼프 레이즈", sets: 4, reps: "20", rest_seconds: 60, instructions: "종아리를 수축하세요", muscle: "종아리" },
        ]},
        { day: 5, name: "팔 & 복근", focus: "이두, 삼두, 복근", duration: 45, exercises: [
          { name: "덤벨 컬", sets: 3, reps: "12", rest_seconds: 60, instructions: "말아올리세요", muscle: "이두" },
          { name: "트라이셉스 푸시다운", sets: 3, reps: "12", rest_seconds: 60, instructions: "아래로 누르세요", muscle: "삼두" },
          { name: "케이블 크런치", sets: 3, reps: "15", rest_seconds: 60, instructions: "복근을 수축하세요", muscle: "복근" },
          { name: "플랭크", sets: 3, reps: "30초", rest_seconds: 60, instructions: "일자로 유지하세요", muscle: "코어" },
        ]},
      ],
      6: [
        { day: 1, name: "푸쉬 A (가슴 중심)", focus: "가슴, 어깨, 삼두", duration: 50, exercises: [
          { name: "벤치 프레스", sets: 4, reps: "8", rest_seconds: 90, instructions: "가슴으로 내리고 밀어올리세요", muscle: "가슴" },
          { name: "인클라인 덤벨 프레스", sets: 3, reps: "10", rest_seconds: 90, instructions: "인클라인에서 밀어올리세요", muscle: "가슴 상부" },
          { name: "사이드 레터럴 레이즈", sets: 3, reps: "15", rest_seconds: 60, instructions: "옆으로 올리세요", muscle: "측면 어깨" },
          { name: "트라이셉스 푸시다운", sets: 3, reps: "12", rest_seconds: 60, instructions: "아래로 누르세요", muscle: "삼두" },
        ]},
        { day: 2, name: "풀 A (등 중심)", focus: "등, 이두", duration: 50, exercises: [
          { name: "랫 풀다운", sets: 4, reps: "10", rest_seconds: 90, instructions: "날개뼈를 모으며 당기세요", muscle: "등" },
          { name: "케이블 로우", sets: 3, reps: "12", rest_seconds: 90, instructions: "배꼽 방향으로 당기세요", muscle: "등 중부" },
          { name: "페이스 풀", sets: 3, reps: "15", rest_seconds: 60, instructions: "얼굴 방향으로 당기세요", muscle: "후면 어깨" },
          { name: "덤벨 컬", sets: 3, reps: "12", rest_seconds: 60, instructions: "말아올리세요", muscle: "이두" },
        ]},
        { day: 3, name: "레그 A", focus: "대퇴사두 중심", duration: 50, exercises: [
          { name: "레그 프레스", sets: 4, reps: "10", rest_seconds: 90, instructions: "발판을 밀어내듯 펴세요", muscle: "대퇴사두" },
          { name: "레그 익스텐션", sets: 3, reps: "12", rest_seconds: 60, instructions: "다리를 펴세요", muscle: "대퇴사두" },
          { name: "레그 컬", sets: 3, reps: "12", rest_seconds: 60, instructions: "말아올리세요", muscle: "햄스트링" },
          { name: "칼프 레이즈", sets: 4, reps: "20", rest_seconds: 45, instructions: "종아리를 수축하세요", muscle: "종아리" },
        ]},
        { day: 4, name: "푸쉬 B (어깨 중심)", focus: "어깨, 가슴, 삼두", duration: 50, exercises: [
          { name: "숄더 프레스", sets: 4, reps: "10", rest_seconds: 90, instructions: "위로 밀어올리세요", muscle: "어깨" },
          { name: "인클라인 덤벨 프레스", sets: 3, reps: "12", rest_seconds: 90, instructions: "인클라인에서 밀어올리세요", muscle: "가슴 상부" },
          { name: "사이드 레터럴 레이즈", sets: 3, reps: "15", rest_seconds: 60, instructions: "옆으로 올리세요", muscle: "측면 어깨" },
          { name: "트라이셉스 푸시다운", sets: 3, reps: "12", rest_seconds: 60, instructions: "아래로 누르세요", muscle: "삼두" },
        ]},
        { day: 5, name: "풀 B", focus: "등, 이두", duration: 50, exercises: [
          { name: "덤벨 로우", sets: 4, reps: "10", rest_seconds: 90, instructions: "옆구리로 당기세요", muscle: "광배근" },
          { name: "랫 풀다운", sets: 3, reps: "12", rest_seconds: 90, instructions: "날개뼈를 모으며 당기세요", muscle: "등" },
          { name: "페이스 풀", sets: 3, reps: "15", rest_seconds: 60, instructions: "얼굴 방향으로 당기세요", muscle: "후면 어깨" },
          { name: "덤벨 컬", sets: 3, reps: "12", rest_seconds: 60, instructions: "말아올리세요", muscle: "이두" },
        ]},
        { day: 6, name: "레그 B", focus: "햄스트링, 둔근 중심", duration: 50, exercises: [
          { name: "레그 컬", sets: 4, reps: "10", rest_seconds: 90, instructions: "말아올리세요", muscle: "햄스트링" },
          { name: "힙 어브덕션", sets: 3, reps: "15", rest_seconds: 60, instructions: "다리를 벌려주세요", muscle: "엉덩이" },
          { name: "레그 프레스", sets: 3, reps: "12", rest_seconds: 90, instructions: "발판을 밀어내듯 펴세요", muscle: "하체" },
          { name: "칼프 레이즈", sets: 4, reps: "20", rest_seconds: 45, instructions: "종아리를 수축하세요", muscle: "종아리" },
        ]},
      ],
    };
    const dayCount = Math.min(Math.max(days, 2), 6);
    return {
      split: `${dayCount}일 분할 루틴`,
      weeklySchedule: `주 ${dayCount}회 운동. 운동일 사이에 충분한 휴식을 취하세요.`,
      warmup: { duration: 10, exercises: ["5분 가벼운 유산소 (트레드밀)", "동적 스트레칭", "목표 근육 스트레칭"] },
      cooldown: { duration: 5, exercises: ["5분 정적 스트레칭", "심호흡 및 이완"] },
      days: plans[dayCount] || plans[3],
    };
  }

  async function handleChatMessage(text) {
    const lower = text.toLowerCase();
    if (lower.includes("오늘") && (lower.includes("운동") || lower.includes("뭐") || lower.includes("해야"))) return getTodayWorkout();
    if (lower.includes("너무 어렵") || lower.includes("힘들어")) return "강도를 낮춰드릴게요! 세트 수를 줄이거나 더 가벼운 무게로 시작해보세요. 💙";
    if (lower.includes("너무 쉽") || lower.includes("강도 높여")) return "좋아요! 무게를 5~10% 늘리거나 세트를 1개 추가해보세요. 💪";

    // 주 N일 루틴 요청 감지 (예: "주 5일로 바꿔줘", "5일 루틴으로 변경")
    const daysMatch = text.match(/(?:주\s*)?(\d)\s*(?:일|회)/);
    const wantsDayChange = daysMatch && (lower.includes("바꿔") || lower.includes("변경") || lower.includes("만들어") || lower.includes("루틴") || lower.includes("플랜"));
    if (wantsDayChange && daysMatch[1]) {
      const requestedDays = parseInt(daysMatch[1]);
      if (requestedDays >= 2 && requestedDays <= 6) {
        return await regenerateWorkoutPlan(requestedDays);
      }
    }

    // 루틴 변경 요청 감지
    const wantsNewPlan = (lower.includes("루틴") || lower.includes("플랜") || lower.includes("계획")) &&
      (lower.includes("변경") || lower.includes("바꿔") || lower.includes("바꾸") || lower.includes("새로") || lower.includes("다시") || lower.includes("만들어"));
    if (wantsNewPlan) {
      return await regenerateWorkoutPlan();
    }

    // 단순 루틴 보기
    if (lower.includes("루틴") || lower.includes("계획")) { setActiveTab("plan"); return "운동 계획 탭으로 이동했어요! 💪"; }
    if (lower.includes("진행") || lower.includes("기록")) { setActiveTab("progress"); return "진행 상황 탭으로 이동했어요! 📊"; }

    // AI 대화 - 이전 대화 히스토리 포함 (최근 10개)
    const systemPrompt = `당신은 한국어로 대화하는 친절한 AI 퍼스널 트레이너입니다. 사용자의 운동 목표와 이전 대화 맥락을 기억하고 일관성 있게 답변하세요.`;
    try {
      // 최근 대화 히스토리 구성
      const recentMessages = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.text
      }));
      recentMessages.push({ role: "user", content: text });
      return await callAI(recentMessages, systemPrompt);
    } catch {
      return "잠시 문제가 발생했어요. 다시 시도해 주세요! 💙";
    }
  }

  async function regenerateWorkoutPlan(requestedDays = null) {
    setIsTyping(true);
    const daysText = requestedDays ? `주 ${requestedDays}일` : "새로운";
    addMessage("assistant", `${daysText} 운동 루틴을 만들고 있어요... 🏋️`);

    try {
      // 요청된 일수가 있으면 프로필에 반영
      const profileForPlan = requestedDays
        ? { ...userProfile, frequency: `주 ${requestedDays}회` }
        : userProfile;

      const plan = await generateWorkoutPlan(profileForPlan);
      setWorkoutPlan(plan);

      // 프로필 업데이트 (요청된 일수가 있으면)
      if (requestedDays) {
        const updatedProfile = { ...userProfile, frequency: `주 ${requestedDays}회` };
        setUserProfile(updatedProfile);
        await saveProfile({ user_id: user.id, ...updatedProfile });
      }

      // Supabase에 새 플랜 저장
      await saveWorkoutPlan(user.id, plan);

      setIsTyping(false);
      const splitName = plan.split_name_ko || plan.split;
      setActiveTab("plan");
      return `${splitName}이 완성되었습니다! 💪\n\n'운동 계획' 탭에서 확인하세요!`;
    } catch (error) {
      setIsTyping(false);
      return "루틴 생성 중 문제가 발생했어요. 다시 시도해 주세요! 💙";
    }
  }

  function getTodayWorkout() {
    if (!workoutPlan) return "아직 운동 루틴이 없어요!";
    const dayOfWeek = new Date().getDay();
    const todayPlan = workoutPlan.days[dayOfWeek % workoutPlan.days.length];
    setTodaySession({ ...todayPlan, date: todayKey(), completed: todayPlan.exercises.map(() => false), notes: "" });
    setActiveTab("today");
    // 새 스키마 vs 레거시 스키마 호환
    const isNewSchema = todayPlan.title_ko !== undefined;
    const dayName = isNewSchema ? todayPlan.title_ko : todayPlan.name;
    const dayFocus = isNewSchema ? todayPlan.focus_ko : todayPlan.focus;
    const dayDuration = isNewSchema ? todayPlan.estimated_minutes : todayPlan.duration;
    return `오늘은 **${dayName}** 날이에요! 💪\n📌 ${dayFocus}\n⏱️ ${dayDuration}분\n\n'오늘 운동' 탭에서 확인하세요!`;
  }

  // ─── 오늘 운동 세션 ────────────────────────────────────────────────────────
  async function toggleExercise(index) {
    if (!todaySession) return;
    const updated = { ...todaySession, completed: todaySession.completed.map((c, i) => i === index ? !c : c) };
    setTodaySession(updated);
    const key = todayKey();
    setSessions(prev => ({ ...prev, [key]: updated }));
    // Supabase에 저장
    await saveWorkoutSession(user.id, key, updated);
  }

  async function handleSaveNotes(notes) {
    if (!todaySession) return;
    const updated = { ...todaySession, notes };
    setTodaySession(updated);
    const key = todayKey();
    setSessions(prev => ({ ...prev, [key]: updated }));
    await saveWorkoutSession(user.id, key, updated);
  }

  // ─── UI ───────────────────────────────────────────────────────────────────────
  if (screen === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💪</div>
          <div style={{ color: "#7c5cfc", fontSize: 16 }}>불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (screen === "login") {
    return <LoginScreen loginForm={loginForm} setLoginForm={setLoginForm} isSignup={isSignup} setIsSignup={setIsSignup} onAuth={handleAuth} authError={authError} authLoading={authLoading} />;
  }

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "";

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", minHeight: "100vh", background: "#0a0a0f", color: "#f0f0f5" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Space+Grotesk:wght@700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .tab-btn { background: none; border: none; padding: 6px 4px; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; font-size: 10px; font-weight: 500; color: #555; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; }
        .tab-btn.active { color: #7c5cfc; }
        .tab-btn:hover { color: #aaa; }
        .tab-icon { font-size: 20px; line-height: 1; }
        .tab-btn.active .tab-icon { filter: drop-shadow(0 0 6px rgba(124,92,252,0.8)); }
        .send-btn { background: linear-gradient(135deg, #7c5cfc, #5c8afc); border: none; border-radius: 12px; padding: 10px 20px; color: white; cursor: pointer; font-weight: 700; font-size: 14px; transition: all 0.2s; }
        .send-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .opt-btn { background: rgba(124,92,252,0.12); border: 1px solid rgba(124,92,252,0.3); border-radius: 20px; padding: 8px 16px; color: #b4a0ff; cursor: pointer; font-size: 13px; font-family: 'Noto Sans KR', sans-serif; transition: all 0.2s; }
        .opt-btn:hover { background: rgba(124,92,252,0.25); border-color: #7c5cfc; color: #fff; }
        .check-item { display: flex; align-items: center; gap: 12px; padding: 14px; background: rgba(255,255,255,0.04); border-radius: 12px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.06); }
        .check-item:hover { background: rgba(124,92,252,0.1); }
        .check-item.done { opacity: 0.5; }
        .checkbox { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #555; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; }
        .checkbox.checked { background: #7c5cfc; border-color: #7c5cfc; }
        .exercise-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px; margin-bottom: 8px; }
        .day-card { background: linear-gradient(135deg, rgba(124,92,252,0.12), rgba(92,138,252,0.08)); border: 1px solid rgba(124,92,252,0.2); border-radius: 16px; padding: 20px; margin-bottom: 16px; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .stat-box { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; text-align: center; }
        .input-field { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 12px 16px; color: #f0f0f5; font-family: 'Noto Sans KR', sans-serif; font-size: 14px; outline: none; width: 100%; transition: border-color 0.2s; }
        .input-field:focus { border-color: #7c5cfc; }
        .progress-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #7c5cfc, #5c8afc); border-radius: 3px; transition: width 0.5s ease; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        .msg-bubble { animation: slideUp 0.3s ease; }
        .typing-dot { width:7px; height:7px; border-radius:50%; background:#7c5cfc; animation: pulse 1.2s infinite; display:inline-block; margin:0 2px; }
        .typing-dot:nth-child(2){ animation-delay:0.2s } .typing-dot:nth-child(3){ animation-delay:0.4s }
      `}</style>

      {/* Header */}
      <div style={{ background: "rgba(10,10,15,0.95)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #7c5cfc, #5c8afc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💪</div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff" }}>GymAI</div>
            <div style={{ fontSize: 10, color: "#7c5cfc" }}>AI 퍼스널 트레이너</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12, color: "#888" }}>{userName}</div>
          <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", color: "#aaa", cursor: "pointer", fontSize: 12 }}>로그아웃</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 700, margin: "0 auto", paddingBottom: "72px" }}>
        {activeTab === "chat" && <ChatTab messages={messages} isTyping={isTyping} inputText={inputText} setInputText={setInputText} onSend={handleTextInput} onOption={handleOptionSelect} messagesEndRef={messagesEndRef} />}
        {activeTab === "plan" && <PlanTab plan={workoutPlan} />}
        {activeTab === "today" && <TodayTab session={todaySession} onGetWorkout={() => handleTextInput("오늘 운동 알려줘")} onToggle={toggleExercise} onSaveNotes={handleSaveNotes} plan={workoutPlan} />}
        {activeTab === "progress" && <ProgressTab sessions={sessions} />}
        {activeTab === "exercises" && <ExercisesTab exercises={EXERCISE_DB} />}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(10,10,15,0.97)", borderTop: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)", zIndex: 100, display: "flex", padding: "8px 0 8px" }}>
        {[["chat", "💬", "채팅"], ["plan", "📋", "운동 계획"], ["today", "🏋️", "오늘 운동"], ["progress", "📊", "기록"], ["exercises", "📚", "운동 목록"]].map(([key, icon, label]) => (
          <button key={key} className={`tab-btn ${activeTab === key ? "active" : ""}`} onClick={() => setActiveTab(key)}>
            <span className="tab-icon">{icon}</span>
            <span>{label}</span>
            {activeTab === key && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#7c5cfc", marginTop: 1 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ loginForm, setLoginForm, isSignup, setIsSignup, onAuth, authError, authLoading }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Noto Sans KR', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Space+Grotesk:wght@700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } .login-input { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 14px 16px; color: #f0f0f5; font-family: 'Noto Sans KR', sans-serif; font-size: 15px; outline: none; transition: border-color 0.2s; } .login-input:focus { border-color: #7c5cfc; } .login-btn { width: 100%; background: linear-gradient(135deg, #7c5cfc, #5c8afc); border: none; border-radius: 12px; padding: 14px; color: white; font-weight: 700; font-size: 16px; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; transition: all 0.2s; } .login-btn:hover { opacity: 0.9; } .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }`}</style>
      <div style={{ width: "100%", maxWidth: 400, padding: 32, margin: 16 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, #7c5cfc, #5c8afc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 16px" }}>💪</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 28, color: "#fff" }}>GymAI</div>
          <div style={{ fontSize: 14, color: "#7c5cfc", marginTop: 4 }}>AI 퍼스널 트레이너</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 24 }}>{isSignup ? "회원가입" : "로그인"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {isSignup && <input className="login-input" placeholder="이름" value={loginForm.name} onChange={e => setLoginForm(p => ({ ...p, name: e.target.value }))} />}
            <input className="login-input" placeholder="이메일" type="email" value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} onKeyDown={e => e.key === "Enter" && onAuth()} />
            <input className="login-input" placeholder="비밀번호 (6자 이상)" type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && onAuth()} />
            {authError && <div style={{ color: "#ff6b6b", fontSize: 13, textAlign: "center" }}>{authError}</div>}
            <button className="login-btn" onClick={onAuth} disabled={authLoading}>
              {authLoading ? "처리 중..." : isSignup ? "시작하기 🚀" : "로그인 💪"}
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
            <span style={{ color: "#666" }}>{isSignup ? "이미 계정이 있으신가요? " : "처음 이용하시나요? "}</span>
            <button onClick={() => setIsSignup(!isSignup)} style={{ background: "none", border: "none", color: "#7c5cfc", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>{isSignup ? "로그인" : "회원가입"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────
function ChatTab({ messages, isTyping, inputText, setInputText, onSend, onOption, messagesEndRef }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 132px)" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
        {messages.map(msg => (
          <div key={msg.id} className="msg-bubble" style={{ marginBottom: 16, display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", maxWidth: "85%" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#7c5cfc,#5c8afc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🤖</div>
                <div>
                  <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px 16px 16px 16px", padding: "12px 16px", fontSize: 14, lineHeight: 1.7, color: "#e8e8f0", whiteSpace: "pre-wrap" }}>{msg.text}</div>
                  {msg.options && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                      {msg.options.map(opt => <button key={opt} className="opt-btn" onClick={() => onOption(opt, msg.questionKey)}>{opt}</button>)}
                    </div>
                  )}
                </div>
              </div>
            )}
            {msg.role === "user" && (
              <div style={{ background: "linear-gradient(135deg,#7c5cfc,#5c8afc)", borderRadius: "16px 4px 16px 16px", padding: "10px 16px", fontSize: 14, color: "#fff", maxWidth: "75%", lineHeight: 1.6 }}>{msg.text}</div>
            )}
          </div>
        ))}
        {isTyping && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#7c5cfc,#5c8afc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px 16px 16px 16px", padding: "14px 18px" }}>
              <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding: "12px 16px", background: "rgba(10,10,15,0.95)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="input-field" placeholder="메시지를 입력하세요..." value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === "Enter" && onSend(inputText)} />
          <button className="send-btn" onClick={() => onSend(inputText)}>전송</button>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {["오늘 운동 알려줘", "전체 루틴 보여줘", "너무 어렵다", "너무 쉽다"].map(q => (
            <button key={q} onClick={() => onSend(q)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 12px", color: "#888", cursor: "pointer", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif" }}>{q}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Plan Tab ─────────────────────────────────────────────────────────────────
function PlanTab({ plan }) {
  if (!plan) return (
    <div style={{ padding: 32, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
      <div style={{ color: "#888" }}>아직 운동 계획이 없어요</div>
      <div style={{ color: "#555", fontSize: 14, marginTop: 8 }}>채팅 탭에서 온보딩을 완료해주세요!</div>
    </div>
  );

  // 새 스키마 vs 레거시 스키마 호환
  const isNewSchema = plan.plan_version === "1.0";
  const splitName = isNewSchema ? plan.split_name_ko : plan.split;
  const weeklySchedule = isNewSchema ? plan.weekly_schedule_ko : plan.weeklySchedule;

  // 레거시 스키마의 글로벌 웜업/쿨다운
  const legacyWarmup = !isNewSchema && plan.warmup?.exercises;
  const legacyCooldown = !isNewSchema && plan.cooldown?.exercises;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: "linear-gradient(135deg,rgba(124,92,252,0.2),rgba(92,138,252,0.1))", border: "1px solid rgba(124,92,252,0.3)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>🏋️ {splitName}</div>
        <div style={{ fontSize: 13, color: "#aaa", marginTop: 6 }}>{weeklySchedule}</div>
        {isNewSchema && plan.split_id && (
          <span className="badge" style={{ background: "rgba(124,92,252,0.2)", color: "#b4a0ff", marginTop: 8, display: "inline-block" }}>{plan.split_id}</span>
        )}
      </div>

      {/* 레거시: 글로벌 웜업 */}
      {legacyWarmup && (
        <div style={{ background: "rgba(255,200,0,0.06)", border: "1px solid rgba(255,200,0,0.2)", borderRadius: 14, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#ffc107", marginBottom: 8 }}>🔥 워밍업 ({plan.warmup?.duration}분)</div>
          {plan.warmup?.exercises?.map((ex, i) => <div key={i} style={{ fontSize: 13, color: "#ccc", padding: "3px 0" }}>• {ex}</div>)}
        </div>
      )}

      {plan.days?.map((day, i) => {
        // 새 스키마 vs 레거시 스키마 필드 매핑
        const dayIndex = isNewSchema ? day.day_index : day.day;
        const dayTitle = isNewSchema ? day.title_ko : day.name;
        const dayFocus = isNewSchema ? day.focus_ko : day.focus;
        const dayDuration = isNewSchema ? day.estimated_minutes : day.duration;
        const dayWarmup = isNewSchema ? day.warmup : null;
        const dayCooldown = isNewSchema ? day.cooldown : null;

        return (
          <div key={i} className="day-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Day {dayIndex} – {dayTitle}</div>
                <div style={{ fontSize: 12, color: "#7c5cfc", marginTop: 2 }}>{dayFocus}</div>
              </div>
              <span className="badge" style={{ background: "rgba(124,92,252,0.2)", color: "#b4a0ff" }}>⏱️ {dayDuration}분</span>
            </div>

            {/* 새 스키마: Day별 웜업 */}
            {dayWarmup && dayWarmup.length > 0 && (
              <div style={{ background: "rgba(255,200,0,0.04)", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#ffc107", marginBottom: 6 }}>🔥 웜업</div>
                {dayWarmup.map((w, wi) => <div key={wi} style={{ fontSize: 12, color: "#bbb", padding: "2px 0" }}>• {w}</div>)}
              </div>
            )}

            {day.exercises?.map((ex, j) => {
              // 새 스키마 vs 레거시 스키마 필드 매핑
              const exName = isNewSchema ? ex.name_ko : ex.name;
              const exMuscle = isNewSchema ? ex.muscle_ko : ex.muscle;
              const exInstructions = isNewSchema ? ex.instructions_ko : ex.instructions;
              const exEquipment = isNewSchema ? ex.equipment_ko : null;

              return (
                <div key={j} className="exercise-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{exName}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                        {exMuscle}
                        {exEquipment && <span style={{ color: "#666" }}> • {exEquipment}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{exInstructions}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#7c5cfc" }}>{ex.sets} x {ex.reps}</div>
                      <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>휴식 {ex.rest_seconds}초</div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 새 스키마: Day별 쿨다운 */}
            {dayCooldown && dayCooldown.length > 0 && (
              <div style={{ background: "rgba(0,200,200,0.04)", borderRadius: 10, padding: 12, marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#4dd", marginBottom: 6 }}>❄️ 쿨다운</div>
                {dayCooldown.map((c, ci) => <div key={ci} style={{ fontSize: 12, color: "#bbb", padding: "2px 0" }}>• {c}</div>)}
              </div>
            )}
          </div>
        );
      })}

      {/* 레거시: 글로벌 쿨다운 */}
      {legacyCooldown && (
        <div style={{ background: "rgba(0,200,200,0.06)", border: "1px solid rgba(0,200,200,0.2)", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#4dd", marginBottom: 8 }}>❄️ 쿨다운 ({plan.cooldown?.duration}분)</div>
          {plan.cooldown?.exercises?.map((ex, i) => <div key={i} style={{ fontSize: 13, color: "#ccc", padding: "3px 0" }}>• {ex}</div>)}
        </div>
      )}

      {/* 새 스키마: 노트 */}
      {isNewSchema && plan.notes_ko && plan.notes_ko.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 16, marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 8 }}>📝 주의사항</div>
          {plan.notes_ko.map((note, i) => <div key={i} style={{ fontSize: 13, color: "#aaa", padding: "3px 0" }}>• {note}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── Today Tab ────────────────────────────────────────────────────────────────
function TodayTab({ session, onGetWorkout, onToggle, onSaveNotes, plan }) {
  const [notes, setNotes] = useState(session?.notes || "");
  useEffect(() => { setNotes(session?.notes || ""); }, [session]);

  if (!session) return (
    <div style={{ padding: 32, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🏋️</div>
      <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>오늘 운동을 시작할까요?</div>
      <div style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>{today()}</div>
      {plan ? (
        <button onClick={onGetWorkout} style={{ background: "linear-gradient(135deg,#7c5cfc,#5c8afc)", border: "none", borderRadius: 14, padding: "14px 28px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif" }}>오늘 운동 시작하기 💪</button>
      ) : (
        <div style={{ color: "#555", fontSize: 14 }}>먼저 채팅에서 프로필을 완성해주세요!</div>
      )}
    </div>
  );

  // 새 스키마 vs 레거시 스키마 호환
  const isNewSchema = session.title_ko !== undefined;
  const sessionName = isNewSchema ? session.title_ko : session.name;

  const doneCount = session.completed?.filter(Boolean).length || 0;
  const total = session.exercises?.length || 0;
  const progress = total > 0 ? (doneCount / total) * 100 : 0;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: "linear-gradient(135deg,rgba(124,92,252,0.2),rgba(92,138,252,0.1))", border: "1px solid rgba(124,92,252,0.3)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>🏋️ {sessionName}</div>
        <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>{today()}</div>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#aaa", marginBottom: 6 }}>
            <span>진행률</span><span>{doneCount}/{total} 완료</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>
        {progress === 100 && <div style={{ marginTop: 12, textAlign: "center", fontSize: 20 }}>🎉 오늘 운동 완료! 수고하셨습니다!</div>}
      </div>
      {session.exercises?.map((ex, i) => {
        // 새 스키마 vs 레거시 스키마 필드 매핑
        const exName = ex.name_ko || ex.name;
        const exMuscle = ex.muscle_ko || ex.muscle;

        return (
          <div key={i} className={`check-item ${session.completed?.[i] ? "done" : ""}`} onClick={() => onToggle(i)}>
            <div className={`checkbox ${session.completed?.[i] ? "checked" : ""}`}>
              {session.completed?.[i] && <span style={{ color: "white", fontSize: 12 }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: session.completed?.[i] ? "#666" : "#fff", textDecoration: session.completed?.[i] ? "line-through" : "none" }}>{exName}</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{ex.sets}세트 × {ex.reps} • 휴식 {ex.rest_seconds}초</div>
            </div>
            <span className="badge" style={{ background: "rgba(124,92,252,0.15)", color: "#b4a0ff" }}>{exMuscle}</span>
          </div>
        );
      })}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 8 }}>📝 오늘 메모</div>
        <textarea className="input-field" placeholder="운동 후기, 느낀 점을 적어보세요..." value={notes} onChange={e => setNotes(e.target.value)} onBlur={() => onSaveNotes(notes)} style={{ height: 100, resize: "none", lineHeight: 1.6 }} />
      </div>
    </div>
  );
}

// ─── Progress Tab ─────────────────────────────────────────────────────────────
function ProgressTab({ sessions }) {
  const sessionKeys = Object.keys(sessions).sort().reverse();
  const totalWorkouts = sessionKeys.length;
  const totalDone = sessionKeys.reduce((sum, k) => sum + (sessions[k].completed?.filter(Boolean).length || 0), 0);
  const totalEx = sessionKeys.reduce((sum, k) => sum + (sessions[k].exercises?.length || 0), 0);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 16 }}>📊 진행 상황</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[[totalWorkouts, "🏋️", "운동 세션"], [totalDone, "✅", "완료 운동"], [totalEx > 0 ? `${Math.round((totalDone/totalEx)*100)}%` : "0%", "📈", "완료율"]].map(([val, icon, label], i) => (
          <div key={i} className="stat-box">
            <div style={{ fontSize: 22 }}>{icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#7c5cfc", marginTop: 4 }}>{val}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>
      {sessionKeys.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
          <div style={{ color: "#888" }}>아직 운동 기록이 없어요</div>
        </div>
      ) : sessionKeys.map(key => {
        const s = sessions[key];
        const done = s.completed?.filter(Boolean).length || 0;
        const total = s.exercises?.length || 0;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        return (
          <div key={key} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 16, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{s.name || "운동"}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{key}</div>
              </div>
              <span className="badge" style={{ background: pct === 100 ? "rgba(0,200,100,0.15)" : "rgba(124,92,252,0.15)", color: pct === 100 ? "#4d9" : "#b4a0ff" }}>{pct}%</span>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>{done}/{total} 운동 완료</div>
            {s.notes && <div style={{ fontSize: 12, color: "#888", marginTop: 8, fontStyle: "italic" }}>"{s.notes}"</div>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Exercises Tab ────────────────────────────────────────────────────────────
function ExercisesTab({ exercises }) {
  const [filter, setFilter] = useState("전체");
  const muscles = ["전체", ...new Set(exercises.map(e => e.muscle))];
  const filtered = filter === "전체" ? exercises : exercises.filter(e => e.muscle === filter);
  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 16 }}>📚 운동 목록</div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
        {muscles.map(m => (
          <button key={m} onClick={() => setFilter(m)} style={{ background: filter === m ? "linear-gradient(135deg,#7c5cfc,#5c8afc)" : "rgba(255,255,255,0.06)", border: "1px solid " + (filter === m ? "#7c5cfc" : "rgba(255,255,255,0.1)"), borderRadius: 20, padding: "6px 14px", color: filter === m ? "#fff" : "#aaa", cursor: "pointer", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", whiteSpace: "nowrap" }}>{m}</button>
        ))}
      </div>
      {filtered.map(ex => (
        <div key={ex.id} className="exercise-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{ex.name}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <span className="badge" style={{ background: "rgba(124,92,252,0.15)", color: "#b4a0ff" }}>{ex.muscle}</span>
              <span className="badge" style={{ background: "rgba(0,200,100,0.1)", color: "#4d9" }}>{ex.equipment}</span>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#999", lineHeight: 1.6 }}>{ex.instructions}</div>
        </div>
      ))}
    </div>
  );
}
