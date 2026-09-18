import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const req = (name) => { const v = process.env[name]; if (!v) throw new Error(`Missing ${name}`); return v; };
const acct = (name) => { const v = req(name); return createAccount(v.startsWith("0x") ? v : `0x${v}`); };
const address = req("CONTRACT_ADDRESS");
const handoverId = req("HANDOVER_ID");
const incoming = createClient({ chain: studionet, account: acct("INCOMING_KEY") });
const outgoing = createClient({ chain: studionet, account: acct("OUTGOING_KEY") });
const before = JSON.parse(await incoming.readContract({ address, functionName: "get_handover", args: [handoverId] }));
const write = async (label, client, method, args) => {
  const hash = await client.writeContract({ address, functionName: method, args, value: 0n });
  process.stdout.write(`${label}: ${hash}\n`);
  await client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, interval: 2000, retries: 180, fullTransaction: false });
  return { label, hash };
};
const txs = [];
txs.push(await write("outgoing cannot accept", outgoing, "accept_handover", [handoverId, before.digest]));
txs.push(await write("incoming cannot accept rejected", incoming, "accept_handover", [handoverId, before.digest]));
txs.push(await write("controller cannot activate rejected", incoming, "activate_handover", [handoverId]));
const after = JSON.parse(await incoming.readContract({ address, functionName: "get_handover", args: [handoverId] }));
if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error(`rejected transition changed state: ${JSON.stringify({ before, after })}`);
process.stdout.write(`${JSON.stringify({ before, after, transactions: txs }, null, 2)}\n`);
