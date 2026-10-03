import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { readDB } from "@/lib/store";
import { toBlocks } from "@/lib/format";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = (await readDB()).posts.find((p) => p.id === id);
  if (!post) return new Response("Not found", { status: 404 });

  const children: Paragraph[] = [new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(post.titles[0] ?? "")] })];
  post.titles.slice(1).forEach((t) => children.push(new Paragraph({ children: [new TextRun({ text: `제목 후보: ${t}`, color: "5B6472" })] })));
  children.push(new Paragraph(""));

  for (const b of toBlocks(post.body)) {
    if (b.type === "photo") {
      children.push(new Paragraph({ children: [new TextRun({ text: `📷 사진 추천 — ${b.text}`, color: "4F8A6B", bold: true })] }));
    } else {
      const lines = b.text.split("\n");
      children.push(new Paragraph({
        spacing: { after: 240, line: 360 },
        children: lines.map((l, i) => new TextRun({ text: l, break: i ? 1 : 0, bold: !!post.highlight && l.includes(post.highlight) })),
      }));
    }
  }

  const buf = await Packer.toBuffer(new Document({ styles: { default: { document: { run: { font: "맑은 고딕", size: 22 } } } }, sections: [{ children }] }));
  const name = encodeURIComponent(`${(post.titles[0] ?? "글").slice(0, 40)}.docx`);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename*=UTF-8''${name}`,
    },
  });
}
