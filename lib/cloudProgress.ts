import { supabase } from "@/lib/supabase";

export type LearnerProfile = {
  className: string;
  studentName: string;
  storageKey: string;
  accessCode?: string;
};

export type QuizResult = {
  submitted: boolean;
  score: number;
  answers: number[];
};

export type ScreenshotMap = Record<number, string>;
export type QuizMap = Record<number, QuizResult>;

export type CloudProfileData = {
  completedLessonIds: number[];
  quizMap: QuizMap;
  screenshots: ScreenshotMap;
};

type PupilRow = {
  storage_key: string;
  class_name: string;
  student_name: string;
  access_code: string | null;
};

type LessonProgressRow = {
  storage_key: string;
  lesson_id: number;
  completed: boolean | null;
  quiz_submitted: boolean | null;
  quiz_score: number | null;
  quiz_answers: number[] | null;
  screenshot: string | null;
};

export function cloudSyncEnabled() {
  return Boolean(supabase);
}

export async function saveCloudProfile(profile: LearnerProfile) {
  if (!supabase) return;

  const payload: Record<string, string | null> = {
    storage_key: profile.storageKey,
    class_name: profile.className,
    student_name: profile.studentName,
    updated_at: new Date().toISOString(),
  };

  if (typeof profile.accessCode === "string") {
    payload.access_code = profile.accessCode;
  }

  const { error } = await supabase
    .from("pupils")
    .upsert(payload, { onConflict: "storage_key" });

  if (error) throw error;
}

export async function saveCloudLessonProgress(
  profile: LearnerProfile,
  lessonId: number,
  progress: {
    completed?: boolean;
    quizResult?: QuizResult;
    screenshot?: string | null;
  }
) {
  if (!supabase) return;

  await saveCloudProfile(profile);

  const payload: Record<string, unknown> = {
    storage_key: profile.storageKey,
    lesson_id: lessonId,
    updated_at: new Date().toISOString(),
  };

  if (typeof progress.completed === "boolean") {
    payload.completed = progress.completed;
  }

  if (progress.quizResult) {
    payload.quiz_submitted = progress.quizResult.submitted;
    payload.quiz_score = progress.quizResult.score;
    payload.quiz_answers = progress.quizResult.answers;
  }

  if ("screenshot" in progress) {
    payload.screenshot = progress.screenshot;
  }

  const { error } = await supabase
    .from("lesson_progress")
    .upsert(payload, { onConflict: "storage_key,lesson_id" });

  if (error) throw error;
}

export async function deleteCloudPupilData(profile: LearnerProfile) {
  if (!supabase) return;

  const { error } = await supabase
    .from("lesson_progress")
    .delete()
    .eq("storage_key", profile.storageKey);

  if (error) throw error;
}

export async function deleteCloudPupil(profile: LearnerProfile) {
  if (!supabase) return;

  const { error } = await supabase
    .from("pupils")
    .delete()
    .eq("storage_key", profile.storageKey);

  if (error) throw error;
}

export async function loadCloudProfileData(
  storageKey: string
): Promise<CloudProfileData | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("lesson_progress")
    .select(
      "storage_key, lesson_id, completed, quiz_submitted, quiz_score, quiz_answers, screenshot"
    )
    .eq("storage_key", storageKey);

  if (error) throw error;

  return rowsToProfileData((data || []) as LessonProgressRow[]);
}

export async function loadCloudClassroomData() {
  if (!supabase) return [];

  const { data: pupils, error: pupilError } = await supabase
    .from("pupils")
    .select("storage_key, class_name, student_name, access_code")
    .order("class_name", { ascending: true })
    .order("student_name", { ascending: true });

  if (pupilError) throw pupilError;

  const { data: progressRows, error: progressError } = await supabase
    .from("lesson_progress")
    .select(
      "storage_key, lesson_id, completed, quiz_submitted, quiz_score, quiz_answers, screenshot"
    );

  if (progressError) throw progressError;

  const progressByPupil = new Map<string, LessonProgressRow[]>();
  ((progressRows || []) as LessonProgressRow[]).forEach((row) => {
    const existing = progressByPupil.get(row.storage_key) || [];
    existing.push(row);
    progressByPupil.set(row.storage_key, existing);
  });

  return ((pupils || []) as PupilRow[]).map((pupil) => ({
    profile: {
      className: pupil.class_name,
      studentName: pupil.student_name,
      storageKey: pupil.storage_key,
      accessCode: pupil.access_code || undefined,
    },
    data: rowsToProfileData(progressByPupil.get(pupil.storage_key) || []),
  }));
}

function rowsToProfileData(rows: LessonProgressRow[]): CloudProfileData {
  const completedLessonIds: number[] = [];
  const quizMap: QuizMap = {};
  const screenshots: ScreenshotMap = {};

  rows.forEach((row) => {
    if (row.completed) completedLessonIds.push(row.lesson_id);

    if (row.quiz_submitted) {
      quizMap[row.lesson_id] = {
        submitted: true,
        score: row.quiz_score || 0,
        answers: Array.isArray(row.quiz_answers) ? row.quiz_answers : [],
      };
    }

    if (row.screenshot) {
      screenshots[row.lesson_id] = row.screenshot;
    }
  });

  return {
    completedLessonIds: completedLessonIds.sort((a, b) => a - b),
    quizMap,
    screenshots,
  };
}
