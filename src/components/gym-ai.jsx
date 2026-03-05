import { useState, useEffect, useRef, useCallback } from "react";

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

// ─── Onboarding Questions ─────────────────────────────────────────────────────
const ONBOARDING_QUESTIONS = [
  { key: "gender", text: "안녕하세요! 저는 당신의 AI 퍼스널 트레이너예요 💪\n\n먼저 성별을 알려주세요.", options: ["남성", "여성", "기타"] },
  { key: "age", text: "나이가 어떻게 되시나요?", options: ["10대", "20대", "30대", "40대", "50대 이상"] },
  { key: "height_weight", text: "키와 몸무게를 알려주세요.\n(예: 175cm, 70kg)", options: null },
  { key: "goal", text: "운동 목표가 무엇인가요?", options: ["체지방 감소", "근육 증가", "전반적인 건강", "체력 향상"] },
  { key: "experience", text: "헬스 경험이 어느 정도 되시나요?", options: ["완전 초보 (처음)", "초보 (3개월 미만)", "초급 (3~6개월)"] },
  { key: "frequency", text: "일주일에 몇 번 운동하고 싶으신가요?", options: ["주 2회", "주 3회", "주 4회", "주 5회"] },
  { key: "injuries", text: "부상이나 신체적 제한 사항이 있으신가요?", options: ["없음", "무릎 통증", "허리 통증", "어깨 통증", "기타"] },
  { key: "equipment", text: "사용 가능한 기구를 알려주세요.", options: ["풀장비 헬스장", "덤벨만", "머신 위주", "맨몸 운동만"] },
];

