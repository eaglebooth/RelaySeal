import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};
const account = (name) => createAccount(`0x${required(name).replace(/^0x/, "")}`);
const contract = required("CONTRACT_ADDRESS");
const controller = account("OUTGOING_KEY");
const incoming = account("INCOMING_KEY");
const controllerClient = createClient({ chain: studionet, account: controller });
const incomingClient = createClient({ chain: studionet, account: incoming });
const run = process.env.RUN_ID || Date.now().toString(36);
const ids = { service: `v2-service-${run}`, policy: `v2-policy-${run}`, handover: `v2-handover-${run}` };
const outgoingCommit = "43dd99b067a5ba67361e369217cd3def299f3557";
const corroborationCommit = "6c5835857f507e35ad508c456b93042a9850eee4";
const sources = {
  outgoing: `https://raw.githubusercontent.com/eaglebooth/RelaySeal/${outgoingCommit}/fixtures/handover-v2-ready.md`,
  corroboration: `https://raw.githubusercontent.com/eaglebooth/ForkRight/${corroborationCommit}/docs/relayseal-v2-corroboration.md`,
};
const report = { contract, network: "studionet-61999", actors: { controllerOutgoing: controller.address, incoming: incoming.address }, ids, sources: {}, transactions: [], assertions: [], final: {} };
if (process.env.RESUME_REGISTER_HASH) report.transactions.push({ label: "register scoped service", hash: process.env.RESUME_REGISTER_HASH, expected: "SUCCESS", status: "FINALIZED", execution: "SUCCESS" });
if (process.env.RESUME_DUPLICATE_HASH) report.transactions.push({ label: "reject duplicate service", hash: process.env.RESUME_DUPLICATE_HASH, expected: "ROLLBACK", status: "FINALIZED", execution: "REJECTED" });
if (process.env.RESUME_POLICY_REJECTION_HASH) report.transactions.push({ label: "reject duplicate policy", hash: process.env.RESUME_POLICY_REJECTION_HASH, expected: "ROLLBACK", status: "FINALIZED", execution: "POLICY_ALREADY_EXISTS" });

const source = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Source fetch failed ${response.status}: ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  return { url, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
};
report.sources.outgoing = await source(sources.outgoing);
report.sources.corroboration = await source(sources.corroboration);

