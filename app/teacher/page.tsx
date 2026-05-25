"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  cloudSyncEnabled,
  deleteCloudPupil,
  deleteCloudPupilData,
  loadCloudClassroomData,
  saveCloudProfile,
} from "@/lib/cloudProgress";

type LearnerProfile = {
  className: string;
  studentName: string;
  storageKey: string;
  accessCode?: string;
};

type QuizResult = {
  submitted: boolean;
  score: number;
  answers: number[];
};

type ScreenshotMap = Record<number, string>;
type QuizMap = Record<number, QuizResult>;

type TeacherPupilRow = LearnerProfile & {
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  quizCompletedCount: number;
  screenshotCount: number;
  masteredCount: number;
  averageQuizPercent: number;
  status: "good" | "partial" | "not-started";
  hasAnyActivity: boolean;
  completedLessonIds: number[];
  quizMap: QuizMap;
  screenshots: ScreenshotMap;
};

type SortMode = "name" | "progress" | "mastery";
type ActivityFilter = "all" | "active" | "not-started";

const CLASS_OPTIONS = ["Year 8A", "Year 8B"];

const LESSON_TITLES = [
  "Sequencing and Precision",
  "Variables and Program Flow",
  "Selection with If Statements",
  "Operators and Complex Conditions",
  "Iteration and Count-Controlled Loops",
  "Combining Constructs for Problem Solving",
  "Assessment Project: Structured Scratch Build",
  "Decomposition and Subroutines",
  "Condition-Controlled Iteration",
  "Evaluating Different Loop Types",
  "Lists and Data Structures",
  "Final Project: Translate Quiz",
];

const REGISTRY_KEY = "year8-pupil-registry";
const CURRENT_PROFILE_KEY = "year8-current-profile";
const TEACHER_UNLOCKED_KEY = "year8-teacher-unlocked";
const TEACHER_PASSWORD = "APSR2026";
const DEFAULT_ACCESS_CODE = "123456";
const TOTAL_LESSONS = 12;
const QUIZ_QUESTIONS_PER_LESSON = 10;

const pastel = {
  page: "#f8fafc",
  text: "#334155",
  title: "#1e293b",
  panel: "#ffffff",
  panelSoft: "#fdf2f8",
  panelBlue: "#eff6ff",
  panelMint: "#ecfeff",
  panelLilac: "#f5f3ff",
  panelPeach: "#fff7ed",
  panelSky: "#f0f9ff",
  border: "#dbe4f0",
  accent: "#7c3aed",
  accentSoft: "#ede9fe",
  navy: "#334155",
  green: "#10b981",
  greenSoft: "#d1fae5",
  amber: "#f59e0b",
  amberSoft: "#fef3c7",
  rose: "#f43f5e",
  roseSoft: "#fff1f2",
  roseBorder: "#fecdd3",
  blueSoft: "#dbeafe",
  shadow: "0 10px 30px rgba(148, 163, 184, 0.14)",
};

