import { hasApiKey } from "@/lib/generate";

export default function ApiKeyNotice() {
  if (hasApiKey()) return null;
  return (
    <p className="mb-6 rounded-lg border border-warn/40 bg-red-50 px-4 py-3 text-sm leading-6 text-warn">
      아직 글을 만들 수 없어요. <code>app/.env.local</code> 파일에 <code>ANTHROPIC_API_KEY</code>를 넣고 앱을 다시 켜 주세요.
    </p>
  );
}
