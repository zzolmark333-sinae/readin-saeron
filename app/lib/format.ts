// 본문을 문단·사진 자리로 나눕니다. [[PHOTO: 설명]] 표시는 한 줄 전체를 차지해요.
export type Block = { type: "p" | "photo"; text: string };

export function toBlocks(body: string): Block[] {
  const out: Block[] = [];
  for (const raw of body.split(/\n\s*\n/)) {
    const parts = raw.split(/(\[\[PHOTO:[^\]]*\]\])/);
    for (const part of parts) {
      const m = part.match(/^\[\[PHOTO:\s*([^\]]*)\]\]$/);
      if (m) out.push({ type: "photo", text: m[1].trim() });
      else if (part.trim()) out.push({ type: "p", text: part.trim() });
    }
  }
  return out;
}

// 네이버에 붙여 넣을 평문
export const toPlain = (body: string) =>
  toBlocks(body).map((b) => (b.type === "photo" ? `[사진: ${b.text}]` : b.text)).join("\n\n");

export const SOURCE_LABEL: Record<string, string> = {
  series: "시리즈", memo_scene: "수업 장면 메모", memo_event: "행사 메모", memo_direction: "글 방향 메모", topic: "시기별 글감",
};