function getRegistry(): LearnerProfile[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(REGISTRY_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as LearnerProfile[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRegistry(registry: LearnerProfile[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
}

function removeProfileFromRegistry(profile: LearnerProfile) {
  const existing = getRegistry();
  const filtered = existing.filter(
    (item) => item.storageKey !== profile.storageKey
  );
  saveRegistry(filtered);
}

function withDefaultAccessCode(profile: LearnerProfile): LearnerProfile {
  return {
    ...profile,
    accessCode: profile.accessCode?.trim() || DEFAULT_ACCESS_CODE,
  };
}

function safeParseArray(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value) => Number.isInteger(value))
      : [];
  } catch {
    return [];
  }
}

function safeParseQuizMap(raw: string | null): QuizMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function safeParseScreenshotMap(raw: string | null): ScreenshotMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getProfileStorage(profile: LearnerProfile) {
  const progressRaw =
    typeof window !== "undefined"
      ? localStorage.getItem(`${profile.storageKey}-progress`)
      : null;
  const quizRaw =
    typeof window !== "undefined"
      ? localStorage.getItem(`${profile.storageKey}-quiz-results`)
      : null;
  const screenshotsRaw =
    typeof window !== "undefined"
      ? localStorage.getItem(`${profile.storageKey}-screenshots`)
      : null;

  const completedLessonIds = safeParseArray(progressRaw).sort((a, b) => a - b);
  const quizMap = safeParseQuizMap(quizRaw);
  const screenshots = safeParseScreenshotMap(screenshotsRaw);

  return {
    completedLessonIds,
    quizMap,
    screenshots,
  };
}

function buildTeacherRow(profile: LearnerProfile): TeacherPupilRow {
  const { completedLessonIds, quizMap, screenshots } = getProfileStorage(profile);

  const completedLessons = completedLessonIds.length;
  const submittedQuizzes = Object.values(quizMap).filter((item) => item?.submitted);
  const quizCompletedCount = submittedQuizzes.length;
  const screenshotCount = Object.keys(screenshots).length;
  const progressPercent = Math.round((completedLessons / TOTAL_LESSONS) * 100);

  const masteredCount = submittedQuizzes.filter(
    (item) => item.score / QUIZ_QUESTIONS_PER_LESSON >= 0.8
  ).length;

  const averageQuizPercent =
    quizCompletedCount === 0
      ? 0
      : Math.round(
          submittedQuizzes.reduce(
            (sum, item) => sum + (item.score / QUIZ_QUESTIONS_PER_LESSON) * 100,
            0
          ) / quizCompletedCount
        );

  const hasAnyActivity =
    completedLessons > 0 || quizCompletedCount > 0 || screenshotCount > 0;

  let status: TeacherPupilRow["status"] = "not-started";
  if (progressPercent >= 70 || masteredCount >= 6) status = "good";
  else if (progressPercent > 0 || hasAnyActivity) status = "partial";

  return {
    ...profile,
    completedLessons,
    totalLessons: TOTAL_LESSONS,
    progressPercent,
    quizCompletedCount,
    screenshotCount,
    masteredCount,
    averageQuizPercent,
    status,
    hasAnyActivity,
    completedLessonIds,
    quizMap,
    screenshots,
  };
}

function saveProfileStorage(
  profile: LearnerProfile,
  data: {
    completedLessonIds: number[];
    quizMap: QuizMap;
    screenshots: ScreenshotMap;
  }
) {
  localStorage.setItem(
    `${profile.storageKey}-progress`,
    JSON.stringify(data.completedLessonIds)
  );
  localStorage.setItem(
    `${profile.storageKey}-quiz-results`,
    JSON.stringify(data.quizMap)
  );
  localStorage.setItem(
    `${profile.storageKey}-screenshots`,
    JSON.stringify(data.screenshots)
  );
}

function statusConfig(status: TeacherPupilRow["status"]) {
  if (status === "good") {
    return {
      label: "Good progress",
      emoji: "🟢",
      text: "#065f46",
      bg: "#ecfdf5",
      border: "#a7f3d0",
      progressBar: "linear-gradient(90deg, #10b981 0%, #34d399 100%)",
      ring: "#10b981",
      cardBorder: "#bbf7d0",
      cardGlow: "0 10px 30px rgba(16, 185, 129, 0.08)",
    };
  }

  if (status === "partial") {
    return {
      label: "Partial",
      emoji: "🟡",
      text: "#92400e",
      bg: "#fffbeb",
      border: "#fcd34d",
      progressBar: "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)",
      ring: "#f59e0b",
      cardBorder: "#fde68a",
      cardGlow: "0 10px 30px rgba(245, 158, 11, 0.08)",
    };
  }

  return {
    label: "Not started",
    emoji: "🔴",
    text: "#b91c1c",
    bg: "#fef2f2",
    border: "#fca5a5",
    progressBar: "linear-gradient(90deg, #f43f5e 0%, #fb7185 100%)",
    ring: "#f43f5e",
    cardBorder: "#fecdd3",
    cardGlow: "0 10px 30px rgba(244, 63, 94, 0.1)",
  };
}

function getQuizBadge(score: number) {
  const percent = Math.round((score / QUIZ_QUESTIONS_PER_LESSON) * 100);

  if (percent >= 80) {
    return {
      label: `Mastered • ${score}/${QUIZ_QUESTIONS_PER_LESSON}`,
      bg: "#dcfce7",
      border: "#86efac",
      text: "#166534",
    };
  }

  if (percent >= 60) {
    return {
      label: `Secure • ${score}/${QUIZ_QUESTIONS_PER_LESSON}`,
      bg: "#fef3c7",
      border: "#fcd34d",
      text: "#92400e",
    };
  }

  return {
    label: `Review • ${score}/${QUIZ_QUESTIONS_PER_LESSON}`,
    bg: "#fee2e2",
    border: "#fca5a5",
    text: "#b91c1c",
  };
}

function ProgressRing({
  value,
  colour,
}: {
  value: number;
  colour: string;
}) {
  const size = 84;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (value / 100) * circumference;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colour}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          fontWeight: 900,
          fontSize: 18,
          color: pastel.title,
        }}
      >
        {value}%
      </div>
    </div>
  );
}

