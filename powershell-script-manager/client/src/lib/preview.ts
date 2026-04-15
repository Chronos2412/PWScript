/** Single-line preview of script content (about 50 characters). */
export function scriptPreview(text: string, max = 50): string {
  const line = text.replace(/\s+/g, " ").trim();
  if (line.length === 0) return "—";
  if (line.length <= max) return line;
  return `${line.slice(0, max)}…`;
}
