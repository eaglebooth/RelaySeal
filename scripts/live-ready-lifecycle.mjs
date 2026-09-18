import { createHash } from "node:crypto";
import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};
const account = (name) => {
  const raw = required(name);
  return createAccount(raw.startsWith("0x") ? raw : `0x${raw}`);
};

const address = required("CONTRACT_ADDRESS");
const controller = account("CONTROLLER_KEY");
const outgoing = account("OUTGOING_KEY");
const controllerClient = createClient({ chain: studionet, account: controller });
const outgoingClient = createClient({ chain: studionet, account: outgoing });
const commit = process.env.FIXTURE_COMMIT || "de0ffa7d486e90ace7a2714e9813ea26878dee40";
const url = `https://raw.githubusercontent.com/eaglebooth/RelaySeal/${commit}/fixtures/handover-ready.md`;
const run = Date.now().toString(36);
const serviceId = `ready-service-${run}`;
const policyId = `ready-policy-${run}`;
const handoverId = `ready-handover-${run}`;
const output = {
  contract: address,
  fixture: { commit, url },
  actors: { controllerAndIncoming: controller.address, outgoing: outgoing.address },
  ids: { serviceId, policyId, handoverId },
  transactions: [],
  assertions: [],
};

const readJson = async (method, args = []) => JSON.parse(await controllerClient.readContract({ address, functionName: method, args }));
const assert = (condition, label, details = {}) => {
  output.assertions.push({ label, pass: Boolean(condition), details });
  if (!condition) throw new Error(`${label}: ${JSON.stringify(details)}`);
};
const write = async (label, client, method, args, expected) => {
  const hash = await client.writeContract({ address, functionName: method, args, value: 0n });
  process.stdout.write(`${label}: ${hash}\n`);
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    interval: 2000,
    retries: 300,
    fullTransaction: false,
  });
  const tx = await client.getTransaction({ hash });
  output.transactions.push({ label, hash, status: tx.statusName || receipt.statusName, expected });
  return hash;
};

const response = await fetch(url);
if (!response.ok) throw new Error(`Fixture fetch failed: ${response.status}`);
const fixtureBytes = new Uint8Array(await response.arrayBuffer());
const fixtureDigest = createHash("sha256").update(fixtureBytes).digest("hex");
output.fixture.sha256 = fixtureDigest;
output.fixture.bytes = fixtureBytes.length;

await write("register service", controllerClient, "register_service", [serviceId, outgoing.address, "eaglebooth/RelaySeal"], "SUCCESS");
await write("create policy", controllerClient, "create_policy", [
  policyId,
  serviceId,
  controller.address,
  1n,
  "Require deployment incidents risks rollback actions owners deadlines and incoming acknowledgement scope.",
], "SUCCESS");
let policy = await readJson("get_policy", [policyId]);
assert(policy.exists && typeof policy.digest === "string" && policy.digest.length === 64, "policy created with canonical digest", policy);

await write("outgoing approves policy", outgoingClient, "approve_policy", [policyId, policy.digest], "SUCCESS");
await write("incoming approves policy", controllerClient, "approve_policy", [policyId, policy.digest], "SUCCESS");
policy = await readJson("get_policy", [policyId]);
assert(policy.sealed && policy.outgoing_approved && policy.incoming_approved, "policy sealed by both exact-digest approvals", policy);

await write("submit READY evidence", outgoingClient, "submit_handover", [
  handoverId,
  policyId,
  url,
  fixtureDigest,
  BigInt(fixtureBytes.length),
  `ready-nonce-${run}`,
], "SUCCESS");
await write("assess READY evidence", controllerClient, "assess_handover", [handoverId], "SUCCESS_READY");
let handover = await readJson("get_handover", [handoverId]);
assert(handover.verdict === "READY" && handover.status === "AWAITING_ACCEPTANCE" && !handover.consumed, "assessment reaches READY/AWAITING_ACCEPTANCE", handover);

await write("outgoing cannot accept", outgoingClient, "accept_handover", [handoverId, handover.digest], "ROLLBACK_EXPECTED");
let afterWrongActor = await readJson("get_handover", [handoverId]);
assert(afterWrongActor.status === "AWAITING_ACCEPTANCE" && !afterWrongActor.incoming_accepted, "wrong actor cannot mutate acceptance", afterWrongActor);

await write("incoming accepts exact handover digest", controllerClient, "accept_handover", [handoverId, handover.digest], "SUCCESS");
handover = await readJson("get_handover", [handoverId]);
assert(handover.status === "ACCEPTED" && handover.incoming_accepted && !handover.consumed, "incoming acceptance recorded", handover);

await write("controller activates handover", controllerClient, "activate_handover", [handoverId], "SUCCESS");
handover = await readJson("get_handover", [handoverId]);
let service = await readJson("get_service", [serviceId]);
assert(handover.status === "ACTIVATED" && handover.consumed, "handover consumed exactly once", handover);
assert(service.active_operator.toLowerCase() === controller.address.toLowerCase() && service.revision === 2, "authority moved to incoming at revision 2", service);

const oldOperationId = `old-op-${run}`;
await write("old operator blocked after activation", outgoingClient, "perform_guarded_operation", [oldOperationId, serviceId, "a".repeat(64)], "ROLLBACK_EXPECTED");
assert(!(await readJson("get_operation_receipt", [oldOperationId])).exists, "old operator creates no receipt");

const newOperationId = `new-op-${run}`;
await write("new operator succeeds after activation", controllerClient, "perform_guarded_operation", [newOperationId, serviceId, "b".repeat(64)], "SUCCESS");
const receipt = await readJson("get_operation_receipt", [newOperationId]);
assert(receipt.exists && typeof receipt.receipt === "string" && receipt.receipt.length === 64, "new authority receipt is canonical", receipt);

await write("handover cannot activate twice", controllerClient, "activate_handover", [handoverId], "ROLLBACK_EXPECTED");
service = await readJson("get_service", [serviceId]);
handover = await readJson("get_handover", [handoverId]);
assert(service.revision === 2 && handover.consumed && handover.status === "ACTIVATED", "replay leaves finalized state unchanged", { service, handover });

output.final = { policy, handover, service, operationReceipt: receipt, stats: await readJson("get_stats") };
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
