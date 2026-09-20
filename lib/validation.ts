const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const DIGEST = /^[0-9a-fA-F]{64}$/;
const TOKEN = /^[A-Za-z0-9._-]{3,96}$/;
const REPOSITORY = /^[A-Za-z0-9._-]{1,100}\/[A-Za-z0-9._-]{1,100}$/;

export function validateField(key: string, value: string): string {
  const text = value.trim();
  if (!text) return "Required.";
  if (["controller", "active_operator", "incoming_operator"].includes(key) && !ADDRESS.test(text)) return "Use a 20-byte 0x address.";
  if (["service_id", "policy_id", "handover_id", "operation_id", "nonce"].includes(key) && !TOKEN.test(text)) return "Use 3–96 letters, digits, dot, dash or underscore.";
  if (["repository", "corroboration_repository"].includes(key) && !REPOSITORY.test(text)) return "Use the exact org/repo format.";
  if (["expected_digest", "expected_handover_digest", "evidence_sha256", "payload_digest"].includes(key) && !DIGEST.test(text)) return "Use exactly 64 hexadecimal characters (no 0x).";
  if (["revision", "evidence_bytes"].includes(key)) {
    const number = Number(text);
    if (!Number.isSafeInteger(number) || number <= 0 || (key === "evidence_bytes" && number > 20_000)) return key === "evidence_bytes" ? "Use an integer from 1 to 20,000." : "Use a positive integer.";
  }
  if (key === "requirements" && (text.replace(/\s+/g, " ").length < 40 || text.length > 1500)) return "Use 40–1,500 characters.";
  if (key === "evidence_url") {
    try {
      const url = new URL(text);
      const parts = url.pathname.split("/").filter(Boolean);
      if (url.protocol !== "https:" || url.hostname !== "raw.githubusercontent.com" || parts.length < 4 || !/^[0-9a-fA-F]{40}$/.test(parts[2]) || !parts.at(-1)?.toLowerCase().endsWith(".md")) throw new Error();
    } catch { return "Use a commit-pinned raw.githubusercontent.com Markdown URL."; }
  }
  return "";
}

export function validateValues(fields: { key: string }[], values: Record<string, string>) {
  return Object.fromEntries(fields.map(({ key }) => [key, validateField(key, values[key] || "")]).filter(([, error]) => error));
}