export default function TeacherDashboardPage() {
  const router = useRouter();

  const [registry, setRegistry] = useState<LearnerProfile[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>(CLASS_OPTIONS[0]);
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [currentProfileKey, setCurrentProfileKey] = useState<string>("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [cloudStatus, setCloudStatus] = useState("");

  useEffect(() => {
    const savedUnlock =
      typeof window !== "undefined"
        ? sessionStorage.getItem(TEACHER_UNLOCKED_KEY)
        : null;

    setIsUnlocked(savedUnlock === "true");

    const loadedRegistry = getRegistry().map(withDefaultAccessCode);
    saveRegistry(loadedRegistry);
    setRegistry(loadedRegistry);

    const savedCurrentProfile = localStorage.getItem(CURRENT_PROFILE_KEY);
    if (savedCurrentProfile) {
      try {
        const parsed = withDefaultAccessCode(
          JSON.parse(savedCurrentProfile) as LearnerProfile
        );
        localStorage.setItem(CURRENT_PROFILE_KEY, JSON.stringify(parsed));
        setCurrentProfileKey(parsed.storageKey);

        if (parsed.className && CLASS_OPTIONS.includes(parsed.className)) {
          setSelectedClass(parsed.className);
        }
      } catch {
        localStorage.removeItem(CURRENT_PROFILE_KEY);
      }
    }
  }, []);

  const refreshCloudResults = async () => {
    setCloudStatus("Loading cloud results...");

    try {
      if (!cloudSyncEnabled()) {
        setCloudStatus(
          "Cloud sync is not configured for this deployment. Check the Vercel Supabase environment variables."
        );
        return;
      }

      const cloudRows = await loadCloudClassroomData();

      if (cloudRows.length === 0) {
        setCloudStatus("No cloud results found yet.");
        return;
      }

      const existing = getRegistry();
      const merged = new Map<string, LearnerProfile>();
      existing.forEach((profile) => merged.set(profile.storageKey, profile));

      cloudRows.forEach(({ profile, data }) => {
        const profileWithCode = withDefaultAccessCode(profile);
        merged.set(profileWithCode.storageKey, profileWithCode);
        saveProfileStorage(profileWithCode, data);
      });

      const nextRegistry = Array.from(merged.values()).sort((a, b) => {
        const classCompare = a.className.localeCompare(b.className);
        if (classCompare !== 0) return classCompare;
        return a.studentName.localeCompare(b.studentName);
      });

      saveRegistry(nextRegistry);
      setRegistry(nextRegistry);

      const selectedClassHasRows = cloudRows.some(
        ({ profile }) => profile.className === selectedClass
      );
      if (!selectedClassHasRows) {
        const firstCloudClass = cloudRows.find(({ profile }) =>
          CLASS_OPTIONS.includes(profile.className)
        )?.profile.className;
        if (firstCloudClass) setSelectedClass(firstCloudClass);
      }

      setCloudStatus(`Loaded ${cloudRows.length} cloud pupil result(s).`);
    } catch (error) {
      console.warn("Could not load Supabase classroom data.", error);
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error && "message" in error
            ? String((error as { message?: unknown }).message)
            : "Unknown Supabase error";
      setCloudStatus(
        `Cloud results are not available: ${message}`
      );
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      refreshCloudResults();
    }
  }, [isUnlocked]);

  const teacherRows = useMemo(() => {
    return registry.map(buildTeacherRow);
  }, [registry]);

  const selectedClassRows = useMemo(() => {
    return teacherRows.filter((row) => row.className === selectedClass);
  }, [teacherRows, selectedClass]);

  const classRows = useMemo(() => {
    const filtered = selectedClassRows.filter((row) => {
      if (activityFilter === "active") return row.hasAnyActivity;
      if (activityFilter === "not-started") return row.status === "not-started";
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortMode === "progress") {
        if (b.progressPercent !== a.progressPercent) {
          return b.progressPercent - a.progressPercent;
        }
        return a.studentName.localeCompare(b.studentName);
      }

      if (sortMode === "mastery") {
        if (b.masteredCount !== a.masteredCount) {
          return b.masteredCount - a.masteredCount;
        }
        if (b.averageQuizPercent !== a.averageQuizPercent) {
          return b.averageQuizPercent - a.averageQuizPercent;
        }
        return a.studentName.localeCompare(b.studentName);
      }

      return a.studentName.localeCompare(b.studentName);
    });

    return sorted;
  }, [selectedClassRows, activityFilter, sortMode]);

  const classSummary = useMemo(() => {
    const total = selectedClassRows.length;
    const active = selectedClassRows.filter((row) => row.hasAnyActivity).length;
    const notStarted = selectedClassRows.filter(
      (row) => row.status === "not-started"
    ).length;
    const atRisk = selectedClassRows.filter(
      (row) => row.status === "not-started" || row.progressPercent < 25
    ).length;
    const averageProgress =
      total === 0
        ? 0
        : Math.round(
            selectedClassRows.reduce((sum, row) => sum + row.progressPercent, 0) /
              total
          );

    const averageMastery =
      total === 0
        ? 0
        : Math.round(
            selectedClassRows.reduce((sum, row) => sum + row.masteredCount, 0) / total
          );

    return {
      total,
      active,
      notStarted,
      atRisk,
      averageProgress,
      averageMastery,
    };
  }, [selectedClassRows]);

  const highestProgressValue = useMemo(() => {
    if (classRows.length === 0) return 0;
    return Math.max(...classRows.map((row) => row.progressPercent));
  }, [classRows]);

  const downloadTeacherCsv = () => {
    const escapeCsv = (value: string | number) => {
      const text = String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };

    const headers = [
      "Class",
      "Pupil",
      "Access Code",
      "Progress %",
      "Completed Lessons",
      "Quiz Count",
      "Screenshot Count",
      ...Array.from({ length: TOTAL_LESSONS }, (_, index) => [
        `Lesson ${index + 1} Completed`,
        `Lesson ${index + 1} Quiz Score`,
        `Lesson ${index + 1} Screenshot Uploaded`,
      ]).flat(),
    ];

    const rows = teacherRows.map((row) => [
      row.className,
      row.studentName,
      row.accessCode || DEFAULT_ACCESS_CODE,
      row.progressPercent,
      row.completedLessons,
      row.quizCompletedCount,
      row.screenshotCount,
      ...Array.from({ length: TOTAL_LESSONS }, (_, index) => {
        const lessonId = index + 1;
        const quiz = row.quizMap[lessonId];
        return [
          row.completedLessonIds.includes(lessonId) ? "Yes" : "No",
          quiz?.submitted ? `${quiz.score}/10` : "",
          row.screenshots[lessonId] ? "Yes" : "No",
        ];
      }).flat(),
    ]);

    const csv = [headers, ...rows]
      .map((line) => line.map(escapeCsv).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `teacher-dashboard-results-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const resetAllAccessCodes = async () => {
    const profiles = getRegistry();
    if (profiles.length === 0) {
      alert("No registered pupils found yet. Refresh cloud results first.");
      return;
    }

    const confirmed = window.confirm(
      `Reset access codes for all ${profiles.length} registered pupil(s) to ${DEFAULT_ACCESS_CODE}?`
    );

    if (!confirmed) return;

    const updatedProfiles = profiles.map((profile) => ({
      ...profile,
      accessCode: DEFAULT_ACCESS_CODE,
    }));

    saveRegistry(updatedProfiles);
    setRegistry(updatedProfiles);

    const currentProfileRaw = localStorage.getItem(CURRENT_PROFILE_KEY);
    if (currentProfileRaw) {
      try {
        const currentProfile = JSON.parse(currentProfileRaw) as LearnerProfile;
        const updatedCurrentProfile = updatedProfiles.find(
          (profile) => profile.storageKey === currentProfile.storageKey
        );
        if (updatedCurrentProfile) {
          localStorage.setItem(
            CURRENT_PROFILE_KEY,
            JSON.stringify(updatedCurrentProfile)
          );
        }
      } catch {
        localStorage.removeItem(CURRENT_PROFILE_KEY);
      }
    }

    if (!cloudSyncEnabled()) {
      setCloudStatus(
        `Reset ${updatedProfiles.length} local access code(s) to ${DEFAULT_ACCESS_CODE}. Cloud sync is not configured.`
      );
      return;
    }

    setCloudStatus("Resetting access codes in the cloud...");

    try {
      await Promise.all(updatedProfiles.map(saveCloudProfile));
      setCloudStatus(
        `Reset ${updatedProfiles.length} access code(s) to ${DEFAULT_ACCESS_CODE}.`
      );
    } catch (error) {
      console.warn("Could not reset every access code in Supabase.", error);
      const message = error instanceof Error ? error.message : "Unknown Supabase error";
      setCloudStatus(
        `Some access codes may not have synced to the cloud: ${message}`
      );
    }
  };

  const openPupil = (profile: LearnerProfile) => {
    localStorage.setItem(CURRENT_PROFILE_KEY, JSON.stringify(profile));
    router.push("/");
  };

  const refreshRegistry = () => {
    setRegistry(getRegistry());
  };

  const deletePupil = (profile: LearnerProfile) => {
    const confirmed = window.confirm(
      `Delete saved data for ${profile.studentName} in ${profile.className}? This will remove progress, quiz scores, and screenshots from this browser.`
    );

    if (!confirmed) return;

    localStorage.removeItem(`${profile.storageKey}-progress`);
    localStorage.removeItem(`${profile.storageKey}-quiz-results`);
    localStorage.removeItem(`${profile.storageKey}-quiz-order`);
    localStorage.removeItem(`${profile.storageKey}-screenshots`);

    deleteCloudPupil(profile).catch((error) => {
      console.warn("Could not delete pupil from Supabase.", error);
    });

    removeProfileFromRegistry(profile);

    if (currentProfileKey === profile.storageKey) {
      localStorage.removeItem(CURRENT_PROFILE_KEY);
      setCurrentProfileKey("");
    }

    setExpandedRows((prev) => {
      const updated = { ...prev };
      delete updated[profile.storageKey];
      return updated;
    });

    refreshRegistry();
  };

  const resetPupil = (profile: LearnerProfile) => {
    const confirmed = window.confirm(
      `Reset all progress for this pupil?\n\n${profile.studentName} • ${profile.className}\n\nThis will clear progress, quiz results, quiz order, and screenshots, but keep the pupil profile.`
    );

    if (!confirmed) return;

    localStorage.removeItem(`${profile.storageKey}-progress`);
    localStorage.removeItem(`${profile.storageKey}-quiz-results`);
    localStorage.removeItem(`${profile.storageKey}-quiz-order`);
    localStorage.removeItem(`${profile.storageKey}-screenshots`);

    deleteCloudPupilData(profile).catch((error) => {
      console.warn("Could not reset pupil progress in Supabase.", error);
    });

    setExpandedRows((prev) => ({
      ...prev,
      [profile.storageKey]: false,
    }));

    refreshRegistry();
  };

  const toggleDetails = (storageKey: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [storageKey]: !prev[storageKey],
    }));
  };

  const unlockTeacherArea = () => {
    if (passwordInput === TEACHER_PASSWORD) {
      sessionStorage.setItem(TEACHER_UNLOCKED_KEY, "true");
      setIsUnlocked(true);
      setPasswordInput("");
      setPasswordError("");
      return;
    }

    setPasswordError("Incorrect password. Please try again.");
  };

  const lockTeacherArea = () => {
    sessionStorage.removeItem(TEACHER_UNLOCKED_KEY);
    setIsUnlocked(false);
    setPasswordInput("");
    setPasswordError("");
  };

  if (!isUnlocked) {
    return (
      <main
        style={{
          padding: 32,
          fontFamily: "Inter, Arial, sans-serif",
          maxWidth: 920,
          margin: "0 auto",
          background: pastel.page,
          color: pastel.text,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            background:
              "linear-gradient(135deg, #fdf2f8 0%, #eff6ff 45%, #ecfeff 100%)",
            border: `1px solid ${pastel.border}`,
            borderRadius: 28,
            padding: 32,
            boxShadow: pastel.shadow,
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 14,
                color: "#7c3aed",
                fontWeight: 700,
                letterSpacing: 0.3,
                marginBottom: 8,
              }}
            >
              APSR Computing Platform
            </div>
            <h1
              style={{
                fontSize: 46,
                lineHeight: 1.05,
                margin: "0 0 10px",
                color: pastel.title,
              }}
            >
              Year 8 Teacher Dashboard
            </h1>
            <p style={{ fontSize: 20, margin: 0, maxWidth: 720 }}>
              Enter the teacher password to open the dashboard on this device.
            </p>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.82)",
              border: `1px solid ${pastel.border}`,
              borderRadius: 24,
              padding: 24,
              display: "grid",
              gap: 16,
            }}
          >
            <label
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: pastel.title,
              }}
            >
              Password
            </label>

            <input
              type="password"
              value={passwordInput}
              onChange={(event) => {
                setPasswordInput(event.target.value);
                if (passwordError) setPasswordError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") unlockTeacherArea();
              }}
              placeholder="Enter teacher password"
              style={{
                width: "100%",
                padding: "16px 18px",
                borderRadius: 16,
                border: passwordError
                  ? "1px solid #fca5a5"
                  : `1px solid ${pastel.border}`,
                fontSize: 18,
                outline: "none",
                background: "#ffffff",
              }}
            />

            {passwordError && (
              <div
                style={{
                  color: "#b91c1c",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {passwordError}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={unlockTeacherArea}
                style={{
                  padding: "14px 18px",
                  borderRadius: 16,
                  border: "none",
                  background:
                    "linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)",
                  color: "#ffffff",
                  fontWeight: 800,
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                Unlock Dashboard
              </button>

              <button
                onClick={() => router.push("/")}
                style={{
                  border: `1px solid ${pastel.border}`,
                  background: "#ffffff",
                  color: pastel.title,
                  borderRadius: 16,
                  padding: "14px 18px",
                  fontWeight: 800,
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                Return to Pupil App
              </button>
            </div>

            <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
              This is a local classroom password gate only. It is not a full
              authentication system.
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 32,
        fontFamily: "Inter, Arial, sans-serif",
        maxWidth: 1560,
        margin: "0 auto",
        background: pastel.page,
        color: pastel.text,
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(135deg, #fdf2f8 0%, #eff6ff 45%, #ecfeff 100%)",
          border: `1px solid ${pastel.border}`,
          borderRadius: 28,
          padding: 28,
          boxShadow: pastel.shadow,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                color: "#7c3aed",
                fontWeight: 700,
                letterSpacing: 0.3,
                marginBottom: 8,
              }}
            >
              APSR Computing Platform
            </div>

            <h1
              style={{
                fontSize: 46,
                lineHeight: 1.05,
                margin: "0 0 10px",
                color: pastel.title,
              }}
            >
              Year 8 Teacher Dashboard
            </h1>

            <p style={{ fontSize: 20, margin: 0, maxWidth: 860 }}>
              View pupil progress for the Year 8 student app, including lesson
              completion, quiz performance, mastery, screenshots, and quick access
              back into any pupil profile.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={refreshCloudResults}
              style={{
                border: `1px solid ${pastel.border}`,
                background: pastel.panelBlue,
                color: pastel.title,
                borderRadius: 16,
                padding: "14px 18px",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              Refresh Cloud Results
            </button>

            <button
              onClick={downloadTeacherCsv}
              style={{
                border: `1px solid ${pastel.border}`,
                background: pastel.panelMint,
                color: pastel.title,
                borderRadius: 16,
                padding: "14px 18px",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              Download Excel
            </button>

            <button
              onClick={resetAllAccessCodes}
              style={{
                border: "1px solid #bae6fd",
                background: pastel.panelSky,
                color: pastel.title,
                borderRadius: 16,
                padding: "14px 18px",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              Reset Codes to 123456
            </button>

            <button
              onClick={lockTeacherArea}
              style={{
                border: "1px solid #fed7aa",
                background: "#fff7ed",
                color: "#c2410c",
                borderRadius: 16,
                padding: "14px 18px",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              Lock Dashboard
            </button>

            <button
              onClick={() => router.push("/")}
              style={{
                border: `1px solid ${pastel.border}`,
                background: "#ffffff",
                color: pastel.title,
                borderRadius: 16,
                padding: "14px 18px",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              Return to Pupil App
            </button>
          </div>
        </div>

        {cloudStatus && (
          <div
            style={{
              marginTop: 18,
              background: "rgba(255,255,255,0.82)",
              border: `1px solid ${pastel.border}`,
              borderRadius: 16,
              padding: "12px 14px",
              color: pastel.title,
              fontWeight: 700,
            }}
          >
            {cloudStatus}
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 28,
          alignItems: "start",
        }}
      >
        <aside
          style={{
            background: pastel.panel,
            border: `1px solid ${pastel.border}`,
            borderRadius: 24,
            padding: 22,
            boxShadow: pastel.shadow,
            position: "sticky",
            top: 20,
          }}
        >
          <h2
            style={{
              fontSize: 30,
              marginTop: 0,
              marginBottom: 16,
              color: pastel.title,
            }}
          >
            Class View
          </h2>

          <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
            {CLASS_OPTIONS.map((classOption) => {
              const isActive = selectedClass === classOption;

              return (
                <button
                  key={classOption}
                  onClick={() => setSelectedClass(classOption)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "16px 16px",
                    borderRadius: 18,
                    border: isActive
                      ? "1px solid #c4b5fd"
                      : `1px solid ${pastel.border}`,
                    background: isActive
                      ? "linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)"
                      : "#ffffff",
                    color: pastel.title,
                    fontWeight: 800,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  {classOption}
                </button>
              );
            })}
          </div>

          <div
            style={{
              background: pastel.panelBlue,
              border: `1px solid ${pastel.border}`,
              borderRadius: 18,
              padding: 16,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "#7c3aed",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 10,
              }}
            >
              Class Summary
            </div>

            <div style={{ display: "grid", gap: 10, fontSize: 15 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span>Total pupils</span>
                <strong>{classSummary.total}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span>Active pupils</span>
                <strong>{classSummary.active}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span>Not started</span>
                <strong>{classSummary.notStarted}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span>At risk</span>
                <strong>{classSummary.atRisk}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span>Average progress</span>
                <strong>{classSummary.averageProgress}%</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span>Average mastery</span>
                <strong>{classSummary.averageMastery}</strong>
              </div>
            </div>
          </div>

          <div
            style={{
              background: pastel.panelSoft,
              border: `1px solid ${pastel.border}`,
              borderRadius: 18,
              padding: 16,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "#7c3aed",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 10,
              }}
            >
              Show Pupils
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {(["all", "active", "not-started"] as ActivityFilter[]).map(
                (filterValue) => {
                  const active = activityFilter === filterValue;
                  const label =
                    filterValue === "all"
                      ? "All"
                      : filterValue === "active"
                      ? "Only active"
                      : "Only not started";

                  return (
                    <button
                      key={filterValue}
                      onClick={() => setActivityFilter(filterValue)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 999,
                        border: active
                          ? "1px solid #c4b5fd"
                          : `1px solid ${pastel.border}`,
                        background: active ? pastel.accentSoft : "#ffffff",
                        color: pastel.title,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div
            style={{
              background: pastel.panelSoft,
              border: `1px solid ${pastel.border}`,
              borderRadius: 18,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "#7c3aed",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 10,
              }}
            >
              Sort Pupils
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => setSortMode("name")}
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  border:
                    sortMode === "name"
                      ? "1px solid #c4b5fd"
                      : `1px solid ${pastel.border}`,
                  background: sortMode === "name" ? pastel.accentSoft : "#ffffff",
                  color: pastel.title,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Name
              </button>

              <button
                onClick={() => setSortMode("progress")}
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  border:
                    sortMode === "progress"
                      ? "1px solid #c4b5fd"
                      : `1px solid ${pastel.border}`,
                  background:
                    sortMode === "progress" ? pastel.accentSoft : "#ffffff",
                  color: pastel.title,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Progress
              </button>

              <button
                onClick={() => setSortMode("mastery")}
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  border:
                    sortMode === "mastery"
                      ? "1px solid #c4b5fd"
                      : `1px solid ${pastel.border}`,
                  background:
                    sortMode === "mastery" ? pastel.accentSoft : "#ffffff",
                  color: pastel.title,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Mastery
              </button>
            </div>
          </div>
        </aside>

        <section style={{ display: "grid", gap: 20 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: 18,
            }}
          >
            <div
              style={{
                background: pastel.panel,
                border: `1px solid ${pastel.border}`,
                borderRadius: 22,
                padding: 20,
                boxShadow: pastel.shadow,
              }}
            >
              <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
                Selected Class
              </div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 24,
                  color: pastel.title,
                  lineHeight: 1.2,
                }}
              >
                {selectedClass}
              </div>
            </div>

            <div
              style={{
                background: pastel.panel,
                border: `1px solid ${pastel.border}`,
                borderRadius: 22,
                padding: 20,
                boxShadow: pastel.shadow,
              }}
            >
              <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
                Visible Pupils
              </div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 34,
                  color: pastel.title,
                }}
              >
                {classRows.length}
              </div>
            </div>

            <div
              style={{
                background: pastel.panel,
                border: `1px solid ${pastel.border}`,
                borderRadius: 22,
                padding: 20,
                boxShadow: pastel.shadow,
              }}
            >
              <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
                Average Progress
              </div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 34,
                  color: pastel.title,
                }}
              >
                {classSummary.averageProgress}%
              </div>
            </div>

            <div
              style={{
                background: pastel.panel,
                border: `1px solid ${pastel.border}`,
                borderRadius: 22,
                padding: 20,
                boxShadow: pastel.shadow,
              }}
            >
              <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
                Avg Mastery
              </div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 34,
                  color: pastel.title,
                }}
              >
                {classSummary.averageMastery}
              </div>
            </div>

            <div
              style={{
                background: pastel.panel,
                border: `1px solid ${pastel.border}`,
                borderRadius: 22,
                padding: 20,
                boxShadow: pastel.shadow,
              }}
            >
              <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
                At Risk / No Start
              </div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 34,
                  color: pastel.title,
                }}
              >
                {classSummary.atRisk}
              </div>
            </div>
          </div>

          {classRows.length === 0 ? (
            <div
              style={{
                background: pastel.panel,
                border: `1px dashed ${pastel.border}`,
                borderRadius: 24,
                padding: 32,
                textAlign: "center",
                color: "#64748b",
                fontSize: 18,
                boxShadow: pastel.shadow,
              }}
            >
              No saved pupils found for this view.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(390px, 1fr))",
                gap: 22,
              }}
            >
              {classRows.map((row) => {
                const status = statusConfig(row.status);
                const isHighestProgress =
                  row.progressPercent === highestProgressValue &&
                  highestProgressValue > 0;
                const isCurrent = row.storageKey === currentProfileKey;
                const showDetails = Boolean(expandedRows[row.storageKey]);
                const isAtRisk =
                  row.status === "not-started" || row.progressPercent < 25;

                return (
                  <div
                    key={row.storageKey}
                    style={{
                      background: "#ffffff",
                      border: isAtRisk
                        ? `1px solid ${pastel.roseBorder}`
                        : `1px solid ${status.cardBorder}`,
                      borderRadius: 24,
                      padding: 22,
                      boxShadow: isAtRisk ? status.cardGlow : pastel.shadow,
                      display: "grid",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 16,
                        alignItems: "start",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div
                          style={{
                            fontSize: 24,
                            fontWeight: 900,
                            color: pastel.title,
                            lineHeight: 1.2,
                            marginBottom: 6,
                          }}
                        >
                          {row.studentName}
                        </div>

                        <div style={{ fontSize: 14, color: "#64748b" }}>
                          {row.className}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            marginTop: 12,
                          }}
                        >
                          <span
                            style={{
                              background: pastel.panelMint,
                              color: pastel.title,
                              border: `1px solid ${pastel.border}`,
                              borderRadius: 999,
                              padding: "8px 10px",
                              fontWeight: 800,
                              fontSize: 12,
                            }}
                          >
                            Access code: {row.accessCode || DEFAULT_ACCESS_CODE}
                          </span>

                          {isHighestProgress && (
                            <span
                              style={{
                                background: pastel.panelPeach,
                                color: "#b45309",
                                border: "1px solid #fed7aa",
                                borderRadius: 999,
                                padding: "8px 10px",
                                fontWeight: 800,
                                fontSize: 12,
                              }}
                            >
                              Highest progress
                            </span>
                          )}

                          {row.masteredCount > 0 && (
                            <span
                              style={{
                                background: "#dcfce7",
                                color: "#166534",
                                border: "1px solid #86efac",
                                borderRadius: 999,
                                padding: "8px 10px",
                                fontWeight: 800,
                                fontSize: 12,
                              }}
                            >
                              Mastered: {row.masteredCount}
                            </span>
                          )}

                          {isAtRisk && (
                            <span
                              style={{
                                background: pastel.roseSoft,
                                color: pastel.rose,
                                border: `1px solid ${pastel.roseBorder}`,
                                borderRadius: 999,
                                padding: "8px 10px",
                                fontWeight: 800,
                                fontSize: 12,
                              }}
                            >
                              At risk
                            </span>
                          )}
                        </div>
                      </div>

                      <ProgressRing
                        value={row.progressPercent}
                        colour={status.ring}
                      />
                    </div>

                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        alignSelf: "start",
                        background: status.bg,
                        color: status.text,
                        border: `1px solid ${status.border}`,
                        borderRadius: 999,
                        padding: "8px 12px",
                        fontWeight: 800,
                        fontSize: 14,
                      }}
                    >
                      <span>{status.emoji}</span>
                      <span>{status.label}</span>
                    </div>

                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          marginBottom: 8,
                          fontWeight: 800,
                          color: pastel.title,
                        }}
                      >
                        <span>Progress</span>
                        <span>{row.progressPercent}%</span>
                      </div>

                      <div
                        style={{
                          height: 14,
                          background: "#e2e8f0",
                          borderRadius: 999,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${row.progressPercent}%`,
                            height: "100%",
                            background: status.progressBar,
                          }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          background: pastel.panelLilac,
                          border: `1px solid ${pastel.border}`,
                          borderRadius: 16,
                          padding: 14,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            color: "#64748b",
                            marginBottom: 6,
                          }}
                        >
                          Lessons
                        </div>
                        <div
                          style={{
                            fontWeight: 900,
                            fontSize: 22,
                            color: pastel.title,
                          }}
                        >
                          {row.completedLessons}/{row.totalLessons}
                        </div>
                      </div>

                      <div
                        style={{
                          background: pastel.panelMint,
                          border: `1px solid ${pastel.border}`,
                          borderRadius: 16,
                          padding: 14,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            color: "#64748b",
                            marginBottom: 6,
                          }}
                        >
                          Quizzes
                        </div>
                        <div
                          style={{
                            fontWeight: 900,
                            fontSize: 22,
                            color: pastel.title,
                          }}
                        >
                          {row.quizCompletedCount}
                        </div>
                      </div>

                      <div
                        style={{
                          background: "#dcfce7",
                          border: "1px solid #86efac",
                          borderRadius: 16,
                          padding: 14,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            color: "#166534",
                            marginBottom: 6,
                          }}
                        >
                          Mastered
                        </div>
                        <div
                          style={{
                            fontWeight: 900,
                            fontSize: 22,
                            color: pastel.title,
                          }}
                        >
                          {row.masteredCount}
                        </div>
                      </div>

                      <div
                        style={{
                          background: pastel.panelPeach,
                          border: `1px solid ${pastel.border}`,
                          borderRadius: 16,
                          padding: 14,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            color: "#64748b",
                            marginBottom: 6,
                          }}
                        >
                          Screens
                        </div>
                        <div
                          style={{
                            fontWeight: 900,
                            fontSize: 22,
                            color: pastel.title,
                          }}
                        >
                          {row.screenshotCount}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#f8fafc",
                        border: `1px solid ${pastel.border}`,
                        borderRadius: 16,
                        padding: 14,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontWeight: 700, color: pastel.title }}>
                        Average quiz score
                      </span>
                      <span style={{ fontWeight: 900, color: pastel.title }}>
                        {row.averageQuizPercent}%
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        onClick={() => openPupil(row)}
                        style={{
                          flex: 1,
                          minWidth: 120,
                          padding: "14px 16px",
                          borderRadius: 14,
                          border: "none",
                          background:
                            "linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)",
                          color: "#ffffff",
                          fontWeight: 800,
                          fontSize: 16,
                          cursor: "pointer",
                        }}
                      >
                        Open
                      </button>

                      <button
                        onClick={() => toggleDetails(row.storageKey)}
                        style={{
                          minWidth: 120,
                          padding: "14px 16px",
                          borderRadius: 14,
                          border: `1px solid ${pastel.border}`,
                          background: "#ffffff",
                          color: pastel.title,
                          fontWeight: 800,
                          fontSize: 16,
                          cursor: "pointer",
                        }}
                      >
                        {showDetails ? "Hide Details" : "View Details"}
                      </button>

                      <button
                        onClick={() => resetPupil(row)}
                        style={{
                          minWidth: 110,
                          padding: "14px 16px",
                          borderRadius: 14,
                          border: "1px solid #fed7aa",
                          background: "#fff7ed",
                          color: "#c2410c",
                          fontWeight: 800,
                          fontSize: 16,
                          cursor: "pointer",
                        }}
                      >
                        Reset
                      </button>

                      <button
                        onClick={() => deletePupil(row)}
                        style={{
                          minWidth: 110,
                          padding: "14px 16px",
                          borderRadius: 14,
                          border: "1px solid #fecdd3",
                          background: pastel.roseSoft,
                          color: pastel.rose,
                          fontWeight: 800,
                          fontSize: 16,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>

                    {showDetails && (
                      <div
                        style={{
                          background: "#fafcff",
                          border: `1px solid ${pastel.border}`,
                          borderRadius: 18,
                          padding: 16,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 900,
                            color: pastel.title,
                            marginBottom: 12,
                          }}
                        >
                          Lesson-by-Lesson Overview
                        </div>

                        <div style={{ display: "grid", gap: 8 }}>
                          {Array.from({ length: TOTAL_LESSONS }, (_, index) => {
                            const lessonId = index + 1;
                            const isCompleted = row.completedLessonIds.includes(lessonId);
                            const quizResult = row.quizMap[lessonId];
                            const hasQuiz = Boolean(quizResult?.submitted);
                            const hasScreenshot = Boolean(row.screenshots[lessonId]);
                            const quizBadge = hasQuiz
                              ? getQuizBadge(quizResult.score)
                              : null;

                            return (
                              <div
                                key={lessonId}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "74px 1fr auto auto",
                                  gap: 12,
                                  alignItems: "center",
                                  padding: "10px 12px",
                                  borderRadius: 14,
                                  background: "#ffffff",
                                  border: `1px solid ${pastel.border}`,
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: 800,
                                    fontSize: 13,
                                    color: "#64748b",
                                  }}
                                >
                                  L{lessonId}
                                </div>

                                <div>
                                  <div
                                    style={{
                                      fontWeight: 800,
                                      color: pastel.title,
                                      fontSize: 14,
                                      lineHeight: 1.35,
                                    }}
                                  >
                                    {LESSON_TITLES[index]}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: isCompleted ? "#166534" : "#b91c1c",
                                      marginTop: 3,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {isCompleted ? "Completed" : "Not started"}
                                  </div>
                                </div>

                                <div>
                                  {quizBadge ? (
                                    <span
                                      style={{
                                        background: quizBadge.bg,
                                        border: `1px solid ${quizBadge.border}`,
                                        color: quizBadge.text,
                                        borderRadius: 999,
                                        padding: "7px 10px",
                                        fontWeight: 800,
                                        fontSize: 12,
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {quizBadge.label}
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        color: "#94a3b8",
                                        fontWeight: 700,
                                        fontSize: 12,
                                      }}
                                    >
                                      No quiz
                                    </span>
                                  )}
                                </div>

                                <div
                                  style={{
                                    color: pastel.title,
                                    fontWeight: 700,
                                    fontSize: 12,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  Screenshot: {hasScreenshot ? "Yes" : "No"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
