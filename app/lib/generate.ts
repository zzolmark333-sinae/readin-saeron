import "server-only";
import { promises as fs } from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { AcademyProfile, Post } from "./store";

const PostSchema = z.object({
  titles: z.array(z.string()).describe("제목 후보 3개"),
  body: z.string().describe("본문"),
  highlight: z.string().describe("본문 속 강조할 신념 한 문장 (본문에 그대로 들어 있는 문장)"),
});
export type Generated = z.infer<typeof PostSchema> & { input_tokens: number; output_tokens: number };

// SPEC 7-1: 모든 글에 공통으로 적용하는 규칙 (바뀌지 않는 부분이라 캐시됨)
const RULES = `너는 국어·독서 학원 원장의 네이버 블로그 글을 대신 써주는 작가다.
목표는 '나를 판다'가 아니라, 학부모가 이 원장을 알게 되고 자연스럽게 문의하게 만드는 글이다.

[반드시 지킬 것]
- 원장의 답변·메모와 아래 [참고 지식]에 있는 사실·수치·사례만 쓴다. 그 밖의 경력, 숫자, 학생 사례, 성과를 지어내지 않는다.
- 답변이 짧으면 글을 짧게 쓴다. 빈 곳을 일반론으로 채우지 않는다.
- 학생 실명·학교명·후기 작성자 아이디 등 개인정보를 쓰지 않는다.
- "최고", "1등", "100% 보장", "무조건" 같은 과장·보장 표현을 쓰지 않는다. 학부모 후기를 인용할 때도 이런 표현은 빼고 옮긴다.
- 첫 문단은 답변·메모 속 구체적인 장면으로 시작한다.
- 2~3문장마다 줄을 바꾼다(빈 줄로 문단 구분). 분량은 공백 포함 1,500~2,500자.
- 마크다운 기호(#, **, - 목록)를 쓰지 않는다. 네이버 블로그에 그대로 붙여 넣을 평문으로 쓴다.
- 사진이 들어가면 좋을 자리에 [[PHOTO: 찍을 장면 설명]]을 2~3개, 각각 한 줄을 차지하게 넣는다.
- 원장의 신념 한 문장을 본문 중간에 한 번 넣고, 그 문장을 highlight로도 돌려준다.
- 마지막은 다음 편(또는 다음 글) 예고 한 줄 + 문의 채널로 편하게 묻도록 안내한다. 판매 톤 금지, "궁금한 점 편하게" 톤.
- 제목 후보는 3개. 네이버 검색에 걸리도록 지역·학년·고민 키워드를 자연스럽게 넣는다(지역 정보가 있을 때만).`;

let knowledgeCache: string | null = null;
async function knowledge() {
  if (knowledgeCache === null || process.env.NODE_ENV !== "production") {
    try {
      knowledgeCache = await fs.readFile(path.join(process.cwd(), "knowledge", "academy.md"), "utf8");
    } catch {
      knowledgeCache = "";
    }
  }
  return knowledgeCache;
}

export const hasApiKey = () => !!process.env.ANTHROPIC_API_KEY;

export class GenerateError extends Error {}

export async function generatePost(opts: {
  profile: AcademyProfile;
  answers: Record<string, unknown>;
  task: string; // 이번 글에 대한 지시 (편 정보 또는 연재 소재)
  recent: Pick<Post, "titles" | "body">[];
}): Promise<Generated> {
  if (!hasApiKey()) throw new GenerateError("ANTHROPIC_API_KEY가 .env.local에 없어요.");

  const p = opts.profile;
  const system = `${RULES}

[참고 지식 — 학원 홈페이지에서 옮긴 사실]
${await knowledge()}`;

  const recent = opts.recent.slice(0, 10).map((r, i) =>
    `${i + 1}. ${r.titles[0] ?? ""} / 첫 문단: ${r.body.split("\n").find((l) => l.trim())?.slice(0, 120) ?? ""}`).join("\n");

  const user = `[화자와 말투]
- 화자는 ${p.speaker}(${p.director_name || "원장"})이며 1인칭으로 쓴다. 말투는 ${p.tone}.
- 문의 채널: ${p.contact_channel}${p.contact_detail ? ` (${p.contact_detail})` : ""}

[학원 정보]
${JSON.stringify(p, null, 2)}

[원장 인터뷰 답변]
${JSON.stringify(opts.answers, null, 2)}

[최근에 쓴 글 — 주제와 첫 문장이 겹치지 않게]
${recent || "(없음)"}

[이번 글]
${opts.task}`;

  const client = new Anthropic();
  let res;
  try {
    res = await client.beta.messages.parse({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(PostSchema) },
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: user }],
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new GenerateError("API 키가 올바르지 않아요. .env.local의 ANTHROPIC_API_KEY를 확인해 주세요.");
    if (e instanceof Anthropic.RateLimitError) throw new GenerateError("요청이 많아 잠시 막혔어요. 1~2분 뒤 다시 시도해 주세요.");
    if (e instanceof Anthropic.APIConnectionError) throw new GenerateError("인터넷 연결을 확인해 주세요.");
    if (e instanceof Anthropic.APIError) throw new GenerateError(`글 생성 중 오류가 났어요 (${e.status}). 잠시 뒤 다시 시도해 주세요.`);
    throw e;
  }

  if (res.stop_reason === "refusal") throw new GenerateError("이번 내용으로는 글을 만들지 못했어요. 답변을 조금 바꿔 다시 시도해 주세요.");
  if (res.stop_reason === "max_tokens") throw new GenerateError("글이 너무 길어져 중간에 끊겼어요. 다시 시도해 주세요.");
  const out = res.parsed_output;
  if (!out) throw new GenerateError("결과를 읽지 못했어요. 다시 시도해 주세요.");

  return {
    titles: out.titles.slice(0, 3),
    body: out.body.trim(),
    highlight: out.highlight.trim(),
    input_tokens: res.usage.input_tokens + (res.usage.cache_read_input_tokens ?? 0) + (res.usage.cache_creation_input_tokens ?? 0),
    output_tokens: res.usage.output_tokens,
  };
}
