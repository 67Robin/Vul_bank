"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
    Landmark, LayoutDashboard, ArrowLeftRight, ClipboardList,
    ShieldAlert, LogOut, TrendingUp, TrendingDown, Activity,
    ArrowUpRight, ArrowDownLeft, ChevronRight, Copy, Check,
    Send, RefreshCw, ExternalLink, Bell, AlertTriangle, LifeBuoy, ShoppingCart,BookOpen
} from "lucide-react";

/*SKELETON COMPONENT*/
function Skeleton({ w = "100%", h = 16, radius = 4, style = {} }) {
    return (
        <div
            className="sx-skel"
            style={{ width: w, height: h, borderRadius: radius, ...style }}
        />
    );
}

/*COPY BUTTON COMPONENT (PROFESSIONAL FIX)*/
function CopyBtn({ text }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        // 1. Try the modern Clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                handleSuccess();
                return;
            } catch (err) {
                console.warn("Clipboard API failed, trying fallback...");
            }
        }

        // 2. Fallback for insecure contexts (HTTP / Network IP)
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;

            // Ensure the textarea is not visible or disruptive
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);

            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) handleSuccess();
        } catch (err) {
            console.error("Unable to copy to clipboard", err);
        }
    };

    const handleSuccess = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <button onClick={copy} className="sx-copy-btn" title="Copy">
            {copied ? <Check size={11} color="#115fe8" /> : <Copy size={11} color="#6B6B6B" />}
        </button>
    );
}

