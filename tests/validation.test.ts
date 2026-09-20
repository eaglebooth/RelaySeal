import assert from "node:assert/strict";
import test from "node:test";

import { validateField, validateValues } from "../lib/validation.ts";
import { agreedExecution, finalizedExecutionError } from "../lib/transaction.ts";

test("accepts canonical controller, repository and digest values", () => {
  assert.equal(validateField("controller", `0x${"a".repeat(40)}`), "");
  assert.equal(validateField("repository", "eaglebooth/relayseal"), "");
  assert.equal(validateField("evidence_sha256", "b".repeat(64)), "");
});

test("rejects the reviewer-reported malformed values before signing", () => {
  assert.match(validateField("controller", "0x1234"), /20-byte/);
  assert.match(validateField("repository", "github.com/org/repo"), /org\/repo/);
  assert.match(validateField("evidence_sha256", "0x1234"), /64 hexadecimal/);
  assert.match(validateField("evidence_bytes", "0"), /1 to 20,000/);
  assert.match(validateField("evidence_bytes", "20001"), /1 to 20,000/);
});

test("requires a commit-pinned raw markdown URL", () => {
  assert.match(validateField("evidence_url", "https://github.com/eaglebooth/relayseal/blob/main/file.md"), /commit-pinned/);
  assert.equal(validateField("evidence_url", `https://raw.githubusercontent.com/eaglebooth/relayseal/${"c".repeat(40)}/file.md`), "");
});

test("returns per-field errors for forms", () => {
  const errors = validateValues([{ key: "service_id" }, { key: "active_operator" }], { service_id: "", active_operator: "bad" });
  assert.deepEqual(Object.keys(errors).sort(), ["active_operator", "service_id"]);
});

test("does not misclassify a finalized receipt with omitted result metadata", () => {
  assert.equal(finalizedExecutionError(undefined), "");
  assert.equal(finalizedExecutionError("FINISHED_WITH_RETURN"), "");
  assert.match(finalizedExecutionError("FINISHED_WITH_ERROR"), /without successful return/);
});

test("uses agreed GenVM validator execution as the final source of truth", () => {
  assert.equal(agreedExecution([{ vote: "agree", execution_result: "SUCCESS" }]), "SUCCESS");
  assert.equal(agreedExecution([{ vote: "idle", execution_result: "ERROR" }, { vote: "agree", execution_result: "ERROR" }]), "ERROR");
  assert.equal(agreedExecution([]), "UNKNOWN");
});
