import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};
const raw = required("CONTROLLER_KEY");
const account = createAccount(raw.startsWith("0x") ? raw : `0x${raw}`);
const address = required("CONTRACT_ADDRESS");
const run = required("RUN_SUFFIX");
const client = createClient({ chain: studionet, account });
const serviceId = `ready-service-${run}`;
const handoverId = `ready-handover-${run}`;
const operationId = `new-op-${run}`;
const read = async (method, args) => JSON.parse(await client.readContract({ address, functionName: method, args }));

const before = {
  service: await read("get_service", [serviceId]),
  handover: await read("get_handover", [handoverId]),
  operationReceipt: await read("get_operation_receipt", [operationId]),
};
if (before.service.active_operator.toLowerCase() !== account.address.toLowerCase() || before.service.revision !== 2) throw new Error(`authority transition missing: ${JSON.stringify(before.service)}`);
if (before.handover.status !== "ACTIVATED" || !before.handover.consumed) throw new Error(`handover not finalized: ${JSON.stringify(before.handover)}`);
if (!before.operationReceipt.exists || before.operationReceipt.receipt.length !== 64) throw new Error(`new operator receipt missing: ${JSON.stringify(before.operationReceipt)}`);

const hash = await client.writeContract({ address, functionName: "activate_handover", args: [handoverId], value: 0n });
process.stdout.write(`handover cannot activate twice: ${hash}\n`);
await client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, interval: 2000, retries: 300, fullTransaction: false });

const after = {
  service: await read("get_service", [serviceId]),
  handover: await read("get_handover", [handoverId]),
  operationReceipt: await read("get_operation_receipt", [operationId]),
  stats: await read("get_stats", []),
};
if (after.service.revision !== 2 || after.service.active_operator.toLowerCase() !== account.address.toLowerCase()) throw new Error(`activation replay mutated service: ${JSON.stringify(after.service)}`);
if (!after.handover.consumed || after.handover.status !== "ACTIVATED") throw new Error(`activation replay mutated handover: ${JSON.stringify(after.handover)}`);
if (after.operationReceipt.receipt !== before.operationReceipt.receipt) throw new Error("activation replay changed operation receipt");

process.stdout.write(`${JSON.stringify({ run, serviceId, handoverId, operationId, replayTransaction: hash, before, after }, null, 2)}\n`);