/* ─────────────────────────────────────────
   STAT CARD
───────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, trend, loading, delay }) {
    const positive = trend >= 0;
    return (
        <div
            className="sx-stat-card sx-fade"
            style={{ animationDelay: delay }}
        >
            <div className="sx-stat-top">
                <span className="sx-stat-label">{label}</span>
                <div className="sx-stat-icon-wrap">
                    <Icon size={14} color="#6B6B6B" />
                </div>
            </div>
            {loading ? (
                <>
                    <Skeleton w="70%" h={28} radius={4} style={{ marginBottom: 8 }} />
                    <Skeleton w="40%" h={12} radius={3} />
                </>
            ) : (
                <>
                    <div className="sx-stat-value">{value}</div>
                    {trend !== undefined && (
                        <div className={`sx-stat-trend ${positive ? "pos" : "neg"}`}>
                            {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            <span>{positive ? "+" : ""}{trend}% this month</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────
   TRANSACTION ROW (recent preview)
───────────────────────────────────────── */
function TxRow({ tx, userId, loading }) {
    if (loading) {
        return (
            <div className="sx-tx-row">
                <div className="sx-tx-avatar sx-skel" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <Skeleton w="55%" h={12} radius={3} />
                    <Skeleton w="35%" h={10} radius={3} />
                </div>
                <Skeleton w={60} h={14} radius={3} />
            </div>
        );
    }
    const outgoing = String(tx.sender_id) === String(userId);
    const counterparty = outgoing ? tx.receiver_account : tx.sender_account;
    const amount = outgoing
        ? `−₹${Number(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
        : `+₹${Number(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    const date = tx.timestamp ? new Date(tx.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—";

    return (
        <div className="sx-tx-row">
            <div className={`sx-tx-avatar ${outgoing ? "out" : "in"}`}>
                {outgoing ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
            </div>
            <div className="sx-tx-meta">
                <span className="sx-tx-party">{counterparty || "—"}</span>
                <span className="sx-tx-note" dangerouslySetInnerHTML={{ __html: tx.transfer_note || "No note" }} />
            </div>
            <div className="sx-tx-right">
                <span className={`sx-tx-amount ${outgoing ? "out" : "in"}`}>{amount}</span>
                <span className="sx-tx-date">{date}</span>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────── */
function Sidebar({ username, nickname, role, onLogout }) {
    const router = useRouter();
    // Tracks the live URL path id directly from Next.js (e.g. "/transfer" becomes "transfer")
    const currentPathId = router.pathname === "/" || !router.pathname
        ? "dashboard"
        : router.pathname.split("/")[1] || "dashboard";

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
   SETTINGS SECTION
───────────────────────────────────────── */
function SettingsSection({ nickname, userId, onUpdate }) {
    const [newNick, setNewNick] = useState(nickname || "");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const update = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg("");
        try {
            const formData = new FormData();
            formData.append("user_id", userId);
            formData.append("nickname", newNick);
            // VULNERABILITY: This endpoint also allows role escalation if "role" is passed!
            // But we keep it simple here.
            await axios.post("/api/v1/update_profile", formData);
            setMsg("Profile updated.");
            onUpdate(newNick);
        } catch (err) {
            setMsg("Failed to update.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sx-ledger-card sx-fade" style={{ animationDelay: "0.4s", marginTop: 24, padding: 24 }}>
            <div className="sx-ledger-title" style={{ marginBottom: 16 }}>Identity Settings</div>
            <form onSubmit={update} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: '#6B6B6B', textTransform: 'uppercase', marginBottom: 4, display: 'block', fontFamily: 'JetBrains Mono' }}>Global Nickname</label>
                    <input
                        className="sx-modal-input"
                        value={newNick}
                        onChange={e => setNewNick(e.target.value)}
                        placeholder="Set your hacker alias..."
                    />
                </div>
                <button className="sx-btn-primary" type="submit" disabled={loading} style={{ height: 40 }}>
                    {loading ? <RefreshCw size={14} className="sx-spin" /> : "Save"}
                </button>
            </form>
            {msg && <div style={{ fontSize: 10, color: '#115fe8', marginTop: 8, fontFamily: 'JetBrains Mono' }}>{msg}</div>}
        </div>
    );
}

/* ─────────────────────────────────────────
   TRANSFER MODAL
───────────────────────────────────────── */
function TransferModal({ onClose, sourceAccount }) {
    const [receiver, setReceiver] = useState("");
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Reverted to localStorage
            const userId = sessionStorage.getItem("user_id");

            const payload = new URLSearchParams();
            payload.append("sender_id", userId);
            payload.append("receiver_account", receiver);
            payload.append("amount", amount);
            payload.append("transfer_note", note || "");

            // Reverted to axios
            const res = await axios.post(`/api/v1/transfer`, payload, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${userId}`
                }
            });

            setSuccess(res.data);
        } catch (err) {
            console.error("FastAPI Error:", err.response?.data);
            setError("Vulnerability has been patched");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sx-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="sx-modal sx-fade" style={{ animationDelay: "0s" }}>
                <div className="sx-modal-header">
                    <span className="sx-modal-title">Execute Transfer</span>
                    <button className="sx-modal-close" onClick={onClose}>✕</button>
                </div>

                {success ? (
                    <div className="sx-modal-success">
                        <div className="sx-success-icon">✓</div>
                        <div className="sx-success-label">Transfer Executed</div>
                        <div className="sx-success-grid">
                            {[
                                ["Ref ID", success.ref_id || "TX-" + Date.now()],
                                ["Amount", `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
                                ["Receiver", receiver],
                                ["Timestamp", new Date().toLocaleString("en-IN")],
                            ].map(([k, v]) => (
                                <div key={k} className="sx-success-row">
                                    <span className="sx-success-key">{k}</span>
                                    <span className="sx-success-val">{v}</span>
                                </div>
                            ))}
                        </div>
                        <button className="sx-modal-btn-sec" onClick={onClose}>Close</button>
                    </div>
                ) : (
                    <form onSubmit={submit} className="sx-modal-form">
                        <div className="sx-modal-field">
                            <label className="sx-modal-label">Receiver Account No.</label>
                            <input className="sx-modal-input mono" value={receiver} onChange={e => setReceiver(e.target.value)} required placeholder="SX-00000" />
                        </div>
                        <div className="sx-modal-field">
                            <label className="sx-modal-label">Amount (₹)</label>
                            <div style={{ position: "relative" }}>
                                <span className="sx-modal-prefix">₹</span>
                                <input className="sx-modal-input mono" style={{ paddingLeft: 28 }} type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" />
                            </div>
                        </div>
                        <div className="sx-modal-field">
                            <label className="sx-modal-label">Transfer Note</label>
                            {/* VULNERABILITY: raw note rendered as HTML downstream */}
                            <textarea className="sx-modal-input" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Optional memo..." style={{ resize: "none" }} />
                        </div>
                        {error && (
                            <div className="sx-modal-error">{error}</div>
                        )}
                        <button type="submit" className="sx-modal-btn" disabled={loading}>
                            {loading ? <RefreshCw size={14} className="sx-spin" /> : <Send size={14} />}
                            {loading ? "Processing..." : "Execute Transfer"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   MAIN DASHBOARD PAGE
───────────────────────────────────────── */
export default function DashboardPage() {
    const router = useRouter();
    const [account, setAccount] = useState(null);
    const [userData, setUserData] = useState(null);
    const [txns, setTxns] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [showAlertsPopup, setShowAlertsPopup] = useState(false);
    const [loadingAlerts, setLoadingAlerts] = useState(true);
    const [loadingAccount, setLoadingAccount] = useState(true);
    const [loadingTxns, setLoadingTxns] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);
    const [username, setUsername] = useState("");
    const [nickname, setNickname] = useState("");
    const [role, setRole] = useState("");
    const [balanceVisible, setBalanceVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 60);
        const userId = sessionStorage.getItem("user_id");  // VULNERABILITY: IDOR
        const uname = sessionStorage.getItem("username");
        const urole = sessionStorage.getItem("role");

        if (!userId) { router.push("/"); return; }
        setUsername(uname || "");
        setRole(urole || "user");

        // The hacker_id identifies the REAL attacker for lockout purposes
        const hackerId = sessionStorage.getItem("hacker_id") || userId;
        const authHeaders = { 'Authorization': `Bearer ${hackerId}` };

        // Fetch user data for score and nickname
        axios.get(`/api/v1/user-data/${userId}`, { headers: authHeaders })
            .then((res) => {
                setUserData(res.data);
                setNickname(res.data.nickname || "");
            })
            .catch(console.error);

        // Fetch alerts
        axios.get(`/api/v1/notifications`, {
            headers: { 'Authorization': `Bearer ${userId}` }
        })
            .then((res) => {
                setAlerts(res.data.notifications);
                setLoadingAlerts(false);
            })
            .catch((err) => {
                console.error(err);
                setLoadingAlerts(false);
            });

        // Fetch account
        axios.get(`/api/v1/accounts/${userId}`, { headers: authHeaders })
            .then((res) => {
                setAccount(res.data);
                setLoadingAccount(false);
                setTimeout(() => setBalanceVisible(true), 200);
                // Fetch recent transactions using account_id
                return axios.get(`/api/v1/transactions/${res.data.id}`);
            })
            .then((res) => {
                setTxns(res.data || []);
                setLoadingTxns(false);
            })
            .catch(() => {
                setLoadingAccount(false);
                setLoadingTxns(false);
            });

        return () => clearTimeout(t);
    }, [router]);

    const handleLogout = () => {
        sessionStorage.clear();
        router.push("/");
    };

    // Compute stat values using account.id (matches sender_id from transactions API)
    const accountId = account?.id;
    const totalSent = txns.filter(t => String(t.sender_id) === String(accountId))
        .reduce((s, t) => s + Number(t.amount), 0);
    const totalReceived = txns.filter(t => String(t.sender_id) !== String(accountId))
        .reduce((s, t) => s + Number(t.amount), 0);

    return (
        <>
            <style>{`

        /* ── Page header ── */
        .sx-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 24px;
          border-bottom: 1px solid #1A1A1A;
          flex-wrap: wrap;
          gap: 20px;
        }
        .sx-page-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #F0F0F0;
        }
        .sx-page-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #3A3A3A;
          letter-spacing: 0.06em;
          margin-top: 3px;
        }
        .sx-header-actions { display: flex; align-items: center; gap: 8px; }

        .sx-score-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 69, 58, 0.08);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12);
          border-radius: 16px;
          padding: 8px 14px;
          margin-right: 8px;
        }
        .sx-score-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #ff453a;
        }
        .sx-score-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 15px;
          font-weight: 700;
          color: #F0F0F0;
        }

        .sx-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 38px;
          padding: 0 18px;
          background: rgba(17,95,232,0.08); color: #5b9aff; font-weight: 600;border-radius: 20px; 
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12);
          color: #ffffff;
          border: none;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.15s, transform 0.12s;
          font-family: 'Syne', sans-serif;
        }
        .sx-btn-primary:hover {
          background: #0d4fd0;
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12);
          box-shadow: 0 4px 20px rgba(17,95,232,0.3), 0 0 0 1px rgba(17,95,232,0.15);
          transform: translateY(-1px);
        }
        .sx-btn-primary:active { transform: scale(0.97) translateY(0); box-shadow: none; }

        .sx-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 38px;
          padding: 0 16px;
          background: rgba(117, 118, 120, 0.08);font-weight: 600;border-radius: 20px; 
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12);
          color: #F0F0F0;
          border: 1px solid #1E1E1E;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s;
        }
        .sx-btn-secondary:hover {
          background: #1E1E1E;
          border-color: #2A2A2A;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }

        /* ── Hero balance card ── */
        .sx-hero {
          min-height: 250px;
          border-radius: 28px; /* Smooth, continuous liquid corners */
  
          /* 2. Glass Base Translucency */
          background: rgba(103, 102, 102, 0.12); 
  
          /* 3. The Core Blur Refraction */
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px); /* Safari support */

          /* 4. Multi-layered Inner Borders (Simulating Glass Thickness) */
          box-shadow: 
            inset 0 1px 1px rgba(255, 255, 255, 0.24),     /* Top specular highlight */
            inset 0 -1px 2px rgba(0, 0, 0, 0.1),         /* Bottom subtle shadow */
            0 12px 32px rgba(0, 0, 0, 0.12);             /* Smooth drop shadow on canvas */

            /* 5. Center content and handle layout */
            padding: 24px;
            box-sizing: border-box;
            color: #ffffff;
            padding: 32px 36px;
            position: relative;
            overflow: hidden;
            transition: border-color 0.4s;
        }
        .sx-hero:hover {
          border-color: rgba(17,95,232,0.2);
        }
        .sx-hero::before {
          content: '';
          position: absolute;
          top: -80px; right: -80px;
          width: 340px; height: 340px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(17,95,232,0.08) 0%, transparent 65%);
          pointer-events: none;
          animation: heroGlow 6s ease-in-out infinite alternate;
        }
        .sx-hero::after {
          content: '';
          position: absolute;
          bottom: -60px; left: -40px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(17,95,232,0.04) 0%, transparent 70%);
          pointer-events: none;
        }
        @keyframes heroGlow {
          0% { transform: translate(0, 0) scale(1); opacity: 0.7; }
          100% { transform: translate(-10px, 10px) scale(1.1); opacity: 1; }
        }
        .sx-hero-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #6B6B6B;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sx-hero-label::before {
          content: '';
          display: inline-block;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #115fe8;
          box-shadow: 0 0 6px #115fe8;
          animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0.35} }

        .sx-balance-wrap {
          display: flex;
          align-items: flex-end;
          gap: 14px;
          margin-bottom: 24px;
        }
        .sx-balance {
          font-family: 'JetBrains Mono', monospace;
          font-size: clamp(32px, 4vw, 48px);
          font-weight: 500;
          letter-spacing: -0.04em;
          color: silver;
          line-height: 1;
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .sx-balance.visible { opacity: 1; transform: translateY(0); }
        .sx-balance-currency {
          font-family: 'JetBrains Mono', monospace;
          font-size: 36px;
          color: #6B6B6B;
          line-height: 1;
          margin-bottom: 2px;
        }

        .sx-meta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
          border-top: 1px solid #1A1A1A;
          padding-top: 20px;
        }
        .sx-meta-item {
          padding-right: 24px;
          border-right: 1px solid #1A1A1A;
          margin-right: 24px;
        }
        .sx-meta-item:last-child { border-right: none; }
        .sx-meta-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6B6B6B;
          margin-bottom: 6px;
          font-family: 'JetBrains Mono', monospace;
        }
        .sx-meta-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: #C0C0C0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sx-copy-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px;
          border-radius: 3px;
          display: flex;
          align-items: center;
          transition: background 0.15s;
        }
        .sx-copy-btn:hover { background: #1E1E1E; }

        /* ── Stat cards ── */
        .sx-stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }
        .sx-stat-card {
          background: rgba(255,255,255,0.02);font-weight: 600;border-radius: 20px; 
          backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12);
          border-radius: 16px;
          padding: 22px;
          transition: border-color 0.3s, transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s;
          position: relative;
          overflow: hidden;
        }
        .sx-stat-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(17,95,232,0.3), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .sx-stat-card:hover {
          border-color: rgba(17, 71, 232, 0.46);
          transform: translateY(-10px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(17,95,232,0.08);
        }
        .sx-stat-card:hover::after { opacity: 1; }
        .sx-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .sx-stat-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #6B6B6B;
          font-family: 'JetBrains Mono', monospace;
        }
        .sx-stat-icon-wrap {
          width: 28px; height: 28px;
          border-radius: 6px;
          background: #141414;
          border: 1px solid #1E1E1E;
          display: flex; align-items: center; justify-content: center;
        }
        .sx-stat-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 22px;
          font-weight: 500;
          letter-spacing: -0.03em;
          color: #F0F0F0;
          margin-bottom: 6px;
        }
        .sx-stat-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
        }
        .sx-stat-trend.pos { color: #115fe8; }
        .sx-stat-trend.neg { color: #FF453A; }

        /* ── Recent transactions ── */
        .sx-ledger-card {
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(6px);
          border-radius: 16px;
          flex: 1;
          transition: border-color 0.3s;
        }
        .sx-ledger-card:hover {
          border-color: #222;
        }
        .sx-ledger-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          background: rgba(0, 0, 0, 0.02);font-weight: 600;border-radius: 20px 20px 0 0 ; 
          backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12);
        }
        .sx-ledger-title {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #F0F0F0;
          letter-spacing: -0.01em;
        }
        .sx-view-all {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: #6B6B6B;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.15s;
          font-family: 'JetBrains Mono', monospace;
          text-transform: uppercase;
        }
        .sx-view-all:hover { color: #115fe8; }

        .sx-tx-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 24px;
          border-bottom: 1px solid #111;
          transition: background 0.2s, padding-left 0.2s;
          position: relative;
        }
        .sx-tx-row:last-child { border-bottom: none; }
        .sx-tx-row:hover {
          background: rgba(17,95,232,0.03);
          padding-left: 28px;
        }

        .sx-tx-avatar {
          width: 32px; height: 32px;
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .sx-tx-avatar.out { background: rgba(255,69,58,0.1); color: #FF453A; }
        .sx-tx-avatar.in  { background: rgba(17,95,232,0.08); color: #115fe8; }

        .sx-tx-meta { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .sx-tx-party {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #C0C0C0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sx-tx-note {
          font-size: 11px;
          color: #6B6B6B;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 260px;
        }
        .sx-tx-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; flex-shrink: 0; }
        .sx-tx-amount {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 500;
        }
        .sx-tx-amount.out { color: #FF453A; }
        .sx-tx-amount.in  { color: #115fe8; }
        .sx-tx-date {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #3A3A3A;
        }

        .sx-tx-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 30px;
          color: #8b8989ff;
          background: rgba(64, 63, 63, 0.02);font-weight: 600; 
          backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12);
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.06em;
          gap: 8px;
        }

        /* ── Skeleton ── */
        .sx-skel {
          background: linear-gradient(90deg, #141414 25%, #1A1A1A 50%, #141414 75%);
          background-size: 200% 100%;
          animation: skel 1.4s ease-in-out infinite;
        }
        @keyframes skel {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Modal ── */
        .sx-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .sx-modal {
          background: #0D0D0D;
          border: 1px solid #1E1E1E;
          border-radius: 16px;
          width: 100%;
          max-width: 420px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.7);
        }
        .sx-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px;
          border-bottom: 1px solid #1A1A1A;
        }
        .sx-modal-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #F0F0F0;
          letter-spacing: -0.01em;
        }
        .sx-modal-close {
          background: none;
          border: none;
          color: #6B6B6B;
          cursor: pointer;
          font-size: 14px;
          padding: 4px 6px;
          border-radius: 4px;
          transition: color 0.15s, background 0.15s;
        }
        .sx-modal-close:hover { color: #F0F0F0; background: #1A1A1A; }

        .sx-modal-form { padding: 22px; display: flex; flex-direction: column; gap: 16px; }
        .sx-modal-field { display: flex; flex-direction: column; gap: 6px; }
        .sx-modal-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #6B6B6B;
          font-family: 'JetBrains Mono', monospace;
        }
        .sx-modal-input {
          background: #141414;
          border: 1px solid #1E1E1E;
          border-radius: 16px;
          color: #F0F0F0;
          font-size: 13px;
          padding: 10px 14px;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.15s;
          caret-color: #115fe8;
        }
        .sx-modal-input.mono { font-family: 'JetBrains Mono', monospace; }
        .sx-modal-input:focus { border-color: rgba(17,95,232,0.35); }
        .sx-modal-prefix {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: #6B6B6B;
          pointer-events: none;
        }
        .sx-modal-error {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #FF453A;
          background: rgba(255,69,58,0.08);
          border: 1px solid rgba(255,69,58,0.2);
          border-radius: 6px;
          padding: 10px 14px;
        }
        .sx-modal-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 44px;
          background: #115fe8;
          color: #ffffff;
          border: none;
          border-radius: 24px;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.15s;
          margin-top: 4px;
        }
        .sx-modal-btn:hover { background: #0d4fd0; }
        .sx-modal-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .sx-modal-btn-sec {
          display: flex; align-items: center; justify-content: center;
          height: 40px;
          background: #141414;
          color: #F0F0F0;
          border: 1px solid #1E1E1E;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          width: 100%;
        }
        .sx-modal-btn-sec:hover { background: #1A1A1A; }

        /* success */
        .sx-modal-success { padding: 28px 24px; display: flex; flex-direction: column; gap: 16px; }
        .sx-success-icon {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: rgba(17,95,232,0.1);
          border: 1px solid rgba(17,95,232,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; color: #115fe8;
        }
        .sx-success-label {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #F0F0F0;
        }
        .sx-success-grid { display: flex; flex-direction: column; gap: 10px; }
        .sx-success-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #1A1A1A;
        }
        .sx-success-key {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #6B6B6B;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .sx-success-val {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #F0F0F0;
        }

        /* ── Responsive Upgrades ── */
        @media (max-width: 1024px) {
          .sx-stats-row { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 640px) {
          .sx-stats-row { grid-template-columns: 1fr; }
          .sx-meta-grid { grid-template-columns: 1fr; }
          .sx-meta-item { border-right: none; border-bottom: 1px solid #1A1A1A; padding: 12px 0; margin: 0; }
          .sx-meta-item:last-child { border-bottom: none; }
          .sx-page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
          .sx-header-actions { width: 100%; justify-content: space-between; }
        }
      `}</style>

            <div className="sx-shell">
                <Sidebar username={username} nickname={nickname} role={role} onLogout={handleLogout} />
                <main className="sx-main">
                    {/* Page header */}
                    <div className="sx-page-header sx-fade" style={{ animationDelay: "0.05s" }}>
                        <div>
                            <div className="sx-page-title" dangerouslySetInnerHTML={{ __html: "Welcome, " + (nickname || username || "User") }} />
                            <div className="sx-page-sub">
                                {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                            </div>
                        </div>
                        <div className="sx-header-actions">
                            {userData && (
                                <div className="sx-score-pill">
                                    <span className="sx-score-label">Xp</span>
                                    <span className="sx-score-value">{userData.score}</span>
                                </div>
                            )}
                            <button className="sx-btn-secondary" onClick={() => setShowAlertsPopup(true)} style={{ position: 'relative' }}>
                                <Bell size={13} />
                                Alerts
                                {alerts.length > 0 && alerts.some(a => !a.is_read) && (
                                    <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '10px', height: '10px', background: '#ff453a', borderRadius: '50%', border: '2px solid #050505' }} />
                                )}
                            </button>
                            <button className="sx-btn-primary" onClick={() => setShowTransfer(true)}>
                                <Send size={13} />
                                Transfer
                            </button>
                        </div>
                    </div>

                    {/* ── Hero Balance Card ── */}
                    <div className="sx-hero sx-fade" style={{ animationDelay: "0.1s" }}>
                        <div className="sx-hero-label">Total Assets</div>
                        <div className="sx-balance-wrap">
                            <span className="sx-balance-currency">₹</span>
                            {loadingAccount ? (
                                <Skeleton w={260} h={48} radius={4} />
                            ) : (
                                <div className={`sx-balance${balanceVisible ? " visible" : ""}`}>
                                    {account
                                        ? Number(account.balance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                        : "—"}
                                </div>
                            )}
                        </div>

                        <div className="sx-meta-grid">
                            {[
                                { label: "Account Number", key: "account_number" },
                                { label: "IFSC Code", key: "ifsc_code" },
                                { label: "Account Type", key: "account_type" },
                            ].map(({ label, key }) => (
                                <div className="sx-meta-item" key={key}>
                                    <div className="sx-meta-label">{label}</div>
                                    <div className="sx-meta-value">
                                        {loadingAccount ? (
                                            <Skeleton w="80%" h={14} radius={3} />
                                        ) : (
                                            <>
                                                <span>{key === "account_type" ? (account?.[key] || "—").toUpperCase() : (account?.[key] || "—")}</span>
                                                {account?.[key] && key !== "account_type" && <CopyBtn text={account[key]} />}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Stat Cards ── */}
                    <div className="sx-stats-row">
                        <StatCard
                            label="Total Sent"
                            value={`₹${totalSent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                            icon={ArrowUpRight}
                            trend={-2.4}
                            loading={loadingTxns}
                            delay="0.15s"
                        />
                        <StatCard
                            label="Total Received"
                            value={`₹${totalReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                            icon={ArrowDownLeft}
                            trend={8.1}
                            loading={loadingTxns}
                            delay="0.2s"
                        />
                        <StatCard
                            label="Transactions"
                            value={txns.length}
                            icon={Activity}
                            loading={loadingTxns}
                            delay="0.25s"
                        />
                    </div>

                    {/* ── Recent Transactions ── */}
                    <div className="sx-ledger-card sx-fade" style={{ animationDelay: "0.3s" }}>
                        <div className="sx-ledger-header">
                            <span className="sx-ledger-title">Recent Activity</span>
                            <button className="sx-view-all" onClick={() => router.push("/transactions")}>
                                View all <ChevronRight size={13} />
                            </button>
                        </div>

                        {loadingTxns ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TxRow key={i} loading />
                            ))
                        ) : txns.length === 0 ? (
                            <div className="sx-tx-empty">
                                <Activity size={24} />
                                No transactions found
                            </div>
                        ) : (
                            txns.slice(0, 5).map((tx, i) => (
                                <TxRow key={tx.id || i} tx={tx} userId={account?.id} />
                            ))
                        )}
                    </div>
                </main>
            </div>

            {/* Alerts Modal Popup */}
            {showAlertsPopup && (
                <div className="sx-modal-backdrop" onClick={() => setShowAlertsPopup(false)}>
                    <div className="sx-modal" onClick={e => e.stopPropagation()}>
                        <div className="sx-modal-header">
                            <h3 className="sx-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle size={16} color="#ff453a" /> System Alerts
                            </h3>
                            <button className="sx-modal-close" onClick={() => setShowAlertsPopup(false)}>✕</button>
                        </div>
                        <div style={{ padding: '22px', maxHeight: '400px', overflowY: 'auto' }}>
                            {loadingAlerts ? (
                                <div style={{ color: '#6B6B6B', fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', textAlign: 'center' }}>Scanning logs...</div>
                            ) : alerts.length === 0 ? (
                                <div style={{ color: '#6B6B6B', fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', textAlign: 'center' }}>No new alerts.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {alerts.map((alert) => (
                                        <div key={alert.id} style={{
                                            background: alert.is_read ? '#141414' : 'rgba(255, 69, 58, 0.08)',
                                            borderLeft: `3px solid ${alert.message.includes('🛡️') ? '#115fe8' : '#ff453a'}`,
                                            padding: '12px 16px',
                                            borderRadius: '4px',
                                            fontFamily: '"JetBrains Mono", monospace',
                                            fontSize: '12px'
                                        }}>
                                            <div style={{ color: '#6B6B6B', fontSize: '10px', marginBottom: '6px' }}>
                                                {new Date(alert.timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                            </div>
                                            {/* VULNERABILITY: BLIND XSS
                                              If a malicious payload is saved into the database, it detonates right here 
                                              in the victim's browser without them doing anything but opening the page.
                                            */}
                                            <div
                                                style={{ color: '#F0F0F0', lineHeight: '1.5' }}
                                                dangerouslySetInnerHTML={{ __html: alert.message }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {showTransfer && (
                <TransferModal
                    onClose={() => setShowTransfer(false)}
                    sourceAccount={account?.account_number}
                />
            )}
        </>
    );
}