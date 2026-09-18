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
const run = Date.now().toString(36);
const serviceId = `relay-${run}`;
const policyId = `policy-${run}`;
const output = { contract: address, controller: controller.address, outgoing: outgoing.address, serviceId, policyId, transactions: [], assertions: [] };

const readJson = async (method, args = []) => JSON.parse(await controllerClient.readContract({ address, functionName: method, args }));

const execute = async (label, client, method, args, expectSuccess) => {
  const hash = await client.writeContract({ address, functionName: method, args, value: 0n });
  process.stdout.write(`${label}: ${hash}\n`);
  const receipt = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, interval: 2000, retries: 180, fullTransaction: false });
  const tx = await client.getTransaction({ hash });
  const execution = tx.txExecutionResultName || receipt.txExecutionResultName || "NOT_EXPOSED";
  const returned = tx.txDataDecoded ?? receipt.txDataDecoded ?? "";
  const successful = execution === "SUCCESS" || execution === "FINISHED_WITH_RETURN" || (execution === "NOT_EXPOSED" && !String(returned).includes("ERROR"));
  output.transactions.push({ label, hash, status: tx.statusName || receipt.statusName, execution, returned, expected: expectSuccess ? "SUCCESS" : "REJECTION_STATE_VERIFIED" });
  process.stdout.write(`${label}: ${tx.statusName || receipt.statusName} / ${execution}\n`);
  if (expectSuccess && !successful) throw new Error(`${label}: expected success, got ${JSON.stringify({ execution, returned })}`);
  return { hash, returned };
};

const assert = (condition, label, details = {}) => {
  output.assertions.push({ label, pass: Boolean(condition), details });
  if (!condition) throw new Error(`${label}: ${JSON.stringify(details)}`);
};

await execute("register service", controllerClient, "register_service", [serviceId, outgoing.address, "eaglebooth/ForkRight"], true);
let service = await readJson("get_service", [serviceId]);
assert(service.controller.toLowerCase() === controller.address.toLowerCase(), "controller bound to sender", service);
assert(service.active_operator.toLowerCase() === outgoing.address.toLowerCase(), "outgoing is active", service);

await execute("unauthorized policy creation", outgoingClient, "create_policy", [`bad-${run}`, serviceId, controller.address, 1n, "Require deployment incidents risks rollback actions owners and deadlines."], false);
assert(!(await readJson("get_policy", [`bad-${run}`])).exists, "failed policy did not mutate state");

await execute("create policy", controllerClient, "create_policy", [policyId, serviceId, controller.address, 1n, "Require deployment incidents risks rollback actions owners deadlines and acknowledgement scope."], true);
const policyAfterCreate = await readJson("get_policy", [policyId]);
const digest = policyAfterCreate.digest;
assert(typeof digest === "string" && digest.length === 64, "policy digest recorded", policyAfterCreate);

await execute("wrong digest approval", controllerClient, "approve_policy", [policyId, "f".repeat(64)], false);
assert(!(await readJson("get_policy", [policyId])).incoming_approved, "wrong digest cannot approve policy");

await execute("outgoing approval", outgoingClient, "approve_policy", [policyId, digest], true);
let policy = await readJson("get_policy", [policyId]);
assert(policy.outgoing_approved && !policy.incoming_approved && !policy.sealed, "single approval cannot seal", policy);

await execute("incoming approval", controllerClient, "approve_policy", [policyId, digest], true);
policy = await readJson("get_policy", [policyId]);
assert(policy.outgoing_approved && policy.incoming_approved && policy.sealed, "dual exact-digest approval seals policy", policy);

await execute("duplicate approval", controllerClient, "approve_policy", [policyId, digest], false);
policy = await readJson("get_policy", [policyId]);
assert(policy.sealed, "duplicate rejection preserves sealed policy", policy);

await execute("non-operator evidence submission", controllerClient, "submit_handover", [`unauth-${run}`, policyId, "https://raw.githubusercontent.com/eaglebooth/ForkRight/e3e09304f38ab42ca31478cb601a99238f813811/README.md", "0".repeat(64), 1n, `unauth-${run}`], false);
assert(!(await readJson("get_handover", [`unauth-${run}`])).exists, "unauthorized evidence leaves no handover");

await execute("invalid evidence origin", outgoingClient, "submit_handover", [`origin-${run}`, policyId, "https://github.com/eaglebooth/ForkRight/blob/main/README.md", "0".repeat(64), 1n, `origin-${run}`], false);
assert(!(await readJson("get_handover", [`origin-${run}`])).exists, "invalid origin leaves no handover");

const payload = "1".repeat(64);
await execute("outgoing guarded operation", outgoingClient, "perform_guarded_operation", [`op-${run}`, serviceId, payload], true);
assert((await readJson("get_operation_receipt", [`op-${run}`])).exists, "active operator operation recorded");

await execute("operation id replay", outgoingClient, "perform_guarded_operation", [`op-${run}`, serviceId, "2".repeat(64)], false);
await execute("payload replay", outgoingClient, "perform_guarded_operation", [`op2-${run}`, serviceId, payload], false);
await execute("inactive incoming operation", controllerClient, "perform_guarded_operation", [`op3-${run}`, serviceId, "3".repeat(64)], false);

service = await readJson("get_service", [serviceId]);
assert(service.active_operator.toLowerCase() === outgoing.address.toLowerCase() && service.revision === 1, "failure paths preserve authority and revision", service);
output.stats = await readJson("get_stats");
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
