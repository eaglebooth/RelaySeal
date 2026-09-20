import { createClient } from "genlayer-js";
import { GENLAYER_CHAIN, WALLET_NETWORK } from "./network";
import { agreedExecution } from "./transaction";

type Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, fn: (accounts: string[]) => void) => void;
  removeListener?: (event: string, fn: (accounts: string[]) => void) => void;
};
declare global { interface Window { ethereum?: Provider } }

export type ChainResult = { success: boolean; data?: unknown; hash?: string; error?: string };
export type TrackedStatus = { phase: string; genlayerTxId?: string; evmTxHash?: string };
type RuntimeClient = {
  connect?: (networkName: "studionet") => Promise<unknown>;
  writeContract: (args: { address: `0x${string}`; functionName: string; args: unknown[]; value: bigint }) => Promise<string>;
  getTransaction: (args: { hash: `0x${string}` }) => Promise<{ statusName?: string; data?: unknown; consensus_data?: { validators?: Array<{ vote?: string; execution_result?: string; genvm_result?: { stderr?: string } }> } }>;
};
export const contractAddress = () => process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
export const configured = () => /^0x[0-9a-fA-F]{40}$/.test(contractAddress()) && !/^0x0{40}$/i.test(contractAddress());
export const explorerTx = (hash: string) => `${process.env.NEXT_PUBLIC_EXPLORER_TX_BASE || "https://genlayer-explorer.vercel.app/transactions/"}${hash}`;

async function ensureNetwork(provider: Provider) {
  const current = String(await provider.request({ method: "eth_chainId" })).toLowerCase();
  if (current === WALLET_NETWORK.chainId) return;
  try { await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: WALLET_NETWORK.chainId }] }); }
  catch (error) {
    if ((error as { code?: number })?.code !== 4902) throw error;
    await provider.request({ method: "wallet_addEthereumChain", params: [WALLET_NETWORK] });
  }
}

export async function connectWallet(): Promise<ChainResult> {
  if (!window.ethereum) return { success: false, error: "Install or unlock an EVM wallet." };
  try {
    await ensureNetwork(window.ethereum);
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
    return accounts[0] ? { success: true, data: accounts[0] } : { success: false, error: "No account selected." };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Wallet connection failed." }; }
}

export async function disconnectWallet() {
  try { await window.ethereum?.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] }); } catch { /* wallet support varies */ }
}

export async function currentWallet() {
  if (!window.ethereum) return "";
  try { return ((await window.ethereum.request({ method: "eth_accounts" })) as string[])[0] || ""; } catch { return ""; }
}

export function watchWallet(fn: (address: string) => void) {
  if (!window.ethereum?.on) return () => undefined;
  const listener = (accounts: string[]) => fn(accounts[0] || "");
  window.ethereum.on("accountsChanged", listener);
  return () => window.ethereum?.removeListener?.("accountsChanged", listener);
}

export async function writeContract(method: string, args: unknown[], onUpdate: (status: TrackedStatus) => void): Promise<ChainResult> {
  if (!configured()) return { success: false, error: "Deploy RelaySeal and configure its address first." };
  if (!window.ethereum) return { success: false, error: "Connect a wallet first." };
  try {
    await ensureNetwork(window.ethereum);
    const account = ((await window.ethereum.request({ method: "eth_requestAccounts" })) as string[])[0] as `0x${string}`;
    const client = createClient({ chain: GENLAYER_CHAIN, provider: window.ethereum, account });
    const runtime = client as unknown as RuntimeClient;
    if (runtime.connect) await runtime.connect("studionet");
    const hash = await runtime.writeContract({ address: contractAddress() as `0x${string}`, functionName: method, args, value: BigInt(0) });
    onUpdate({ phase: "submitted", genlayerTxId: hash });
    let transaction: Awaited<ReturnType<RuntimeClient["getTransaction"]>> | undefined;
    for (let attempt = 0; attempt < 300; attempt += 1) {
      transaction = await runtime.getTransaction({ hash: hash as `0x${string}` });
      const status = transaction.statusName || "PENDING";
      onUpdate({ phase: status.toLowerCase(), genlayerTxId: hash });
      if (["FINALIZED", "CANCELED", "UNDETERMINED"].includes(status)) break;
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    if (!transaction || transaction.statusName !== "FINALIZED") return { success: false, hash, error: "Tracking timed out; the transaction may still finalize. Verify it on the explorer before retrying." };
    const execution = agreedExecution(transaction.consensus_data?.validators);
    if (execution === "ERROR") {
      const stderr = transaction.consensus_data?.validators?.find((validator) => validator.vote === "agree")?.genvm_result?.stderr || "";
      const reason = stderr.match(/Exception: ([^\r\n]+)/)?.[1] || "Contract execution reverted.";
      return { success: false, hash, error: reason };
    }
    if (execution !== "SUCCESS") return { success: false, hash, error: "Finalized, but validator execution metadata is unavailable. Verify the transaction on the explorer." };
    onUpdate({ phase: "finalized", genlayerTxId: hash });
    return { success: true, hash, data: transaction.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transaction tracking failed.";
    return { success: false, error: /timeout|timed out/i.test(message) ? `Tracking timed out; the transaction may still finalize. Verify it on the explorer before retrying. ${message}` : message };
  }
}

export async function readContract(method: string, values: Record<string, string> = {}): Promise<ChainResult> {
  if (!configured()) return { success: false, error: "Contract not configured." };
  try {
    const query = new URLSearchParams({ method });
    Object.entries(values).forEach(([key, value]) => value && query.set(key, value));
    const response = await fetch(`/api/state?${query}`, { cache: "no-store" });
    return await response.json() as ChainResult;
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Read failed." }; }
}
