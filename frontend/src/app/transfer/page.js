"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
    Landmark, LayoutDashboard, ArrowLeftRight, ClipboardList,
    ShieldAlert, LogOut, Send, RefreshCw, ArrowRight,
    Wallet, Hash, StickyNote, CheckCircle2, AlertCircle, LifeBuoy, ShoppingCart, BookOpen
} from "lucide-react";

/* ─────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────── */
function Sidebar({ username, nickname, role, onLogout }) {
    const router = useRouter();
    // Tracks the live URL path id directly from Next.js (e.g. "/transfer" becomes "transfer")
    const currentPathId = router.pathname === "/" || !router.pathname
        ? "transfer"
        : router.pathname.split("/")[1] || "transfer";


    const linkRefs = useRef({});
    const [bgStyle, setBgStyle] = useState({ transform: "translateY(0px)", height: "0px", opacity: 0 });

    const nav = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { id: "transfer", label: "Transfer", icon: ArrowLeftRight, path: "/transfer" },
        { id: "transactions", label: "Transactions", icon: ClipboardList, path: "/transactions" },
        { id: "support", label: "Support", icon: LifeBuoy, path: "/support" },
        { id: "shop", label: "Shop", icon: ShoppingCart, path: "/shop" },
        { id: "instructions", label: "Instructions", icon: BookOpen, path: "/instructions" },
        ...(role === "manager" ? [{ id: "admin", label: "Admin", icon: ShieldAlert, path: "/admin" }] : []),
    ];

    // ==========================================
    // PLACE THE MERGED EFFECT RIGHT HERE 👇
    // ==========================================
    useEffect(() => {
        // 1. Core function to calculate layout dimensions
        const updateLiquidPosition = () => {
            const activeElement = linkRefs.current[currentPathId];
            if (activeElement) {
                const isMobile = window.innerWidth <= 640;

                setBgStyle({
                    transform: isMobile
                        ? `translateX(${activeElement.offsetLeft}px)`
                        : `translateY(${activeElement.offsetTop}px)`,
                    width: `${activeElement.offsetWidth}px`,
                    height: `${activeElement.offsetHeight}px`,
                    opacity: 1
                });
            }
        };
    }, [currentPathId, role]); // Tracks changes flawlessly
    // ==========================================

    return (
        <aside className="sx-sidebar">
            <div className="sx-sb-logo">
                <Landmark size={28} color="#0943f0" />
                <span className="sx-sb-brand">Stellar<span style={{ color: "#0943f0" }}>X</span></span>
            </div>

            <div className="sx-sb-user" onClick={() => router.push("/profile")} style={{ cursor: 'pointer' }}>
                <div className="sx-sb-avatar">{(username || "?").slice(0, 2).toUpperCase()}</div>
                <div className="sx-sb-user-info">
                    <span className="sx-sb-name" dangerouslySetInnerHTML={{ __html: username || "—" }} />
                    <span className={`sx-sb-role ${role === "manager" ? "manager" : ""}`}>{(role || "user").toUpperCase()}</span>
                </div>
            </div>

            <nav className="sx-sb-nav" style={{ position: "relative" }}>
                <div className="sx-magic-bg" style={bgStyle} />

                {nav.map(({ id, label, icon: Icon, path }) => {
                    // Computes active condition immediately using the Next.js router path
                    const isActive = currentPathId === id;

                    return (
                        <button
                            key={id}
                            ref={(el) => { if (el) linkRefs.current[id] = el; }}
                            className={`sx-sb-link${isActive ? " active" : ""}`}
                            onClick={() => router.push(path)} // Simply route; Next.js handles states
                        >
                            <Icon size={15} /><span>{label}</span>
                            {isActive && <div className="sx-sb-pip" />}
                        </button>
                    );
                })}

            </nav>

            <button className="sx-sb-logout" onClick={onLogout}><LogOut size={14} /><span>LogOut</span></button>
        </aside>
    );
}

