/**
 * Writes the privacy policy from shared/privacy.ts to legal/privacy.md and, if a path is given,
 * into an existing privacy.html (keeps everything up to the <h1>, replaces the rest of the container).
 *
 *   npx tsx scripts/export-privacy.ts [path/to/privacy.html]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  PRIVACY_SECTIONS,
  PRIVACY_UPDATED,
  type PrivacySection,
} from "../shared/privacy";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function toMarkdown(): string {
  const parts = ["# Datenschutzerklärung", ""];
  for (const section of PRIVACY_SECTIONS) {
    parts.push(`## ${section.title}`, "");
    for (const paragraph of section.text ?? []) parts.push(paragraph, "");
    for (const bullet of section.bullets ?? []) parts.push(`- ${bullet}`);
    if (section.bullets?.length) parts.push("");
  }
  parts.push(`Stand: ${PRIVACY_UPDATED}`, "");
  return parts.join("\n");
}

function sectionHtml(section: PrivacySection): string {
  const lines = [`        <h2>${escapeHtml(section.title)}</h2>`];
  for (const paragraph of section.text ?? [])
    lines.push(`        <p>${escapeHtml(paragraph)}</p>`);
  if (section.bullets?.length) {
    lines.push("        <ul>");
    for (const bullet of section.bullets)
      lines.push(`            <li>${escapeHtml(bullet)}</li>`);
    lines.push("        </ul>");
  }
  return lines.join("\n");
}

function toHtml(existing: string): string {
  const marker = "<h1>Datenschutzerklärung</h1>";
  const at = existing.indexOf(marker);
  if (at < 0) throw new Error(`"${marker}" not found in the html file`);
  const head = existing.slice(0, at + marker.length);
  const body = PRIVACY_SECTIONS.map(sectionHtml).join("\n\n");
  return `${head}

${body}

        <hr style="border: none; border-top: 1px solid #374151; margin: 30px 0;">
        <p><em>Stand: ${PRIVACY_UPDATED}</em></p>
    </div>
</body>
</html>
`;
}

writeFileSync(join(__dirname, "..", "legal", "privacy.md"), toMarkdown());
const htmlPath = process.argv[2];
if (htmlPath) {
  writeFileSync(htmlPath, toHtml(readFileSync(htmlPath, "utf8")));
}
console.log("privacy exported", htmlPath ?? "(md only)");
