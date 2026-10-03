import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// 혼자 쓰는 앱이라 데이터베이스 대신 data/db.json 파일 하나에 저장합니다.
const DIR = path.join(process.cwd(), "data");
const FILE = path.join(DIR, "db.json");

export type AcademyProfile = {
  speaker: "원장님" | "강사·선생님";
  academy_name: string;
  director_name: string;
  region: string;
  kind: "학원" | "교습소" | "공부방" | "개인과외";
  targets: string[];
  courses: string[];
  contact_channel: string;
  contact_detail: string;
  tone: "따뜻하게" | "담백하게";
};

export type PostSource = "series" | "memo_scene" | "memo_event" | "memo_direction" | "topic";
export type Post = {
  id: string;
  series_no: number | null;
  titles: string[];
  body: string;
  highlight: string;
  source: PostSource;
  topic?: string;
  status: "ready" | "published" | "skipped";
  published_at: string | null;
  created_at: string;
};

export type EventInfo = { name: string; date: string; target: string; detail: string; how_to_apply: string; deadline: string };
export type Memo = {
  id: string;
  kind: "scene" | "event" | "direction";
  body: string;
  event: EventInfo | null;
  target_date: string | null;
  used_post_id: string | null;
  reminder_post_id?: string | null;
  created_at: string;
};

export type Settings = { weekdays: number[]; active: boolean; event_reminder: boolean };
export type Usage = { at: string; kind: "series" | "auto"; input_tokens: number; output_tokens: number };

export type DB = {
  profile: AcademyProfile;
  interviews: Record<string, Record<string, string>>;
  posts: Post[];
  memos: Memo[];
  settings: Settings;
  usage: Usage[];
};

const DEFAULT: DB = {
  profile: {
    speaker: "원장님",
    academy_name: "리드인 새론독서국어학원",
    director_name: "최신애",
    region: "",
    kind: "학원",
    targets: ["초등", "중등", "고등"],
    courses: ["독서", "국어", "논술", "문해력", "글쓰기"],
    contact_channel: "전화",
    contact_detail: "010-8999-8829",
    tone: "따뜻하게",
  },
  interviews: {},
  posts: [],
  memos: [],
  settings: { weekdays: [1, 3, 5], active: true, event_reminder: true },
  usage: [],
};

export async function readDB(): Promise<DB> {
  try {
    const raw = JSON.parse(await fs.readFile(FILE, "utf8")) as Partial<DB>;
    return { ...DEFAULT, ...raw, profile: { ...DEFAULT.profile, ...raw.profile }, settings: { ...DEFAULT.settings, ...raw.settings } };
  } catch {
    return structuredClone(DEFAULT);
  }
}

// 동시에 두 번 저장해도 파일이 깨지지 않게 순서대로 씁니다.
let queue: Promise<unknown> = Promise.resolve();
export function updateDB<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await readDB();
    const result = await fn(db);
    await fs.mkdir(DIR, { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2));
    await fs.rename(tmp, FILE);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

export const newId = () => randomUUID();
