import { createHash } from "node:crypto";
import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const req = (name) => { const value = process.env[name]; if (!value) throw new Error(`Missing ${name}`); return value; };
const account = (name) => { const raw = req(name); return createAccount(raw.startsWith("0x") ? raw : `0x${raw}`); };
const address = req("CONTRACT_ADDRESS");
const policyId = req("POLICY_ID");
const outgoing = createClient({ chain: studionet, account: account("OUTGOING_KEY") });
const suffix = Date.now().toString(36);
const url = "https://raw.githubusercontent.com/eaglebooth/ForkRight/e3e09304f38ab42ca31478cb601a99238f813811/docs/LIVE_V2_E2E_EVIDENCE.md";
const response = await fetch(url);
if (!response.ok) throw new Error(`Fixture fetch failed: ${response.status}`);
const bytes = new Uint8Array(await response.arrayBuffer());
const digest = createHash("sha256").update(bytes).digest("hex");
const transactions = [];
const write = async (label, method, args) => {
  const hash = await outgoing.writeContract({ address, functionName: method, args, value: 0n });
  process.stdout.write(`${label}: ${hash}\n`);
  await outgoing.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, interval: 2000, retries: 300, fullTransaction: false });
  transactions.push({ label, hash });
  return hash;
};
const read = async (method, args) => JSON.parse(await outgoing.readContract({ address, functionName: method, args }));

const mismatchId = `digest-${suffix}`;
const mismatchNonce = `digest-nonce-${suffix}`;
await write("submit mismatched digest", "submit_handover", [mismatchId, policyId, url, "0".repeat(64), BigInt(bytes.length), mismatchNonce]);
await write("assess mismatched digest", "assess_handover", [mismatchId]);
const mismatch = await read("get_handover", [mismatchId]);
if (mismatch.status !== "REJECTED" || mismatch.verdict !== "UNAVAILABLE" || mismatch.consumed) throw new Error(`digest mismatch invariant failed: ${JSON.stringify(mismatch)}`);

const replayId = `nonce-replay-${suffix}`;
await write("replay nonce", "submit_handover", [replayId, policyId, url, digest, BigInt(bytes.length), mismatchNonce]);
if ((await read("get_handover", [replayId])).exists) throw new Error("nonce replay created handover");

const semanticId = `semantic-${suffix}`;
await write("submit exact public evidence", "submit_handover", [semanticId, policyId, url, digest, BigInt(bytes.length), `semantic-nonce-${suffix}`]);
await write("assess semantic evidence", "assess_handover", [semanticId]);
const semantic = await read("get_handover", [semanticId]);
if (semantic.verdict === "READY" || semantic.status !== "REJECTED" || semantic.consumed) throw new Error(`semantic failure invariant failed: ${JSON.stringify(semantic)}`);

process.stdout.write(`${JSON.stringify({ url, digest, bytes: bytes.length, mismatch, semantic, transactions }, null, 2)}\n`);
