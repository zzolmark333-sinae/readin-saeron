import "server-only";
import { readDB } from "./store";
import { hasApiKey } from "./generate";
import { autoStatus, createNextPost } from "./posts";

// 앱이 켜져 있는 동안 10분마다 확인해서, 연재 요일 새벽 5시 이후면 그날 글을 한 편 써 둡니다.
// 컴퓨터가 꺼져 있었다면 다음에 앱을 켤 때 그날 글을 따라잡아 씁니다.
const g = globalThis as unknown as { __autoTimer?: NodeJS.Timeout; __autoRunning?: boolean };

export async function tick() {
  if (g.__autoRunning || !hasApiKey()) return;
  g.__autoRunning = true;
  try {
    const db = await readDB();
    const st = autoStatus(db);
    if (!st.due) { console.log(`[자동 연재] ${st.reason}`); return; }
    const post = await createNextPost("auto");
    console.log(`[자동 연재] 새 글 준비됨: ${post.titles[0]}`);
  } catch (e) {
    console.error("[자동 연재] 실패:", e instanceof Error ? e.message : e);
  } finally {
    g.__autoRunning = false;
  }
}

export function startScheduler() {
  if (g.__autoTimer) return;
  console.log("[자동 연재] 예약 확인을 시작해요 (10분마다).");
  g.__autoTimer = setInterval(tick, 10 * 60 * 1000);
  setTimeout(tick, 15 * 1000);
}
