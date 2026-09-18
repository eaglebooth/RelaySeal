"use client";

import Image from "next/image";
import { ArrowRight, Check, CircleDot, Copy, ExternalLink, FileCheck2, LogOut, Radio, ShieldCheck, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { configured, connectWallet, contractAddress, currentWallet, disconnectWallet, explorerTx, readContract, watchWallet, writeContract } from "@/lib/genlayer";

type Field = { key: string; label: string; placeholder: string; type?: "number" };
type Action = { method: string; eyebrow: string; title: string; actor: string; fields: Field[] };

const actions: Action[] = [
  { method: "register_service", eyebrow: "01 / Establish", title: "Register service", actor: "Service controller", fields: [
    { key: "service_id", label: "Service ID", placeholder: "payments-api" }, { key: "active_operator", label: "Current operator", placeholder: "0x…" }, { key: "repository", label: "Evidence repository", placeholder: "github.com/org/repo" },
  ]},
  { method: "create_policy", eyebrow: "02 / Bind", title: "Draft transfer policy", actor: "Service controller", fields: [
    { key: "policy_id", label: "Policy ID", placeholder: "payments-r7" }, { key: "service_id", label: "Service ID", placeholder: "payments-api" }, { key: "incoming_operator", label: "Incoming operator", placeholder: "0x…" }, { key: "revision", label: "Service revision", placeholder: "1", type: "number" }, { key: "requirements", label: "Required evidence sections", placeholder: "deployment,incidents,risks,rollback,actions,owners,deadlines" },
  ]},
  { method: "approve_policy", eyebrow: "03 / Co-sign", title: "Approve exact policy", actor: "Outgoing + incoming", fields: [
    { key: "policy_id", label: "Policy ID", placeholder: "payments-r7" }, { key: "expected_digest", label: "Policy digest", placeholder: "64 hex characters" },
  ]},
  { method: "submit_handover", eyebrow: "04 / Commit", title: "Submit evidence commitment", actor: "Active outgoing operator", fields: [
    { key: "handover_id", label: "Handover ID", placeholder: "shift-2026-09-18" }, { key: "policy_id", label: "Policy ID", placeholder: "payments-r7" }, { key: "evidence_url", label: "Commit-pinned raw Markdown URL", placeholder: "https://raw.githubusercontent.com/org/repo/<commit>/handover.md" }, { key: "evidence_sha256", label: "SHA-256", placeholder: "64 hex characters" }, { key: "evidence_bytes", label: "Exact byte length", placeholder: "2048", type: "number" }, { key: "nonce", label: "One-time nonce", placeholder: "shift-2026-09-18-a" },
  ]},
  { method: "assess_handover", eyebrow: "05 / Judge", title: "Assess committed evidence", actor: "Any caller · consensus decides", fields: [{ key: "handover_id", label: "Handover ID", placeholder: "shift-2026-09-18" }] },
  { method: "accept_handover", eyebrow: "06 / Acknowledge", title: "Accept exact handover", actor: "Bound incoming operator", fields: [{ key: "handover_id", label: "Handover ID", placeholder: "shift-2026-09-18" }, { key: "expected_handover_digest", label: "Handover digest", placeholder: "64 hex characters" }] },
  { method: "activate_handover", eyebrow: "07 / Transfer", title: "Activate authority", actor: "Service controller", fields: [{ key: "handover_id", label: "Handover ID", placeholder: "shift-2026-09-18" }] },
  { method: "perform_guarded_operation", eyebrow: "08 / Prove", title: "Run guarded operation", actor: "New active operator", fields: [{ key: "operation_id", label: "Operation ID", placeholder: "deploy-2026-09-18" }, { key: "service_id", label: "Service ID", placeholder: "payments-api" }, { key: "payload_digest", label: "Payload digest", placeholder: "64 hex characters" }] },
];

const reads = ["get_service", "get_policy", "get_handover", "get_operation_receipt", "get_stats"];
const short = (v: string) => v ? `${v.slice(0, 8)}…${v.slice(-6)}` : "Connect wallet";

export default function Home() {
  const [wallet, setWallet] = useState("");
  const [active, setActive] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState("IDLE");
  const [message, setMessage] = useState("Choose a protocol step to begin.");
  const [hash, setHash] = useState("");
  const [readMethod, setReadMethod] = useState("get_handover");
  const [readId, setReadId] = useState("");
  const [readback, setReadback] = useState("No canonical record loaded.");
  const action = actions[active];
  const ready = configured();

  useEffect(() => { currentWallet().then(setWallet); return watchWallet(setWallet); }, []);
  const args = useMemo(() => action.fields.map((f) => f.type === "number" ? Number(values[f.key] || 0) : (values[f.key] || "")), [action, values]);

  async function walletClick() {
    if (wallet) { await disconnectWallet(); setWallet(""); return; }
    const result = await connectWallet();
    if (result.success) setWallet(String(result.data));
    else setMessage(result.error || "Wallet connection failed.");
  }

  async function submit() {
    setPhase("AWAITING_SIGNATURE"); setMessage("Confirm the transaction in your wallet."); setHash("");
    const result = await writeContract(action.method, args, (status) => {
      const row = status as unknown as Record<string, unknown>;
      setPhase(String(row.phase || row.statusName || "PROCESSING").toUpperCase());
      const tx = String(row.genlayerTxId || row.evmTxHash || "");
      if (tx) setHash(tx);
      setMessage("Consensus is processing this state transition. Keep this page open until finalization.");
    });
    setPhase(result.success ? "FINALIZED" : "FAILED");
    setMessage(result.success ? "Finalized successfully. Canonical state can now be refreshed." : (result.error || "Transaction failed."));
    if (result.hash) setHash(result.hash);
  }

  async function loadReadback() {
    setReadback("Reading accepted state…");
    const result = await readContract(readMethod, readId);
    setReadback(result.success ? (typeof result.data === "string" ? result.data : JSON.stringify(result.data, null, 2)) : (result.error || "Read failed."));
  }

  return <main>
    <header className="site-header">
      <a className="brand" href="#top"><Image src="/relayseal-logo.png" alt="RelaySeal" width={46} height={46} priority /><span><b>RelaySeal</b><small>Authority-bound handovers</small></span></a>
      <nav><a href="#protocol">Protocol</a><a href="#desk">Handover desk</a><a href="#proof">Trust model</a></nav>
      <button className="wallet" onClick={walletClick}>{wallet ? <LogOut size={16}/> : <Wallet size={16}/>} {short(wallet)}</button>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy"><p className="kicker"><Radio size={14}/> GENLAYER STUDIONET · 61999</p><h1>A handover should transfer <em>context</em> before control.</h1><p className="lede">RelaySeal turns operational evidence into a sender-authorized, consensus-reviewed transfer of responsibility. Markdown explains the shift. On-chain policy decides who may act.</p><div className="hero-actions"><a className="primary" href="#desk">Open handover desk <ArrowRight size={17}/></a><a className="quiet" href="#proof">Inspect the trust model</a></div></div>
      <div className="relay-card"><p>AUTHORITY TRANSFER / LIVE DOSSIER</p><div className="party"><span className="avatar blue">OUT</span><div><small>CURRENT OPERATOR</small><b>Commits operational evidence</b></div></div><div className="rail"><i/><span><ShieldCheck size={20}/> policy + evidence verified</span><i/></div><div className="party"><span className="avatar green">IN</span><div><small>INCOMING OPERATOR</small><b>Acknowledges exact digest</b></div></div><footer><Check size={15}/> Activation requires controller authority</footer></div>
    </section>

    <section className="protocol" id="protocol">
      <div><span>01</span><h3>Bind the parties</h3><p>The controller names the current and incoming operator in an immutable policy digest.</p></div>
      <div><span>02</span><h3>Verify the source</h3><p>Consensus fetches a commit-pinned file and recomputes its bytes and SHA-256.</p></div>
      <div><span>03</span><h3>Transfer on chain</h3><p>Only a READY verdict, incoming acknowledgement and controller activation move authority.</p></div>
    </section>

    <section className="desk" id="desk">
      <div className="desk-head"><div><p className="kicker">OPERATOR WORKSPACE</p><h2>The handover desk</h2></div><div className={`network ${ready ? "ok" : "warn"}`}><CircleDot size={16}/><span>{ready ? "CONTRACT CONFIGURED" : "AWAITING DEPLOYMENT"}<small>{ready ? short(contractAddress()) : "Set NEXT_PUBLIC_CONTRACT_ADDRESS"}</small></span></div></div>
      <div className="desk-grid">
        <aside>{actions.map((item, i) => <button key={item.method} className={i === active ? "active" : ""} onClick={() => { setActive(i); setValues({}); }}><span>{String(i + 1).padStart(2, "0")}</span><div><b>{item.title}</b><small>{item.actor}</small></div></button>)}</aside>
        <div className="form-sheet"><p>{action.eyebrow}</p><h3>{action.title}</h3><div className="actor"><ShieldCheck size={17}/><span>Authorized actor</span><b>{action.actor}</b></div><div className="fields">{action.fields.map((field) => <label key={field.key}><span>{field.label}</span><input type={field.type || "text"} placeholder={field.placeholder} value={values[field.key] || ""} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}/></label>)}</div><button className="submit" disabled={!ready || !wallet || phase === "SUBMITTED" || phase === "PENDING"} onClick={submit}>{ready ? (wallet ? `Submit ${action.eyebrow.slice(0, 2)}` : "Connect wallet to continue") : "Deploy contract to enable writes"}<ArrowRight size={17}/></button></div>
        <div className="read-sheet"><p>CANONICAL READBACK</p><h3>Accepted state</h3><label><span>Record type</span><select value={readMethod} onChange={(e) => setReadMethod(e.target.value)}>{reads.map((r) => <option key={r}>{r}</option>)}</select></label>{readMethod !== "get_stats" && <label><span>Record ID</span><input value={readId} onChange={(e) => setReadId(e.target.value)} placeholder="Enter exact ID"/></label>}<button className="outline" onClick={loadReadback}>Refresh accepted state</button><pre>{readback}</pre></div>
      </div>
      <div className="tx-strip"><div><small>TRANSACTION STATE</small><b>{phase}</b></div><p>{message}</p>{hash && <a href={explorerTx(hash)} target="_blank" rel="noreferrer">Open explorer <ExternalLink size={14}/></a>}</div>
    </section>

    <section className="proof" id="proof"><div className="proof-copy"><p className="kicker">DESIGNED FOR ADVERSARIAL EVIDENCE</p><h2>The document never grants authority.</h2><p>Files are untrusted inputs. RelaySeal binds authority to transaction senders, current on-chain service state and an exact co-signed policy. The validator ignores instructions embedded in evidence and emits one bounded verdict.</p></div><div className="proof-list"><div><FileCheck2/><span><b>Markdown is evidence</b><small>Commit-pinned, byte-bound and hash-bound</small></span></div><div><ShieldCheck/><span><b>Sender is authority</b><small>Every privileged transition checks the on-chain actor</small></span></div><div><Copy/><span><b>Acceptance is exact</b><small>Incoming operator signs the specific handover digest</small></span></div></div></section>
    <footer className="footer"><span>RelaySeal / GenLayer intelligent contract</span><span>Evidence informs. Policy authorizes.</span></footer>
  </main>;
}
