import { createHash } from "node:crypto";
import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const req = (name) => { const value = process.env[name]; if (!value) throw new Error(`Missing ${name}`); return value; };
const makeAccount = (name) => { const raw = req(name); return createAccount(raw.startsWith("0x") ? raw : `0x${raw}`); };
const address = req("CONTRACT_ADDRESS");
const serviceId = req("SERVICE_ID");
const outgoingAccount = makeAccount("OUTGOING_KEY");
const incomingAccount = makeAccount("CONTROLLER_KEY");
const outgoing = createClient({ chain: studionet, account: outgoingAccount });
const incoming = createClient({ chain: studionet, account: incomingAccount });
const suffix = Date.now().toString(36);
const payload = createHash("sha256").update(`relayseal-${serviceId}-${suffix}`).digest("hex");
const altPayload = createHash("sha256").update(`relayseal-alt-${serviceId}-${suffix}`).digest("hex");
const records = [];
const write = async (label, client, method, args) => {
  const hash = await client.writeContract({ address, functionName: method, args, value: 0n });
  process.stdout.write(`${label}: ${hash}\n`);
  const receipt = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, interval: 2000, retries: 180, fullTransaction: false });
  records.push({ label, hash, status: receipt.statusName });
  return hash;
};
const read = async (method, args) => JSON.parse(await outgoing.readContract({ address, functionName: method, args }));

const operationId = `op-${suffix}`;
await write("unique operation", outgoing, "perform_guarded_operation", [operationId, serviceId, payload]);
const receipt = await read("get_operation_receipt", [operationId]);
if (!receipt.exists) throw new Error(`unique operation did not record: ${JSON.stringify(receipt)}`);

await write("operation id replay", outgoing, "perform_guarded_operation", [operationId, serviceId, altPayload]);
if ((await read("get_operation_receipt", [operationId])).receipt !== receipt.receipt) throw new Error("ID replay changed receipt");

await write("payload replay", outgoing, "perform_guarded_operation", [`payload-replay-${suffix}`, serviceId, payload]);
if ((await read("get_operation_receipt", [`payload-replay-${suffix}`])).exists) throw new Error("payload replay created receipt");

await write("inactive incoming", incoming, "perform_guarded_operation", [`inactive-${suffix}`, serviceId, createHash("sha256").update(`inactive-${suffix}`).digest("hex")]);
if ((await read("get_operation_receipt", [`inactive-${suffix}`])).exists) throw new Error("inactive incoming created receipt");

const service = await read("get_service", [serviceId]);
if (service.active_operator.toLowerCase() !== outgoingAccount.address.toLowerCase() || service.revision !== 1) throw new Error(`authority changed: ${JSON.stringify(service)}`);
process.stdout.write(`${JSON.stringify({ serviceId, operationId, payload, canonicalReceipt: receipt, service, transactions: records }, null, 2)}\n`);
