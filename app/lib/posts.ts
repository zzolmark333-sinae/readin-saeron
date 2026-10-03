import "server-only";
import { readDB, updateDB, newId, type DB, type Memo, type Post, type PostSource } from "./store";
import { generatePost, GenerateError } from "./generate";
import { getSeries, SERIES } from "./questions";
import { pickTopic } from "./topics";
import { kst, daysBetween } from "./kst";

export const UNPUBLISHED_LIMIT = 3;

function labeledAnswers(db: DB) {
  // 질문 문장과 함께 넘겨야 모델이 답의 맥락을 알아요
  const out: Record<string, Record<string, string>> = {};
  for (const s of SERIES) {
    const a = db.interviews[s.no] ?? {};
    const filled = s.questions.filter((q) => a[q.id]?.trim());
    if (filled.length) out[`${s.no}편 ${s.title}`] = Object.fromEntries(filled.map((q) => [q.question, a[q.id].trim()]));
  }
  return out;
}

const recentPosts = (db: DB) => [...db.posts].sort((a, b) => b.created_at.localeCompare(a.created_at));

async function save(db: DB, g: Awaited<ReturnType<typeof generatePost>>, meta: { series_no: number | null; source: PostSource; topic?: string; kind: "series" | "auto" }, useMemos: (memos: Memo[], postId: string) => void = () => {}) {
  const post: Post = {
    id: newId(), series_no: meta.series_no, titles: g.titles, body: g.body, highlight: g.highlight,
    source: meta.source, topic: meta.topic, status: "ready", published_at: null, created_at: new Date().toISOString(),
  };
  await updateDB((d) => {
    d.posts.push(post);
    useMemos(d.memos, post.id);
    d.usage.push({ at: post.created_at, kind: meta.kind, input_tokens: g.input_tokens, output_tokens: g.output_tokens });
  });
  return post;
}

export async function createSeriesPost(no: number) {
  const s = getSeries(no);
  if (!s) throw new GenerateError("없는 편이에요.");
  const db = await readDB();
  const a = db.interviews[no] ?? {};
  const missing = s.questions.filter((q) => q.required && !a[q.id]?.trim());
  if (missing.length) throw new GenerateError(`필수 질문 ${missing.length}개에 아직 답하지 않았어요.`);

  const next = getSeries(no + 1);
  const task = `- 시리즈 ${s.no}편: ${s.title} / 목표: ${s.goal}
- 이번 편의 답변을 중심으로 쓰고, 다른 편 답변은 배경으로만 쓴다.
- 다음 편 예고: ${next ? `${next.no}편 '${next.title}'` : "앞으로 수업 현장 이야기를 연재한다는 예고"}`;

  const g = await generatePost({ profile: db.profile, answers: labeledAnswers(db), task, recent: recentPosts(db) });
  return save(db, g, { series_no: no, source: "series", kind: "series" });
}

type Plan = { source: PostSource; task: string; topic: string; memoIds: string[]; reminderFor?: string };

