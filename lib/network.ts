import { studionet } from "genlayer-js/chains";

const rpcUrl = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio.genlayer.com/api";
export const GENLAYER_CHAIN = { ...studionet, rpcUrls: { default: { http: [rpcUrl] } } };
export const WALLET_NETWORK = {
  chainId: "0xf22f",
  chainName: "GenLayer Studionet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: [rpcUrl],
  blockExplorerUrls: ["https://genlayer-explorer.vercel.app/"],
};
