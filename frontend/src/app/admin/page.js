"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, usePathname } from "next/navigation";
import {
    Landmark, LayoutDashboard, ArrowLeftRight, ClipboardList,
    ShieldAlert, LogOut, ArrowUpRight, ArrowDownLeft, Activity,
    TerminalSquare, Shield, AlertTriangle, User, LifeBuoy,ShoppingCart, BookOpen
} from "lucide-react";

/* ─────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────── */
function Sidebar({ username, nickname, role, onLogout }) {
    const router = useRouter();
    const pathname = usePathname();
    const currentPathId = pathname === "/" || !pathname
        ? "dashboard"
        : pathname.split("/")[1] || "dashboard";

    const nav = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { id: "transfer", label: "Transfer", icon: ArrowLeftRight, path: "/transfer" },
        { id: "transactions", label: "Transactions", icon: ClipboardList, path: "/transactions" },
        { id: "support", label: "Support", icon: LifeBuoy, path: "/support" },
        { id: "shop", label: "Shop", icon: ShoppingCart, path: "/shop" },
        { id: "instructions", label: "Instructions", icon: BookOpen, path: "/instructions" },
        ...(role === "manager" ? [{ id: "admin", label: "Admin", icon: ShieldAlert, path: "/admin" }] : []),
    ];
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
            <nav className="sx-sb-nav">
                {nav.map(({ id, label, icon: Icon, path }) => {
                    const isActive = currentPathId === id;
                    return (
                        <button key={id} className={`sx-sb-link${isActive ? " active" : ""}`} onClick={() => router.push(path)}>
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
   SKELETON ROW
───────────────────────────────────────── */
function SkeletonRow() {
    return (
        <div className="lg-row">
            <div className="lg-cell"><div className="lg-skel" style={{ width: 32, height: 32, borderRadius: 6 }} /></div>
            <div className="lg-cell"><div className="lg-skel" style={{ width: "60%", height: 12 }} /></div>
            <div className="lg-cell"><div className="lg-skel" style={{ width: "80%", height: 12 }} /></div>
            <div className="lg-cell"><div className="lg-skel" style={{ width: "50%", height: 12 }} /></div>
            <div className="lg-cell" style={{ justifyContent: "flex-end" }}><div className="lg-skel" style={{ width: 80, height: 14 }} /></div>
        </div>
    );
}

/* ─────────────────────────────────────────
   MAIN ADMIN PAGE
───────────────────────────────────────── */
export default function AdminPage() {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [targetId, setTargetId] = useState("");
    const [ledgerData, setLedgerData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [username, setUsername] = useState("");
    const [nickname, setNickname] = useState("");
    const [role, setRole] = useState("");
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 60);

        // VULNERABILITY: The frontend checks the role, but it relies on localStorage!
        // A hacker can just change their role to "admin" in the browser to bypass this.
        const storedRole = sessionStorage.getItem("role");
        if (storedRole !== "manager") {
            console.warn("UNAUTHORIZED ACCESS ATTEMPT DETECTED.");
            router.push("/dashboard"); 
            return; // Stop running code if not authorized
        }

        setIsAuthorized(true);

        setUsername(sessionStorage.getItem("username") || "");
        setRole(storedRole || "user");

        // Fetch nickname
        const userId = sessionStorage.getItem("user_id");
        if (userId) {
            axios.get(`/api/v1/user-data/${userId}`)
                .then(res => setNickname(res.data.nickname || ""))
                .catch(() => { });
        }

        return () => clearTimeout(t);
    }, [router]);

    const handleSurveillance = async (e) => {
        e.preventDefault();
        setError("");
        setLedgerData(null);
        setLoading(true);

        try {
            // VULNERABILITY #4: IDOR (Insecure Direct Object Reference)
            // The API fetches transactions for ANY account ID without verifying if the 
            // person making the request is actually an admin in the database.
            const response = await axios.get(`/api/v1/transactions/${targetId}`);
            const data = response.data.transactions ? response.data.transactions : response.data;
            setLedgerData(data);
        } catch (err) {
            setError("FAILED TO RETRIEVE LEDGER. ID MAY NOT EXIST.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => { sessionStorage.clear(); router.push("/"); };
    if (!isAuthorized) {
        return <div className="sx-loading-screen">Checking permissions...</div>;
    }

    return (
        <>
        <style>{`
        /* ── Page header ── */
        .sx-page-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 24px; border-bottom: 1px solid rgba(255,69,58,0.15); flex-wrap: wrap; gap: 20px; }
        .sx-page-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #FF453A; display: flex; align-items: center; gap: 8px; }
        .sx-page-sub { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #6B6B6B; letter-spacing: 0.06em; margin-top: 3px; }

        /* ── Admin Card ── */
        .ad-card { background: linear-gradient(180deg, #0A0A0A 0%, #080808 100%); border-radius: 16px; padding: 32px; position: relative; overflow: hidden; transition: border-color 0.3s;backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12); }
        .ad-card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #FF453A, transparent); animation: scanline 4s ease-in-out infinite; }
        @keyframes scanline { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
        .ad-desc { color: #6B6B6B; font-size: 13px; margin-bottom: 24px; line-height: 1.5; }

        /* ── Form ── */
        .ad-form { display: flex; gap: 16px; margin-bottom: 32px; align-items: flex-start; flex-wrap: wrap; }
        .ad-input-wrap { flex: 1; min-width: 260px; position: relative; }
        .ad-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #FF453A; pointer-events: none; }
        .ad-input { width: 100%; box-sizing: border-box; background: #141414; border: 1px solid #1E1E1E; border-radius: 16px; color: #F0F0F0; font-family: 'JetBrains Mono', monospace; font-size: 14px; padding: 14px 16px 14px 44px; outline: none; transition: border-color 0.15s, box-shadow 0.15s; caret-color: #FF453A; }
        .ad-input:focus { border-color: rgba(255,69,58,0.4); box-shadow: 0 0 0 3px rgba(255,69,58,0.06); }
        .ad-input::placeholder { color: #3A3A3A; }

        .ad-submit { display: flex; align-items: center; justify-content: center; gap: 8px; height: 48px; padding: 0 24px; background: rgba(255, 68, 58, 0); color: #FF453A; border: 1px solid rgba(255, 68, 58, 0.14); border-radius: 24px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; transition: background 0.15s, color 0.15s; white-space: nowrap;backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12); }
        .ad-submit:hover { background: rgba(255,69,58,0.2);backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12); }
        .ad-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .ad-error { display: flex; align-items: center; gap: 8px; color: #FF453A; font-family: 'JetBrains Mono', monospace; font-size: 12px; padding: 12px 16px; background: rgba(255,69,58,0.05); border-radius: 6px; border: 1px solid rgba(255,69,58,0.2); margin-bottom: 24px; }

        /* ── Table (reusing ledger styles but adapted) ── */
        .lg-table { background: #0D0D0D; border: 1px solid #1A1A1A; border-radius: 8px; overflow: hidden; width: 100%; margin-bottom: 40px; }
        .lg-table::-webkit-scrollbar { width: 6px; }
        .lg-table::-webkit-scrollbar-track { background: #0D0D0D; }
        .lg-table::-webkit-scrollbar-thumb { background: #1A1A1A; border-radius: 4px; }
        .lg-table::-webkit-scrollbar-thumb:hover { background: #2A2A2A; }
        
        .lg-header { display: grid; grid-template-columns: 48px 1fr 1.2fr 140px 140px; gap: 0; padding: 12px 24px; border-bottom: 1px solid #1A1A1A; background: #0A0A0A; position: sticky; top: 0; z-index: 10; }
        .lg-header-cell { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #3A3A3A; display: flex; align-items: center; }

        .lg-row { display: grid; grid-template-columns: 48px 1fr 1.2fr 140px 140px; gap: 0; padding: 14px 24px; border-bottom: 1px solid #111; transition: background 0.2s, padding-left 0.2s; align-items: center; }
        .lg-row:last-child { border-bottom: none; }
        .lg-row:hover { background: rgba(255,69,58,0.03); padding-left: 28px; }

        .lg-cell { display: flex; align-items: center; min-width: 0; }

        .lg-avatar { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .lg-avatar.out { background: rgba(255,69,58,0.08); color: #FF453A; }
        .lg-avatar.in  { background: rgba(17,95,232,0.08); color: #115fe8; }

        .lg-account { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #C0C0C0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lg-ref { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #3A3A3A; margin-top: 2px; }

        .lg-note { font-size: 12px; color: #6B6B6B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
        .lg-date { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #6B6B6B; }

        .lg-amount { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 500; text-align: right; width: 100%; }
        .lg-amount.out { color: #FF453A; }
        .lg-amount.in  { color: #115fe8; }

        .lg-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 24px; color: #3A3A3A; font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 0.06em; gap: 10px; text-transform: uppercase; }

        /* ── Skeleton ── */
        .lg-skel { background: linear-gradient(90deg, #141414 25%, #1E1E1E 50%, #141414 75%); background-size: 200% 100%; animation: skel 1.4s ease-in-out infinite; border-radius: 4px; height: 12px; }
        @keyframes skel { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        @media (max-width: 1024px) {
          .lg-header, .lg-row { grid-template-columns: 48px 1fr 1fr 120px; }
          .lg-header-cell:nth-child(4), .lg-row .lg-cell:nth-child(4) { display: none; }
        }
        @media (max-width: 640px) {
          .lg-header, .lg-row { grid-template-columns: 40px 1fr 100px; padding: 12px 16px; }
          .lg-header-cell:nth-child(3), .lg-row .lg-cell:nth-child(3) { display: none; }
          .sx-page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
        }
      `}</style>

            <div className="sx-shell">
                <Sidebar username={username} nickname={nickname} role={role} onLogout={handleLogout} />

                <main className="sx-main">

                    {/* Page header */}
                    <div className="sx-page-header sx-fade" style={{ animationDelay: "0.05s" }}>
                        <div>
                            <div className="sx-page-title">
                                <ShieldAlert size={20} className="sx-pulse" />
                                Root Surveillance
                            </div>
                            <div className="sx-page-sub">Authorized personnel only. Activities are monitored.</div>
                        </div>
                    </div>

                    <div className="ad-card sx-fade" style={{ animationDelay: "0.1s" }}>
                        <p className="ad-desc">
                            Bypass encryption protocols to view full transaction histories across the network.
                            Enter a Target Account ID to initiate ledger decryption.
                        </p>

                        <form onSubmit={handleSurveillance} className="ad-form">
                            <div className="ad-input-wrap">
                                <TerminalSquare size={16} className="ad-icon" />
                                <input
                                    type="number"
                                    required
                                    value={targetId}
                                    onChange={(e) => setTargetId(e.target.value)}
                                    placeholder="Enter Target ID (e.g., 2)"
                                    className="ad-input"
                                />
                            </div>
                            <button type="submit" className="ad-submit" disabled={loading}>
                                <Shield size={16} />
                                {loading ? "Decrypting..." : "Decrypt Ledger"}
                            </button>
                        </form>

                        {error && (
                            <div className="ad-error sx-fade">
                                <AlertTriangle size={16} />
                                {error}
                            </div>
                        )}

                        {/* Surveillance Results Table */}
                        {(ledgerData || loading) && (
                            <div style={{ marginTop: 24 }} className="sx-fade">
                                <h3 style={{ color: '#F0F0F0', fontFamily: '"Syne", sans-serif', fontSize: '14px', fontWeight: '700', marginBottom: '16px', letterSpacing: '-0.01em' }}>
                                    Decrypted Records for ID: {targetId}
                                </h3>

                                <div className="lg-table">
                                    <div className="lg-header">
                                        <div className="lg-header-cell">Type</div>
                                        <div className="lg-header-cell">Account</div>
                                        <div className="lg-header-cell">Note</div>
                                        <div className="lg-header-cell">Date</div>
                                        <div className="lg-header-cell" style={{ justifyContent: "flex-end" }}>Amount</div>
                                    </div>

                                    {loading ? (
                                        Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                                    ) : ledgerData?.length === 0 ? (
                                        <div className="lg-empty">
                                            <Activity size={28} />
                                            No records found for this ID.
                                        </div>
                                    ) : (
                                        ledgerData?.map((tx, i) => {
                                            // Determine outgoing based on the target ID being searched
                                            const outgoing = String(tx.sender_id) === String(targetId);
                                            const counterparty = outgoing ? tx.receiver_account : tx.sender_account;
                                            const amt = Number(tx.amount);
                                            const amtStr = outgoing
                                                ? `−₹${amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                                                : `+₹${amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
                                            const date = tx.timestamp
                                                ? new Date(tx.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                                : "—";

                                            return (
                                                <div className="lg-row" key={tx.id || i}>
                                                    <div className="lg-cell">
                                                        <div className={`lg-avatar ${outgoing ? "out" : "in"}`}>
                                                            {outgoing ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
                                                        </div>
                                                    </div>
                                                    <div className="lg-cell">
                                                        <div>
                                                            <div className="lg-account">{counterparty || "—"}</div>
                                                            <div className="lg-ref">TXN-{tx.id || "0000"}</div>
                                                        </div>
                                                    </div>
                                                    <div className="lg-cell">
                                                        {/* Still vulnerable to XSS intentionally */}
                                                        <span className="lg-note" dangerouslySetInnerHTML={{ __html: tx.transfer_note || "No memo" }} />
                                                    </div>
                                                    <div className="lg-cell">
                                                        <span className="lg-date">{date}</span>
                                                    </div>
                                                    <div className="lg-cell" style={{ justifyContent: "flex-end" }}>
                                                        <span className={`lg-amount ${outgoing ? "out" : "in"}`}>{amtStr}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}