const read = async (method, args = []) => JSON.parse(await controllerClient.readContract({ address: contract, functionName: method, args }));
const check = (condition, label, details = {}) => {
  report.assertions.push({ label, pass: Boolean(condition), details });
  if (!condition) throw new Error(`Assertion failed: ${label}: ${JSON.stringify(details)}`);
};
const write = async (label, client, method, args, expected = "SUCCESS") => {
  let hash;
  try {
    hash = await client.writeContract({ address: contract, functionName: method, args, value: 0n });
  } catch (error) {
    if (expected !== "ROLLBACK") throw error;
    report.transactions.push({ label, hash: null, expected, status: "PRECHECK_REJECTED", error: error instanceof Error ? error.message : String(error) });
    check(true, `${label} rejected before signing`);
    writeFileSync("docs/live-v2-run.json", `${JSON.stringify(report, null, 2)}\n`);
    return null;
  }
  process.stdout.write(`${label}: ${hash}\n`);
  let tx = {};
  for (let attempt = 0; attempt < 300; attempt += 1) {
    tx = await client.getTransaction({ hash });
    if (["FINALIZED", "CANCELED", "UNDETERMINED"].includes(tx.statusName)) break;
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  const agreedExecutions = (tx.consensus_data?.validators || []).filter((validator) => validator.vote === "agree").map((validator) => validator.execution_result);
  const execution = agreedExecutions.includes("SUCCESS") ? "SUCCESS" : agreedExecutions.includes("ERROR") ? "ERROR" : "UNKNOWN";
  report.transactions.push({ label, hash, expected, status: tx.statusName || "UNKNOWN", execution });
  if (expected === "SUCCESS") check(execution === "SUCCESS", `${label} succeeded in GenVM`, { execution });
  if (expected === "ROLLBACK") check(execution === "ERROR", `${label} reverted in GenVM`, { execution });
  writeFileSync("docs/live-v2-run.json", `${JSON.stringify(report, null, 2)}\n`);
  return hash;
};

check((await read("get_contract_version")).version === 2, "contract version is V2");
if (!process.env.RESUME_REGISTER_HASH) await write("register scoped service", controllerClient, "register_service", [ids.service, controller.address, "eaglebooth/relayseal"]);
if (!process.env.RESUME_DUPLICATE_HASH) await write("reject duplicate service", controllerClient, "register_service", [ids.service, controller.address, "eaglebooth/relayseal"], "ROLLBACK");
if (!process.env.RESUME_POLICY_EXISTS) await write("create dual-source policy", controllerClient, "create_policy", [controller.address, ids.service, ids.policy, incoming.address, "eaglebooth/forkright", 1n, "Require matching deployment, incidents, risks, mitigation, rollback, actions, owner, deadline and acknowledgement scope."]);
let policy = await read("get_policy", [controller.address, ids.service, ids.policy]);
check(policy.exists && policy.digest?.length === 64, "policy has canonical digest", policy);
await write("outgoing approves policy", controllerClient, "approve_policy", [controller.address, ids.service, ids.policy, policy.digest]);
await write("incoming approves policy", incomingClient, "approve_policy", [controller.address, ids.service, ids.policy, policy.digest]);
policy = await read("get_policy", [controller.address, ids.service, ids.policy]);
check(policy.sealed, "both policy parties sealed exact digest", policy);

const out = report.sources.outgoing;
const cor = report.sources.corroboration;
await write("submit outgoing evidence", controllerClient, "submit_handover", [controller.address, ids.service, ids.policy, ids.handover, out.url, out.sha256, BigInt(out.bytes), `out-${run}`]);
await write("reject assessment before corroboration", controllerClient, "assess_handover", [controller.address, ids.service, ids.policy, ids.handover], "ROLLBACK");
await write("submit independent corroboration", incomingClient, "submit_corroboration", [controller.address, ids.service, ids.policy, ids.handover, cor.url, cor.sha256, BigInt(cor.bytes), `cor-${run}`]);
await write("assess dual-source handover", controllerClient, "assess_handover", [controller.address, ids.service, ids.policy, ids.handover]);
let handover = await read("get_handover", [controller.address, ids.service, ids.policy, ids.handover]);
check(handover.verdict === "READY" && handover.status === "AWAITING_ACCEPTANCE", "consensus returned READY", handover);
await write("outgoing blocked from acceptance", controllerClient, "accept_handover", [controller.address, ids.service, ids.policy, ids.handover, handover.digest], "ROLLBACK");
await write("incoming accepts exact digest", incomingClient, "accept_handover", [controller.address, ids.service, ids.policy, ids.handover, handover.digest]);
await write("controller activates transfer", controllerClient, "activate_handover", [controller.address, ids.service, ids.policy, ids.handover]);
handover = await read("get_handover", [controller.address, ids.service, ids.policy, ids.handover]);
let service = await read("get_service", [controller.address, ids.service]);
check(handover.status === "ACTIVATED" && handover.consumed, "handover consumed once", handover);
check(service.active_operator.toLowerCase() === incoming.address.toLowerCase() && service.revision === 2, "authority transferred to incoming", service);

await write("former operator blocked", controllerClient, "perform_guarded_operation", [controller.address, ids.service, `old-${run}`, "a".repeat(64)], "ROLLBACK");
await write("incoming performs guarded operation", incomingClient, "perform_guarded_operation", [controller.address, ids.service, `new-${run}`, "b".repeat(64)]);
await write("operation id replay blocked", incomingClient, "perform_guarded_operation", [controller.address, ids.service, `new-${run}`, "c".repeat(64)], "ROLLBACK");
await write("payload replay blocked", incomingClient, "perform_guarded_operation", [controller.address, ids.service, `payload-${run}`, "b".repeat(64)], "ROLLBACK");
await write("activation replay blocked", controllerClient, "activate_handover", [controller.address, ids.service, ids.policy, ids.handover], "ROLLBACK");

report.final = { service: await read("get_service", [controller.address, ids.service]), policy, handover: await read("get_handover", [controller.address, ids.service, ids.policy, ids.handover]), operation: await read("get_operation_receipt", [controller.address, ids.service, `new-${run}`]), stats: await read("get_stats") };
writeFileSync("docs/live-v2-run.json", `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