/* ─────────────────────────────────────────
   TRANSFER PAGE
───────────────────────────────────────── */
export default function TransferPage() {
    const [receiver, setReceiver] = useState("");
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [status, setStatus] = useState({ type: "", message: "", data: null });
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [username, setUsername] = useState("");
    const [nickname, setNickname] = useState("");
    const [role, setRole] = useState("");
    const router = useRouter();

    // VULNERABILITY #1 Support: Trusting the frontend ID
    const senderId = typeof window !== "undefined" ? sessionStorage.getItem("user_id") : null;

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 60);
        if (!senderId) { router.push("/"); return; }
        setUsername(sessionStorage.getItem("username") || "");
        setRole(sessionStorage.getItem("role") || "user");

        // Fetch nickname
        if (senderId) {
            axios.get(`/api/v1/user-data/${senderId}`)
                .then(res => setNickname(res.data.nickname || ""))
                .catch(() => { });
        }
        return () => clearTimeout(t);
    }, [senderId, router]);

    const handleTransfer = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ type: "", message: "", data: null });

        try {
            const payload = new URLSearchParams();
            payload.append("sender_id", senderId);
            payload.append("receiver_account", receiver);
            payload.append("amount", amount);
            payload.append("transfer_note", note || "");

            // ← ADD THIS: attach csrf_token
            const csrfToken = sessionStorage.getItem("csrf_token") || "";
            payload.append("csrf_token", csrfToken);

            const hackerId = sessionStorage.getItem("hacker_id") || sessionStorage.getItem("user_id") || "2";

            const response = await axios.post("/api/v1/transfer", payload, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${hackerId}`
                }
            });

            setStatus({
                type: "success",
                message: "Transaction Successful",
                data: {
                    balance: response.data.new_balance,
                    receiver,
                    amount: parseFloat(amount),
                    ref: "TX-" + Date.now().toString(36).toUpperCase(),
                    time: new Date().toLocaleString("en-IN"),
                },
            });
            setReceiver("");
            setAmount("");
            setNote("");

        } catch (err) {
            if (err.response?.data?.detail) {
                setStatus({ type: "error", message: err.response.data.detail, data: null });
            } else {
                setStatus({ type: "error", message: "Transfer failed. Verify receiver account and balance.", data: null });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem("user_id");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("role");
        sessionStorage.removeItem("hacker_id");
        router.push("/");
    };

    return (
        <>
            <style>{`


        /* ── Page header ── */
        .sx-page-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 24px; border-bottom: 1px solid #1A1A1A; flex-wrap: wrap; gap: 20px; }
        .sx-page-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #F0F0F0; }
        .sx-page-sub { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #3A3A3A; letter-spacing: 0.06em; margin-top: 3px; }

        /* ── Transfer layout ── */
        .tf-layout { display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start; }
        @media (max-width: 1100px) { .tf-layout { grid-template-columns: 1fr; } }

        /* ── Card ── */
        .tf-card { background: linear-gradient(145deg, #0D0D0D 0%, #0A0A12 100%);
          border: 1px solid #1A1A1A; border-radius: 16px;
          padding: 32px; position: relative; overflow: hidden;
          transition: border-color 0.3s;
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12); }
        .tf-card:hover { border-color: rgba(17,95,232,0.12); }
        .tf-card::before { content: ''; position: absolute; top: -80px; right: -80px; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(17,95,232,0.07) 0%, transparent 65%); pointer-events: none; }

        .tf-card-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #F0F0F0; margin-bottom: 4px; letter-spacing: -0.01em; }
        .tf-card-sub { font-size: 12px; color: #6B6B6B; margin-bottom: 28px; }

        /* ── Form ── */
        .tf-form { display: flex; flex-direction: column; gap: 20px; }
        .tf-field { display: flex; flex-direction: column; gap: 8px; }
        .tf-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #6B6B6B; display: flex; align-items: center; gap: 6px; }
        .tf-label-icon { color: #3A3A3A; flex-shrink: 0; }

        .tf-input { width: 100%; box-sizing: border-box; background: #141414; border: 1px solid #1E1E1E; border-radius: 16px; color: #F0F0F0; font-family: 'JetBrains Mono', monospace; font-size: 13px; padding: 14px 16px; outline: none; transition: border-color 0.15s, box-shadow 0.15s; caret-color: #115fe8; }
        .tf-input:focus { border-color: rgba(17,95,232,0.4); box-shadow: 0 0 0 3px rgba(17,95,232,0.06); }
        .tf-input::placeholder { color: #2A2A2A; }
        .tf-input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px #141414 inset; -webkit-text-fill-color: #F0F0F0; }

        .tf-input-amount { font-size: 24px; font-weight: 500; letter-spacing: -0.03em; color: #115fe8; }
        .tf-input-amount::placeholder { color: #1E1E1E; }

        .tf-amount-wrap { position: relative; }
        .tf-amount-prefix { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 500; color: #3A3A3A; pointer-events: none; }

        .tf-textarea { resize: none; min-height: 80px; font-family: system-ui, sans-serif; font-size: 13px; }

        /* ── Submit ── */
        .tf-submit { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; height: 48px; background: #115fe8; color: #fff; border: none; border-radius: 24px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; transition: background 0.2s, transform 0.2s, box-shadow 0.2s; position: relative; overflow: hidden; margin-top: 4px;
         backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12);
        }
        .tf-submit:hover { background: #0d4fd0; box-shadow: 0 6px 24px rgba(17,95,232,0.35), 0 0 0 1px rgba(17,95,232,0.2); transform: translateY(-1px);
         backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12);
        }
        .tf-submit:active { transform: scale(0.97) translateY(0); box-shadow: none; }
        .tf-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .tf-submit::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent); transform: translateX(-100%); }
        .tf-submit:hover::after { animation: shimmer 0.8s ease forwards; }
        @keyframes shimmer { to { transform: translateX(100%); } }

        /* ── Status messages ── */
        .tf-status { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.5; animation: fadeUp 0.35s ease forwards; }
        .tf-status.success { background: rgba(17,95,232,0.06); border: 1px solid rgba(17,95,232,0.2); color: #6ea3ff; }
        .tf-status.error { background: rgba(255,69,58,0.06); border: 1px solid rgba(255,69,58,0.2); color: #ff6b63; }
        .tf-status-icon { flex-shrink: 0; margin-top: 1px; }

        /* ── Success receipt ── */
        .tf-receipt { display: flex; flex-direction: column; gap: 12px; margin-top: 6px; }
        .tf-receipt-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(17,95,232,0.08); }
        .tf-receipt-key { font-size: 10px; color: #6B6B6B; letter-spacing: 0.08em; text-transform: uppercase; }
        .tf-receipt-val { font-size: 12px; color: #C0C0C0; }

        /* ── Info sidebar ── */
        .tf-info { display: flex; flex-direction: column; gap: 16px; }
        .tf-info-card { background: #0D0D0D; border: 1px solid #1A1A1A; border-radius: 16px; padding: 24px; transition: border-color 0.3s, transform 0.3s cubic-bezier(0.22,1,0.36,1);
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12);
        }
        .tf-info-card:hover { border-color: #222; transform: translateY(-2px); }
        .tf-info-title { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: #F0F0F0; margin-bottom: 14px; letter-spacing: -0.01em; }
        .tf-info-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid #111; }
        .tf-info-item:last-child { border-bottom: none; }
        .tf-info-icon { width: 28px; height: 28px; border-radius: 6px; background: #141414; border: 1px solid #1E1E1E; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tf-info-text { font-size: 12px; color: #6B6B6B; line-height: 1.5; }
        .tf-info-text strong { color: #C0C0C0; font-weight: 600; }

        .tf-limits { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .tf-limit-item { background: #141414; border: 1px solid #1A1A1A; border-radius: 16px; padding: 14px; }
        .tf-limit-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #6B6B6B; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; }
        .tf-limit-value { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 500; color: #F0F0F0; }

        /* ── Animations ── */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .sx-fade { opacity: 0; transform: translateY(14px); animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) forwards; }
        
        @media (max-width: 1100px) { .tf-layout { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .tf-card { padding: 24px 16px; } .sx-page-header { flex-direction: column; align-items: flex-start; gap: 12px; } }

      `}</style>

            <div className="sx-shell">
                <Sidebar username={username} nickname={nickname} role={role} onLogout={handleLogout} />

                <main className="sx-main">

                    {/* Page header */}
                    <div className="sx-page-header sx-fade" style={{ animationDelay: "0.05s" }}>
                        <div>
                            <div className="sx-page-title">Transfer</div>
                            <div className="sx-page-sub">Initiate an encrypted asset transfer to a target vault</div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="tf-layout">

                        {/* ── Left: Transfer Form ── */}
                        <div className="tf-card sx-fade" style={{ animationDelay: "0.1s" }}>
                            <div className="tf-card-title">Execute Transfer</div>
                            <div className="tf-card-sub">All transactions are AES-256 encrypted end-to-end</div>

                            {/* Status */}
                            {status.message && (
                                <div className={`tf-status ${status.type}`} style={{ marginBottom: 20 }}>
                                    {status.type === "success"
                                        ? <CheckCircle2 size={16} className="tf-status-icon" />
                                        : <AlertCircle size={16} className="tf-status-icon" />
                                    }
                                    <div>
                                        <div>{status.message}</div>
                                        {status.data && (
                                            <div className="tf-receipt">
                                                {[
                                                    ["Ref ID", status.data.ref],
                                                    ["Amount", `₹${status.data.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
                                                    ["Receiver", status.data.receiver],
                                                    ["New Balance", `₹${Number(status.data.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
                                                    ["Timestamp", status.data.time],
                                                ].map(([k, v]) => (
                                                    <div key={k} className="tf-receipt-row">
                                                        <span className="tf-receipt-key">{k}</span>
                                                        <span className="tf-receipt-val">{v}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleTransfer} className="tf-form">
                                {/* Receiver */}
                                <div className="tf-field">
                                    <label className="tf-label">
                                        <Hash size={12} className="tf-label-icon" />
                                        Receiver Account
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={receiver}
                                        onChange={(e) => setReceiver(e.target.value)}
                                        placeholder="e.g. SX-00000"
                                        className="tf-input"
                                    />
                                </div>

                                {/* Amount */}
                                <div className="tf-field">
                                    <label className="tf-label">
                                        <Wallet size={12} className="tf-label-icon" />
                                        Amount
                                    </label>
                                    <div className="tf-amount-wrap">
                                        <span className="tf-amount-prefix">₹</span>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            max="25000"
                                            step="0.01"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="tf-input tf-input-amount"
                                            style={{ paddingLeft: 44 }}
                                        />
                                    </div>
                                </div>

                                {/* Note */}
                                <div className="tf-field">
                                    <label className="tf-label">
                                        <StickyNote size={12} className="tf-label-icon" />
                                        Transfer Note
                                        <span style={{ color: "#3A3A3A", fontWeight: 400, marginLeft: 4 }}>optional</span>
                                    </label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Reference memo..."
                                        className="tf-input tf-textarea"
                                        rows={3}
                                    />
                                </div>

                                {/* Submit */}
                                <button type="submit" className="tf-submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <><RefreshCw size={15} className="sx-spin" /> Processing...</>
                                    ) : (
                                        <><Send size={15} /> Execute Transfer</>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* ── Right: Info Panel ── */}
                        <div className="tf-info">

                            {/* Limits */}
                            <div className="tf-info-card sx-fade" style={{ animationDelay: "0.15s" }}>
                                <div className="tf-info-title">Transfer Limits</div>
                                <div className="tf-limits">
                                    <div className="tf-limit-item">
                                        <div className="tf-limit-label">Per Transaction</div>
                                        <div className="tf-limit-value">₹25000</div>
                                    </div>
                                    <div className="tf-limit-item">
                                        <div className="tf-limit-label">Daily Limit</div>
                                        <div className="tf-limit-value">₹25,00,000</div>
                                    </div>
                                </div>
                            </div>

                            {/* How it works */}
                            <div className="tf-info-card sx-fade" style={{ animationDelay: "0.2s" }}>
                                <div className="tf-info-title">How It Works</div>

                                <div className="tf-info-item">
                                    <div className="tf-info-icon"><Hash size={13} color="#6B6B6B" /></div>
                                    <div className="tf-info-text">
                                        <strong>Enter the receiver&apos;s vault ID</strong><br />
                                        The account number of the destination vault (e.g. ACCT-1002)
                                    </div>
                                </div>

                                <div className="tf-info-item">
                                    <div className="tf-info-icon"><Wallet size={13} color="#6B6B6B" /></div>
                                    <div className="tf-info-text">
                                        <strong>Specify the amount</strong><br />
                                        Funds are deducted instantly from your liquid assets
                                    </div>
                                </div>

                                <div className="tf-info-item">
                                    <div className="tf-info-icon"><ArrowRight size={13} color="#6B6B6B" /></div>
                                    <div className="tf-info-text">
                                        <strong>Transfer executes immediately</strong><br />
                                        Encrypted end-to-end with quantum-resistant cryptography
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}