// SPEC 5-2 소재 우선순위: 마감 전 행사 → 글 방향 → 수업 장면 → 시기별 글감
export function planNext(db: DB, today = kst()): Plan {
  const due = (m: Memo) => !m.target_date || m.target_date <= today.date;
  const open = db.memos.filter((m) => !m.used_post_id && due(m));

  const events = open
    .filter((m) => m.kind === "event" && m.event && (!m.event.deadline || m.event.deadline >= today.date))
    .sort((a, b) => (a.event!.deadline || "9999").localeCompare(b.event!.deadline || "9999"));
  if (events[0]) {
    const e = events[0].event!;
    return {
      source: "memo_event", topic: `행사 안내: ${e.name}`, memoIds: [events[0].id],
      task: `- 이번 글은 특별 행사 안내 글이다.
- 메모: ${JSON.stringify(e)}${events[0].body ? `\n- 덧붙인 말: ${events[0].body}` : ""}
- 행사명·일시·대상·내용·신청 방법·마감일을 정확히 옮긴다. 메모에 없는 정보는 지어내지 말고 [확인 필요]로 표시한다.
- 원장 배경은 인터뷰 답변과 참고 지식에서만 가져온다.`,
    };
  }

  if (db.settings.event_reminder) {
    const remind = db.memos.find((m) => m.kind === "event" && m.used_post_id && !m.reminder_post_id && m.event?.deadline &&
      daysBetween(today.date, m.event.deadline) >= 0 && daysBetween(today.date, m.event.deadline) <= 2);
    if (remind) {
      const e = remind.event!;
      return {
        source: "memo_event", topic: `마감 임박: ${e.name}`, memoIds: [], reminderFor: remind.id,
        task: `- 이번 글은 이미 안내한 특별 행사의 마감 임박 리마인드 글이다. 짧게(1,000자 안팎) 쓴다.
- 메모: ${JSON.stringify(e)}
- 메모에 없는 정보는 지어내지 말고 [확인 필요]로 표시한다.`,
      };
    }
  }

  const direction = open.find((m) => m.kind === "direction");
  const scenes = open.filter((m) => m.kind === "scene").slice(0, 3);
  if (direction || scenes.length) {
    return {
      source: direction ? "memo_direction" : "memo_scene",
      topic: direction ? `방향: ${direction.body.slice(0, 30)}` : `수업 장면: ${scenes[0].body.slice(0, 30)}`,
      memoIds: [direction?.id, ...scenes.map((s) => s.id)].filter(Boolean) as string[],
      task: `- 이번 글은 6편 시리즈 이후의 연재 글이다.
${direction ? `- 글 방향 메모(최우선으로 따른다): ${direction.body}\n` : ""}${scenes.length ? `- 수업 장면 메모(첫 장면·사례 재료): ${scenes.map((s) => s.body).join(" / ")}\n` : ""}- 원장 배경은 인터뷰 답변과 참고 지식에서만 가져온다.`,
    };
  }

  const topic = pickTopic(today.month, recentPosts(db).slice(0, 10).map((p) => `${p.topic ?? ""} ${p.titles[0] ?? ""}`));
  return {
    source: "topic", topic, memoIds: [],
    task: `- 이번 글은 6편 시리즈 이후의 정보형 연재 글이다. 주제: ${topic}
- 일반론으로 끝내지 말고 원장의 실제 수업 방식(답변·참고 지식의 3S 읽기훈련, 독서진단 등)과 연결한다.
- 수업 장면이 답변에 없으면 장면을 지어내지 말고, 학부모가 자주 하는 질문으로 시작한다.`,
  };
}

export async function createNextPost(kind: "auto" | "manual") {
  const db = await readDB();
  const plan = planNext(db);
  const g = await generatePost({ profile: db.profile, answers: labeledAnswers(db), task: plan.task, recent: recentPosts(db) });
  return save(db, g, { series_no: null, source: plan.source, topic: plan.topic, kind: kind === "auto" ? "auto" : "series" }, (memos, postId) => {
    for (const m of memos) {
      if (plan.memoIds.includes(m.id)) m.used_post_id = postId;
      if (m.id === plan.reminderFor) m.reminder_post_id = postId;
    }
  });
}

// 자동 연재가 오늘 글을 써야 하는지
export function autoStatus(db: DB, now = kst()) {
  const s = db.settings;
  const unpublished = db.posts.filter((p) => p.status === "ready").length;
  const doneToday = db.posts.some((p) => p.series_no === null && kst(new Date(p.created_at)).date === now.date && p.source !== "series");
  if (!s.active) return { due: false, reason: "자동 연재가 꺼져 있어요." };
  if (unpublished >= UNPUBLISHED_LIMIT) return { due: false, reason: `발행 안 한 글이 ${unpublished}편 쌓여 자동 연재를 잠시 멈췄어요. 발행하거나 건너뛰면 다시 시작해요.` };
  if (!s.weekdays.includes(now.weekday)) return { due: false, reason: "오늘은 연재 요일이 아니에요." };
  if (now.hour < 5) return { due: false, reason: "오늘 새벽 5시 이후에 써요." };
  if (doneToday) return { due: false, reason: "오늘 글은 이미 준비됐어요." };
  return { due: true, reason: "" };
}
