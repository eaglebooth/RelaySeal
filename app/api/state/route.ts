import { NextRequest, NextResponse } from "next/server";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const allowed = new Set(["get_contract_version", "get_service", "get_policy", "get_handover", "get_operation_receipt", "get_stats"]);

export async function GET(request: NextRequest) {
  const method = request.nextUrl.searchParams.get("method") || "get_stats";
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
  if (!allowed.has(method)) return NextResponse.json({ success: false, error: "Unsupported read." }, { status: 400 });
  if (!/^0x[0-9a-fA-F]{40}$/.test(address) || /^0x0{40}$/i.test(address)) return NextResponse.json({ success: false, error: "Contract not configured." }, { status: 503 });
  try {
    const chain = { ...studionet, rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio.genlayer.com/api"] } } };
    const client = createClient({ chain });
    const keys: Record<string, string[]> = {
      get_service: ["controller", "service_id"],
      get_policy: ["controller", "service_id", "policy_id"],
      get_handover: ["controller", "service_id", "policy_id", "handover_id"],
      get_operation_receipt: ["controller", "service_id", "operation_id"],
    };
    const args = (keys[method] || []).map((key) => request.nextUrl.searchParams.get(key) || "");
    const data = await client.readContract({ address: address as `0x${string}`, functionName: method, args });
    return NextResponse.json({ success: true, data });
  } catch { return NextResponse.json({ success: false, error: "Studionet read failed." }, { status: 502 }); }
}