// ─── AI API Call ──────────────────────────────────────────────────────────────
async function callAI(messages, systemPrompt) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system: systemPrompt }),
  });
  const data = await response.json();
  const text = data.content?.find(b => b.type === "text")?.text || "";
  return text;
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function generateId() { return Math.random().toString(36).slice(2, 9); }
function today() { return new Date().toLocaleDateString("ko-KR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }); }
function todayKey() { return new Date().toISOString().slice(0, 10); }

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function GymAI() {
  // Auth state
  const [screen, setScreen] = useState("login"); // login | app
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "", name: "" });
  const [isSignup, setIsSignup] = useState(false);

  // App state
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userProfile, setUserProfile] = useState({});
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [sessions, setSessions] = useState({}); // { dateKey: { exercises: [{...done}], notes } }
  const [todaySession, setTodaySession] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load from storage
  useEffect(() => {
    const saved = localStorage.getItem("gymaiUser");
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      setScreen("app");
      const profile = JSON.parse(localStorage.getItem(`profile_${u.email}`) || "{}");
      const plan = JSON.parse(localStorage.getItem(`plan_${u.email}`) || "null");
      const savedSessions = JSON.parse(localStorage.getItem(`sessions_${u.email}`) || "{}");
      setUserProfile(profile);
      if (plan) { setWorkoutPlan(plan); setOnboardingDone(true); }
      setSessions(savedSessions);
      if (Object.keys(profile).length === 0) {
        startOnboarding();
      } else if (plan) {
        setMessages([{ id: generateId(), role: "assistant", text: `다시 오셨군요, ${u.name}님! 💪\n\n오늘도 운동 계획을 도와드릴게요. "오늘 운동 알려줘", "루틴 보여줘" 또는 "진행 상황"을 물어보세요!` }]);
      }
    }
  }, []);

  function startOnboarding() {
    const q = ONBOARDING_QUESTIONS[0];
    setMessages([{ id: generateId(), role: "assistant", text: q.text, options: q.options, questionKey: q.key }]);
  }

  function saveToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // ─── Login / Signup ──────────────────────────────────────────────────────────
  function handleAuth() {
    if (!loginForm.email || !loginForm.password) return;
    const u = { email: loginForm.email, name: loginForm.name || loginForm.email.split("@")[0], id: generateId() };
    localStorage.setItem("gymaiUser", JSON.stringify(u));
    setUser(u);
    setScreen("app");
    const profile = JSON.parse(localStorage.getItem(`profile_${u.email}`) || "{}");
    const plan = JSON.parse(localStorage.getItem(`plan_${u.email}`) || "null");
    const savedSessions = JSON.parse(localStorage.getItem(`sessions_${u.email}`) || "{}");
    setUserProfile(profile);
    if (plan) { setWorkoutPlan(plan); setOnboardingDone(true); setMessages([{ id: generateId(), role: "assistant", text: `다시 오셨군요, ${u.name}님! 💪\n"오늘 운동 알려줘" 또는 "루틴 보여줘"를 입력해보세요!` }]); }
    else { startOnboarding(); }
    setSessions(savedSessions);
  }

  function handleLogout() {
    localStorage.removeItem("gymaiUser");
    setUser(null); setScreen("login"); setMessages([]); setWorkoutPlan(null);
    setUserProfile({}); setOnboardingDone(false); setOnboardingStep(0);
  }

  // ─── Onboarding Flow ──────────────────────────────────────────────────────────
  async function handleOptionSelect(option, questionKey) {
    addMessage("user", option);
    const newProfile = { ...userProfile, [questionKey]: option };
    setUserProfile(newProfile);

    const nextStep = onboardingStep + 1;
    if (nextStep < ONBOARDING_QUESTIONS.length) {
      setOnboardingStep(nextStep);
      const q = ONBOARDING_QUESTIONS[nextStep];
      setTimeout(() => {
        addMessage("assistant", q.text, q.options, q.key);
      }, 600);
    } else {
      // Generate workout plan
      saveToStorage(`profile_${user.email}`, newProfile);
      setIsTyping(true);
      setTimeout(async () => {
        addMessage("assistant", "완벽해요! 🎉 지금 맞춤형 운동 루틴을 만들고 있어요...", null, null, true);
        const plan = await generateWorkoutPlan(newProfile);
        setWorkoutPlan(plan);
        saveToStorage(`plan_${user.email}`, plan);
        setOnboardingDone(true);
        setIsTyping(false);
        addMessage("assistant", `${user.name}님을 위한 ${plan.split}이 완성되었습니다! 💪\n\n상단의 '운동 계획' 탭에서 전체 루틴을 확인하거나, "오늘 운동 알려줘"라고 말씀해 보세요!`);
      }, 1000);
    }
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
        const nextQ = ONBOARDING_QUESTIONS[nextStep];
        setIsTyping(false);
        addMessage("assistant", nextQ.text, nextQ.options, nextQ.key);
      } else {
        saveToStorage(`profile_${user.email}`, newProfile);
        addMessage("assistant", "맞춤형 운동 루틴을 만들고 있어요... ⏳");
        const plan = await generateWorkoutPlan(newProfile);
        setWorkoutPlan(plan);
        saveToStorage(`plan_${user.email}`, plan);
        setOnboardingDone(true);
        setIsTyping(false);
        addMessage("assistant", `루틴 완성! 🎊 '운동 계획' 탭에서 확인하거나 "오늘 운동 알려줘"라고 해보세요!`);
      }
      return;
    }

    // Chat mode
    const reply = await handleChatMessage(text);
    setIsTyping(false);
    addMessage("assistant", reply);
  }

  function addMessage(role, text, options = null, questionKey = null, loading = false) {
    setMessages(prev => [...prev, { id: generateId(), role, text, options, questionKey, loading }]);
  }

  // ─── AI Integration ───────────────────────────────────────────────────────────
  async function generateWorkoutPlan(profile) {
    const freq = profile.frequency || "주 3회";
    const days = parseInt(freq.replace(/[^0-9]/g, "")) || 3;
    const goal = profile.goal || "전반적인 건강";
    const equipment = profile.equipment || "풀장비 헬스장";
    const injuries = profile.injuries || "없음";

    const systemPrompt = `당신은 한국어로 대화하는 전문 퍼스널 트레이너입니다. 초보자를 위한 안전하고 효과적인 운동 루틴을 JSON 형식으로 생성합니다. 
반드시 유효한 JSON만 반환하고, 다른 텍스트는 포함하지 마세요.`;

    const prompt = `다음 조건에 맞는 ${days}일 운동 루틴을 JSON으로 생성해주세요:
- 목표: ${goal}
- 주 빈도: ${days}일
- 기구: ${equipment}  
- 부상: ${injuries}
- 경험: 초보자

다음 JSON 구조를 정확히 따르세요:
{
  "split": "${days}일 분할 루틴",
  "weeklySchedule": "요일 일정 설명",
  "warmup": {"duration": 10, "exercises": ["스트레칭 1", "스트레칭 2"]},
  "cooldown": {"duration": 5, "exercises": ["쿨다운 1"]},
  "days": [
    {
      "day": 1,
      "name": "상체",
      "focus": "가슴, 등, 어깨",
      "duration": 50,
      "exercises": [
        {"name": "벤치 프레스", "sets": 3, "reps": "10", "rest_seconds": 90, "instructions": "천천히 내리고 밀어올리세요", "muscle": "가슴"}
      ]
    }
  ]
}`;

    try {
      const text = await callAI([{ role: "user", content: prompt }], systemPrompt);
      const clean = text.replace(/```json|```/g, "").trim();
      return JSON.parse(clean);
    } catch (e) {
      // Fallback plan
      return buildFallbackPlan(days, goal);
    }
  }

  function buildFallbackPlan(days, goal) {
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
          { name: "인클라인 덤벨 프레스", sets: 3, reps: "12", rest_seconds: 90, instructions: "인클라인에서 덤벨을 밀어올리세요", muscle: "가슴 상부" },
          { name: "숄더 프레스", sets: 3, reps: "10", rest_seconds: 90, instructions: "귀 옆에서 위로 밀어올리세요", muscle: "어깨" },
          { name: "트라이셉스 푸시다운", sets: 3, reps: "12", rest_seconds: 60, instructions: "팔꿈치 고정 후 아래로 누르세요", muscle: "삼두" },
        ]},
        { day: 2, name: "하체", focus: "대퇴사두, 햄스트링, 엉덩이", duration: 50, exercises: [
          { name: "레그 프레스", sets: 4, reps: "12", rest_seconds: 90, instructions: "발판을 밀어내듯 펴세요", muscle: "하체" },
          { name: "레그 컬", sets: 3, reps: "12", rest_seconds: 90, instructions: "발꿈치로 허벅지 뒤를 말아올리세요", muscle: "햄스트링" },
          { name: "레그 익스텐션", sets: 3, reps: "12", rest_seconds: 90, instructions: "다리를 위로 뻗어주세요", muscle: "대퇴사두" },
          { name: "힙 어브덕션", sets: 3, reps: "15", rest_seconds: 60, instructions: "다리를 양옆으로 벌려주세요", muscle: "엉덩이" },
          { name: "칼프 레이즈", sets: 3, reps: "20", rest_seconds: 60, instructions: "발끝으로 서서 종아리를 수축하세요", muscle: "종아리" },
        ]},
        { day: 3, name: "상체 (당기기)", focus: "등, 이두, 후면 어깨", duration: 50, exercises: [
          { name: "랫 풀다운", sets: 4, reps: "12", rest_seconds: 90, instructions: "날개뼈를 모으며 당기세요", muscle: "등" },
          { name: "케이블 로우", sets: 3, reps: "12", rest_seconds: 90, instructions: "배꼽 방향으로 당기세요", muscle: "등 중부" },
          { name: "덤벨 로우", sets: 3, reps: "10", rest_seconds: 90, instructions: "옆구리 방향으로 당기세요", muscle: "등" },
          { name: "덤벨 컬", sets: 3, reps: "12", rest_seconds: 60, instructions: "팔꿈치 고정 후 말아올리세요", muscle: "이두" },
          { name: "페이스 풀", sets: 3, reps: "15", rest_seconds: 60, instructions: "얼굴 방향으로 당기며 팔꿈치를 벌리세요", muscle: "후면 어깨" },
        ]},
      ],
      4: [
        { day: 1, name: "가슴 & 삼두", focus: "가슴, 삼두", duration: 50, exercises: [
          { name: "벤치 프레스", sets: 4, reps: "10", rest_seconds: 90, instructions: "가슴으로 내리고 밀어올리세요", muscle: "가슴" },
          { name: "인클라인 덤벨 프레스", sets: 3, reps: "12", rest_seconds: 90, instructions: "인클라인에서 덤벨을 밀어올리세요", muscle: "가슴 상부" },
          { name: "트라이셉스 푸시다운", sets: 3, reps: "12", rest_seconds: 60, instructions: "팔꿈치 고정 후 아래로 누르세요", muscle: "삼두" },
        ]},
        { day: 2, name: "등 & 이두", focus: "등, 이두", duration: 50, exercises: [
          { name: "랫 풀다운", sets: 4, reps: "12", rest_seconds: 90, instructions: "날개뼈를 모으며 당기세요", muscle: "등" },
          { name: "케이블 로우", sets: 3, reps: "12", rest_seconds: 90, instructions: "배꼽 방향으로 당기세요", muscle: "등 중부" },
          { name: "덤벨 컬", sets: 3, reps: "12", rest_seconds: 60, instructions: "팔꿈치 고정 후 말아올리세요", muscle: "이두" },
        ]},
        { day: 3, name: "하체", focus: "전체 하체", duration: 55, exercises: [
          { name: "레그 프레스", sets: 4, reps: "12", rest_seconds: 90, instructions: "발판을 밀어내듯 펴세요", muscle: "하체" },
          { name: "레그 컬", sets: 3, reps: "12", rest_seconds: 90, instructions: "발꿈치로 말아올리세요", muscle: "햄스트링" },
          { name: "레그 익스텐션", sets: 3, reps: "12", rest_seconds: 90, instructions: "다리를 위로 뻗어주세요", muscle: "대퇴사두" },
          { name: "칼프 레이즈", sets: 4, reps: "20", rest_seconds: 60, instructions: "종아리를 최대로 수축하세요", muscle: "종아리" },
        ]},
        { day: 4, name: "어깨 & 복근", focus: "어깨, 복근", duration: 45, exercises: [
          { name: "숄더 프레스", sets: 4, reps: "10", rest_seconds: 90, instructions: "귀 옆에서 위로 밀어올리세요", muscle: "어깨" },
          { name: "사이드 레터럴 레이즈", sets: 3, reps: "15", rest_seconds: 60, instructions: "팔을 옆으로 어깨 높이까지 올리세요", muscle: "측면 어깨" },
          { name: "케이블 크런치", sets: 3, reps: "15", rest_seconds: 60, instructions: "복근을 수축하며 내려가세요", muscle: "복근" },
          { name: "플랭크", sets: 3, reps: "30초", rest_seconds: 60, instructions: "몸을 일자로 유지하세요", muscle: "코어" },
        ]},
      ],
    };
    const dayCount = Math.min(Math.max(days, 2), 4);
    const selectedDays = plans[dayCount] || plans[3];
    return {
      split: `${dayCount}일 분할 루틴`,
      weeklySchedule: `주 ${dayCount}회 운동. 운동일 사이에 충분한 휴식을 취하세요.`,
      warmup: { duration: 10, exercises: ["5분 가벼운 유산소 (트레드밀)", "동적 스트레칭 (팔 돌리기, 다리 스윙)", "목표 근육 가볍게 스트레칭"] },
      cooldown: { duration: 5, exercises: ["5분 정적 스트레칭", "가슴, 등, 하체 스트레칭", "심호흡 및 이완"] },
      days: selectedDays,
    };
  }

  async function handleChatMessage(text) {
    const lower = text.toLowerCase();
    
    if (lower.includes("오늘") && (lower.includes("운동") || lower.includes("뭐") || lower.includes("해야"))) {
      return getTodayWorkout();
    }
    if (lower.includes("너무 어렵") || lower.includes("힘들어") || lower.includes("못하겠")) {
      return await adaptWorkout("easier");
    }
    if (lower.includes("너무 쉽") || lower.includes("더 강하게") || lower.includes("강도 높여")) {
      return await adaptWorkout("harder");
    }
    if (lower.includes("기구 없") || lower.includes("집에서") || lower.includes("맨몸")) {
      return await adaptWorkout("no_equipment");
    }
    if (lower.includes("루틴") || lower.includes("계획") || lower.includes("전체")) {
      setActiveTab("plan");
      return "운동 계획 탭으로 이동했어요! 전체 주간 루틴을 확인하세요. 💪";
    }
    if (lower.includes("진행") || lower.includes("기록") || lower.includes("히스토리")) {
      setActiveTab("progress");
      return "진행 상황 탭으로 이동했어요! 지금까지의 운동 기록을 확인하세요. 📊";
    }

    // General AI response
    const systemPrompt = `당신은 한국어로 대화하는 친절한 AI 퍼스널 트레이너입니다. 초보자를 위한 운동 조언을 간결하고 격려하는 방식으로 제공합니다.`;
    const userContext = workoutPlan ? `사용자 프로필: ${JSON.stringify(userProfile)}\n현재 루틴: ${workoutPlan.split}` : "";
    try {
      const reply = await callAI([{ role: "user", content: `${userContext}\n\n사용자 질문: ${text}` }], systemPrompt);
      return reply;
    } catch {
      return "죄송해요, 잠시 문제가 발생했어요. 다시 시도해 주세요! 💙";
    }
  }

  function getTodayWorkout() {
    if (!workoutPlan) return "아직 운동 루틴이 없어요. 먼저 프로필을 완성해주세요!";
    const dayOfWeek = new Date().getDay();
    const workoutDays = workoutPlan.days;
    const todayPlan = workoutDays[dayOfWeek % workoutDays.length];
    setTodaySession({ ...todayPlan, date: todayKey(), completed: todayPlan.exercises.map(() => false), notes: "" });
    setActiveTab("today");
    return `오늘은 **${todayPlan.name}** 날이에요! 💪\n\n📌 집중 부위: ${todayPlan.focus}\n⏱️ 예상 시간: ${todayPlan.duration}분\n🔥 운동 수: ${todayPlan.exercises.length}개\n\n'오늘 운동' 탭에서 체크리스트를 확인하세요!`;
  }

  async function adaptWorkout(type) {
    const messages_map = {
      easier: "운동 강도를 낮춰드릴게요! 세트 수를 줄이고 더 가벼운 운동으로 조정합니다.",
      harder: "좋아요! 더 도전적인 루틴으로 업그레이드해드릴게요! 💪",
      no_equipment: "기구 없이도 할 수 있는 맨몸 운동으로 바꿔드릴게요!",
    };
    setActiveTab("plan");
    return `${messages_map[type]}\n\n운동 계획 탭에서 조정된 루틴을 확인하세요! (이 기능은 곧 완전히 지원될 예정이에요)`;
  }

  // ─── Today's Session ──────────────────────────────────────────────────────────
  function toggleExercise(index) {
    if (!todaySession) return;
    const updated = { ...todaySession, completed: todaySession.completed.map((c, i) => i === index ? !c : c) };
    setTodaySession(updated);
    const key = todayKey();
    const updatedSessions = { ...sessions, [key]: updated };
    setSessions(updatedSessions);
    saveToStorage(`sessions_${user.email}`, updatedSessions);
  }

  function saveSessionNotes(notes) {
    if (!todaySession) return;
    const updated = { ...todaySession, notes };
    setTodaySession(updated);
    const key = todayKey();
    setSessions(prev => { const n = { ...prev, [key]: updated }; saveToStorage(`sessions_${user.email}`, n); return n; });
  }

  // ─── UI ───────────────────────────────────────────────────────────────────────
  if (screen === "login") {
    return <LoginScreen loginForm={loginForm} setLoginForm={setLoginForm} isSignup={isSignup} setIsSignup={setIsSignup} onAuth={handleAuth} />;
  }

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
        .check-item.done { opacity: 0.5; background: rgba(124,92,252,0.06); }
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
          <div style={{ fontSize: 12, color: "#888" }}>{user?.name}</div>
          <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", color: "#aaa", cursor: "pointer", fontSize: 12 }}>로그아웃</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 700, margin: "0 auto", paddingBottom: "72px" }}>
        {activeTab === "chat" && <ChatTab messages={messages} isTyping={isTyping} inputText={inputText} setInputText={setInputText} onSend={handleTextInput} onOption={handleOptionSelect} messagesEndRef={messagesEndRef} />}
        {activeTab === "plan" && <PlanTab plan={workoutPlan} />}
        {activeTab === "today" && <TodayTab session={todaySession} onGetWorkout={() => handleTextInput("오늘 운동 알려줘")} onToggle={toggleExercise} onSaveNotes={saveSessionNotes} plan={workoutPlan} />}
        {activeTab === "progress" && <ProgressTab sessions={sessions} plan={workoutPlan} />}
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
function LoginScreen({ loginForm, setLoginForm, isSignup, setIsSignup, onAuth }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Noto Sans KR', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Space+Grotesk:wght@700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } .login-input { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 14px 16px; color: #f0f0f5; font-family: 'Noto Sans KR', sans-serif; font-size: 15px; outline: none; transition: border-color 0.2s; } .login-input:focus { border-color: #7c5cfc; } .login-btn { width: 100%; background: linear-gradient(135deg, #7c5cfc, #5c8afc); border: none; border-radius: 12px; padding: 14px; color: white; font-weight: 700; font-size: 16px; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; transition: all 0.2s; } .login-btn:hover { opacity: 0.9; transform: translateY(-1px); }`}</style>
      <div style={{ width: "100%", maxWidth: 400, padding: 32, margin: 16 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, #7c5cfc, #5c8afc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 16px" }}>💪</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 28, color: "#fff" }}>GymAI</div>
          <div style={{ fontSize: 14, color: "#7c5cfc", marginTop: 4 }}>AI 퍼스널 트레이너</div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 8 }}>헬스 초보자를 위한 맞춤형 운동 플랜</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 24 }}>{isSignup ? "회원가입" : "로그인"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {isSignup && (
              <input className="login-input" placeholder="이름" value={loginForm.name} onChange={e => setLoginForm(p => ({ ...p, name: e.target.value }))} />
            )}
            <input className="login-input" placeholder="이메일" type="email" value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} onKeyDown={e => e.key === "Enter" && onAuth()} />
            <input className="login-input" placeholder="비밀번호" type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && onAuth()} />
            <button className="login-btn" onClick={onAuth}>{isSignup ? "시작하기 🚀" : "로그인 💪"}</button>
          </div>
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
            <span style={{ color: "#666" }}>{isSignup ? "이미 계정이 있으신가요? " : "처음 이용하시나요? "}</span>
            <button onClick={() => setIsSignup(!isSignup)} style={{ background: "none", border: "none", color: "#7c5cfc", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>{isSignup ? "로그인" : "회원가입"}</button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#444" }}>데모용: 아무 이메일/비밀번호로 로그인 가능</div>
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
                  <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px 16px 16px 16px", padding: "12px 16px", fontSize: 14, lineHeight: 1.7, color: "#e8e8f0", whiteSpace: "pre-wrap" }}>
                    {msg.loading ? <span style={{ display: "flex", gap: 4, alignItems: "center" }}><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></span> : msg.text}
                  </div>
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
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px 16px 16px 16px", padding: "14px 18px", display: "flex", gap: 4 }}>
              <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding: "12px 16px", background: "rgba(10,10,15,0.95)", borderTop: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="input-field" placeholder="메시지를 입력하세요... (예: 오늘 운동 알려줘)" value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === "Enter" && onSend(inputText)} />
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
      <div style={{ color: "#888", fontSize: 16 }}>아직 운동 계획이 없어요</div>
      <div style={{ color: "#555", fontSize: 14, marginTop: 8 }}>채팅 탭에서 온보딩을 완료해주세요!</div>
    </div>
  );
  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: "linear-gradient(135deg, rgba(124,92,252,0.2), rgba(92,138,252,0.1))", border: "1px solid rgba(124,92,252,0.3)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>🏋️ {plan.split}</div>
        <div style={{ fontSize: 13, color: "#aaa", marginTop: 6 }}>{plan.weeklySchedule}</div>
      </div>

      {/* Warmup */}
      <div style={{ background: "rgba(255,200,0,0.06)", border: "1px solid rgba(255,200,0,0.2)", borderRadius: 14, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#ffc107", marginBottom: 8 }}>🔥 워밍업 ({plan.warmup?.duration}분)</div>
        {plan.warmup?.exercises?.map((ex, i) => <div key={i} style={{ fontSize: 13, color: "#ccc", padding: "3px 0" }}>• {ex}</div>)}
      </div>

      {/* Days */}
      {plan.days?.map((day, i) => (
        <div key={i} className="day-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Day {day.day} – {day.name}</div>
              <div style={{ fontSize: 12, color: "#7c5cfc", marginTop: 2 }}>{day.focus}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="badge" style={{ background: "rgba(124,92,252,0.2)", color: "#b4a0ff" }}>⏱️ {day.duration}분</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {day.exercises?.map((ex, j) => (
              <div key={j} className="exercise-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{ex.name}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{ex.muscle}</div>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{ex.instructions}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#7c5cfc" }}>{ex.sets} x {ex.reps}</div>
                    <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>휴식 {ex.rest_seconds}초</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Cooldown */}
      <div style={{ background: "rgba(0,200,200,0.06)", border: "1px solid rgba(0,200,200,0.2)", borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#4dd", marginBottom: 8 }}>❄️ 쿨다운 ({plan.cooldown?.duration}분)</div>
        {plan.cooldown?.exercises?.map((ex, i) => <div key={i} style={{ fontSize: 13, color: "#ccc", padding: "3px 0" }}>• {ex}</div>)}
      </div>
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

  const doneCount = session.completed?.filter(Boolean).length || 0;
  const total = session.exercises?.length || 0;
  const progress = total > 0 ? (doneCount / total) * 100 : 0;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: "linear-gradient(135deg,rgba(124,92,252,0.2),rgba(92,138,252,0.1))", border: "1px solid rgba(124,92,252,0.3)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>🏋️ {session.name}</div>
        <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>{today()}</div>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#aaa", marginBottom: 6 }}>
            <span>진행률</span><span>{doneCount}/{total} 완료</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>
        {progress === 100 && <div style={{ marginTop: 12, textAlign: "center", fontSize: 20 }}>🎉 오늘 운동 완료! 수고하셨습니다!</div>}
      </div>

      <div>
        {session.exercises?.map((ex, i) => (
          <div key={i} className={`check-item ${session.completed?.[i] ? "done" : ""}`} onClick={() => onToggle(i)}>
            <div className={`checkbox ${session.completed?.[i] ? "checked" : ""}`}>
              {session.completed?.[i] && <span style={{ color: "white", fontSize: 12 }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: session.completed?.[i] ? "#666" : "#fff", textDecoration: session.completed?.[i] ? "line-through" : "none" }}>{ex.name}</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{ex.sets}세트 × {ex.reps} • 휴식 {ex.rest_seconds}초</div>
            </div>
            <div className="badge" style={{ background: "rgba(124,92,252,0.15)", color: "#b4a0ff", fontSize: 11 }}>{ex.muscle}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 8 }}>📝 오늘 메모</div>
        <textarea className="input-field" placeholder="운동 후기, 느낀 점을 적어보세요..." value={notes} onChange={e => setNotes(e.target.value)} onBlur={() => onSaveNotes(notes)} style={{ height: 100, resize: "none", lineHeight: 1.6 }} />
      </div>
    </div>
  );
}

// ─── Progress Tab ─────────────────────────────────────────────────────────────
function ProgressTab({ sessions, plan }) {
  const sessionKeys = Object.keys(sessions).sort().reverse();
  const totalWorkouts = sessionKeys.length;
  const totalExercises = sessionKeys.reduce((sum, k) => sum + (sessions[k].exercises?.length || 0), 0);
  const totalDone = sessionKeys.reduce((sum, k) => sum + (sessions[k].completed?.filter(Boolean).length || 0), 0);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 16 }}>📊 진행 상황</div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[["🏋️", totalWorkouts, "운동 세션"], ["✅", totalDone, "완료 운동"], [totalExercises > 0 ? `${Math.round((totalDone / totalExercises) * 100)}%` : "0%", "", "완료율"]].map(([icon, val, label], i) => (
          <div key={i} className="stat-box">
            <div style={{ fontSize: 22 }}>{i === 2 ? icon : val}</div>
            {i !== 2 && <div style={{ fontSize: 18, fontWeight: 700, color: "#7c5cfc", marginTop: 4 }}>{icon}</div>}
            <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {sessionKeys.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
          <div style={{ color: "#888" }}>아직 운동 기록이 없어요</div>
          <div style={{ color: "#555", fontSize: 13, marginTop: 6 }}>오늘 첫 번째 운동을 시작해보세요!</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 12 }}>운동 히스토리</div>
          {sessionKeys.map(key => {
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
                  <div className="badge" style={{ background: pct === 100 ? "rgba(0,200,100,0.15)" : "rgba(124,92,252,0.15)", color: pct === 100 ? "#4d9" : "#b4a0ff" }}>{pct}%</div>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>{done}/{total} 운동 완료</div>
                {s.notes && <div style={{ fontSize: 12, color: "#888", marginTop: 8, fontStyle: "italic" }}>"{s.notes}"</div>}
              </div>
            );
          })}
        </div>
      )}
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
      <div style={{ display: "grid", gap: 10 }}>
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
    </div>
  );
}
