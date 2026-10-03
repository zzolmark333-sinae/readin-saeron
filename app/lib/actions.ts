"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateDB, newId, type AcademyProfile, type Memo } from "./store";
import { createSeriesPost, createNextPost } from "./posts";
import { GenerateError } from "./generate";
import { getSeries } from "./questions";

export type ActionState = { error?: string; ok?: string };

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function saveProfile(_: ActionState, f: FormData): Promise<ActionState> {
  await updateDB((db) => {
    db.profile = {
      speaker: (str(f, "speaker") || "원장님") as AcademyProfile["speaker"],
      academy_name: str(f, "academy_name"),
      director_name: str(f, "director_name"),
      region: str(f, "region"),
      kind: (str(f, "kind") || "학원") as AcademyProfile["kind"],
      targets: f.getAll("targets").map(String),
      courses: f.getAll("courses").map(String),
      contact_channel: str(f, "contact_channel"),
      contact_detail: str(f, "contact_detail"),
      tone: (str(f, "tone") || "따뜻하게") as AcademyProfile["tone"],
    };
  });
  revalidatePath("/", "layout");
  return { ok: "저장했어요." };
}

export async function saveAnswer(no: number, qid: string, value: string) {
  if (!getSeries(no)?.questions.some((q) => q.id === qid)) return;
  await updateDB((db) => {
    db.interviews[no] = { ...(db.interviews[no] ?? {}), [qid]: value };
  });
}

export async function generateSeries(no: number): Promise<ActionState & { id?: string }> {
  try {
    const post = await createSeriesPost(no);
    revalidatePath("/", "layout");
    return { id: post.id };
  } catch (e) {
    if (e instanceof GenerateError) return { error: e.message };
    throw e;
  }
}

export async function generateNext(): Promise<ActionState & { id?: string }> {
  try {
    const post = await createNextPost("manual");
    revalidatePath("/", "layout");
    return { id: post.id };
  } catch (e) {
    if (e instanceof GenerateError) return { error: e.message };
    throw e;
  }
}

export async function setPostStatus(f: FormData) {
  const id = str(f, "id");
  const status = str(f, "status") as "ready" | "published" | "skipped";
  if (!["ready", "published", "skipped"].includes(status)) return;
  await updateDB((db) => {
    const p = db.posts.find((x) => x.id === id);
    if (p) { p.status = status; p.published_at = status === "published" ? new Date().toISOString() : null; }
  });
  revalidatePath("/", "layout");
}

export async function deletePost(f: FormData) {
  const id = str(f, "id");
  await updateDB((db) => {
    db.posts = db.posts.filter((p) => p.id !== id);
    for (const m of db.memos) {
      if (m.used_post_id === id) m.used_post_id = null;
      if (m.reminder_post_id === id) m.reminder_post_id = null;
    }
  });
  revalidatePath("/", "layout");
  redirect("/posts");
}

export async function addMemo(_: ActionState, f: FormData): Promise<ActionState> {
  const kind = str(f, "kind") as Memo["kind"];
  const memo: Memo = {
    id: newId(), kind, body: str(f, "body"), event: null,
    target_date: str(f, "target_date") || null, used_post_id: null, created_at: new Date().toISOString(),
  };
  if (kind === "event") {
    memo.event = {
      name: str(f, "name"), date: str(f, "date"), target: str(f, "target"),
      detail: str(f, "detail"), how_to_apply: str(f, "how_to_apply"), deadline: str(f, "deadline"),
    };
    if (!memo.event.name) return { error: "행사명을 적어 주세요." };
  } else if (!memo.body) {
    return { error: "내용을 적어 주세요." };
  }
  if (!["scene", "event", "direction"].includes(kind)) return { error: "종류를 골라 주세요." };
  await updateDB((db) => { db.memos.push(memo); });
  revalidatePath("/", "layout");
  return { ok: "메모를 남겼어요. 다음 글에 반영돼요." };
}

export async function deleteMemo(f: FormData) {
  const id = str(f, "id");
  await updateDB((db) => { db.memos = db.memos.filter((m) => m.id !== id); });
  revalidatePath("/memos");
}

export async function saveSettings(_: ActionState, f: FormData): Promise<ActionState> {
  await updateDB((db) => {
    db.settings = {
      weekdays: f.getAll("weekdays").map(Number).filter((n) => n >= 0 && n <= 6).sort(),
      active: f.get("active") === "on",
      event_reminder: f.get("event_reminder") === "on",
    };
  });
  revalidatePath("/", "layout");
  return { ok: "저장했어요." };
}
