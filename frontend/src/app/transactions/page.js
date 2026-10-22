"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
    Landmark, LayoutDashboard, ArrowLeftRight, ClipboardList,
    ShieldAlert, LogOut, ArrowUpRight, ArrowDownLeft, Activity,
    Search, Filter, RefreshCw, User, LifeBuoy, ShoppingCart, BookOpen
} from "lucide-react";

/* ─────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────── */
function Sidebar({ username, nickname, role, onLogout }) {
    const router = useRouter();
    // Tracks the live URL path id directly from Next.js (e.g. "/transfer" becomes "transfer")
    const currentPathId = router.pathname === "/" || !router.pathname
        ? "transactions"
        : router.pathname.split("/")[1] || "transactions";


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
   MAIN LEDGER PAGE
───────────────────────────────────────── */
export default function TransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all"); // all | sent | received
    const [accountId, setAccountId] = useState(null);
    const [username, setUsername] = useState("");
    const [nickname, setNickname] = useState("");
    const [role, setRole] = useState("");
    const router = useRouter();

    const userId = typeof window !== "undefined" ? sessionStorage.getItem("user_id") : null;

    useEffect(() => {
        if (!userId) { router.push("/"); return; }
        setUsername(sessionStorage.getItem("username") || "");
        setRole(sessionStorage.getItem("role") || "user");

        // Fetch nickname
        axios.get(`/api/v1/user-data/${userId}`)
            .then(res => setNickname(res.data.nickname || ""))
            .catch(() => { });

        const fetchLedger = async () => {
            try {
                const accountRes = await axios.get(`/api/v1/accounts/${userId}`);
                const accId = accountRes.data.id;
                setAccountId(accId);

                const res = await axios.get(`/api/v1/transactions/${accId}`);
                const data = res.data.transactions ? res.data.transactions : res.data;
                setTransactions(data);
                setFiltered(data);
            } catch (err) {
                console.error("Failed to fetch ledger", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLedger();
    }, [router, userId]);

    // Filter + search
    useEffect(() => {
        let result = [...transactions];
        if (filterType === "sent") result = result.filter(tx => String(tx.sender_id) === String(accountId));
        if (filterType === "received") result = result.filter(tx => String(tx.sender_id) !== String(accountId));
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(tx => {
                const note = (tx.transfer_note || "").toLowerCase();
                const receiver = (tx.receiver_account || "").toLowerCase();
                const sender = (tx.sender_account || "").toLowerCase();
                const amt = String(tx.amount);
                const ref = `txn-${tx.id}`.toLowerCase();
                const dateStr = tx.timestamp ? new Date(tx.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toLowerCase() : "";

                return note.includes(q) || receiver.includes(q) || sender.includes(q) || amt.includes(q) || ref.includes(q) || dateStr.includes(q);
            });
        }
        setFiltered(result);
    }, [search, filterType, transactions, accountId]);

    const handleLogout = () => { sessionStorage.clear(); router.push("/"); };

    // Stats
    const totalSent = transactions.filter(t => String(t.sender_id) === String(accountId)).reduce((s, t) => s + Number(t.amount), 0);
    const totalReceived = transactions.filter(t => String(t.sender_id) !== String(accountId)).reduce((s, t) => s + Number(t.amount), 0);

    return (
        <>
            <style>{`

        /* ── Page header ── */
        .sx-page-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 24px; border-bottom: 1px solid #1A1A1A; flex-wrap: wrap; gap: 20px; }
        .sx-page-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #F0F0F0; }
        .sx-page-sub { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #3A3A3A; letter-spacing: 0.06em; margin-top: 3px; }

        /* ── Summary strip ── */
        .lg-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
        .lg-summary-card { background: #0D0D0D; border: 1px solid #1A1A1A; border-radius: 16px; padding: 20px 22px; transition: border-color 0.3s, transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s; position: relative; overflow: hidden;
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12); }
        .lg-summary-card::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, rgba(17,95,232,0.25), transparent); opacity: 0; transition: opacity 0.3s; }
        .lg-summary-card:hover { border-color: rgba(17,95,232,0.15); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
        .lg-summary-card:hover::after { opacity: 1; }
        .lg-summary-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #6B6B6B; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
        .lg-summary-value { font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 500; letter-spacing: -0.03em; color: #F0F0F0; }
        .lg-summary-value.blue { color: #115fe8; }
        .lg-summary-value.red { color: #FF453A; }

        /* ── Toolbar ── */
        .lg-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .lg-search { position: relative; flex: 1; min-width: 200px; }
        .lg-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #3A3A3A; pointer-events: none; }
        .lg-search input { width: 85%; background: #0D0D0D; border: 1px solid #1A1A1A; border-radius: 8px; color: #F0F0F0; font-family: 'JetBrains Mono', monospace; font-size: 12px; padding: 10px 14px 10px 38px; outline: none; transition: border-color 0.3s, box-shadow 0.3s; caret-color: #115fe8; }
        .lg-search input:focus { border-color: rgba(17,95,232,0.4); box-shadow: 0 0 0 3px rgba(17,95,232,0.06); }
        .lg-search input::placeholder { color: #2A2A2A; }

        .lg-filter-group { display: flex; gap: 0; border: 1px solid #1A1A1A; border-radius: 6px; overflow: hidden; }
        .lg-filter-btn { background: #0D0D0D; border: none; color: #6B6B6B; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.06em; padding: 10px 14px; cursor: pointer; transition: background 0.12s, color 0.12s; text-transform: uppercase; border-right: 1px solid #1A1A1A; }
        .lg-filter-btn:last-child { border-right: none; }
        .lg-filter-btn:hover { background: #141414; color: #F0F0F0; }
        .lg-filter-btn.active { background: rgba(17,95,232,0.08); color: #115fe8; }

        .lg-count { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #3A3A3A; margin-left: auto; }

        /* ── Table ── */
        .lg-table { background: #0D0D0D; border: 1px solid #1A1A1A; border-radius: 16px; width: 100%; margin-bottom: 40px; }
        .lg-table::-webkit-scrollbar { width: 6px; }
        .lg-table::-webkit-scrollbar-track { background: #0D0D0D; }
        .lg-table::-webkit-scrollbar-thumb { background: #1A1A1A; border-radius: 4px; }
        .lg-table::-webkit-scrollbar-thumb:hover { background: #2A2A2A; }
        
        .lg-header { display: grid; grid-template-columns: 48px 1fr 1.2fr 140px 140px; gap: 0; padding: 12px 24px; border-bottom: 1px solid #1A1A1A; background: #0A0A0A; position: sticky; top: 0; z-index: 10;
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12); 
         }
        .lg-header-cell { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #3A3A3A; display: flex; align-items: center; }

        .lg-row { display: grid; grid-template-columns: 48px 1fr 1.2fr 140px 140px; gap: 0; padding: 14px 24px; border-bottom: 1px solid #111; transition: background 0.2s, padding-left 0.2s; align-items: center; }
        .lg-row:last-child { border-bottom: none; }
        .lg-row:hover { background: rgba(17,95,232,0.03); padding-left: 28px; }

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

        .lg-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 24px; color: #3A3A3A; font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 0.06em; gap: 10px; }

        /* ── Skeleton ── */
        .lg-skel { background: linear-gradient(90deg, #141414 25%, #1E1E1E 50%, #141414 75%); background-size: 200% 100%; animation: skel 1.4s ease-in-out infinite; border-radius: 4px; height: 12px; }
        @keyframes skel { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        @media (max-width: 1024px) {
          .lg-summary { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 640px) {
          .lg-toolbar { flex-direction: column; align-items: stretch; }
          .lg-search { width: 100%; }
          .lg-filter-group { width: 100%; justify-content: center; }
          .lg-summary { grid-template-columns: 1fr; }
          .sx-page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .lg-header, .lg-row { grid-template-columns: 40px 1fr 100px; padding: 12px 16px; }
          .lg-header-cell:nth-child(3), .lg-row .lg-cell:nth-child(3),
          .lg-header-cell:nth-child(4), .lg-row .lg-cell:nth-child(4) { display: none; }
        }



      `}</style>

            <div className="sx-shell">
                <Sidebar username={username} nickname={nickname} role={role} onLogout={handleLogout} />

                <main className="sx-main">

                    {/* Page header */}
                    <div className="sx-page-header sx-fade" style={{ animationDelay: "0.05s" }}>
                        <div>
                            <div className="sx-page-title">Transactions</div>
                            <div className="sx-page-sub">Transaction history · {filtered.length} records</div>
                        </div>
                    </div>

                    {/* Summary cards */}
                    <div className="lg-summary sx-fade" style={{ animationDelay: "0.1s" }}>
                        <div className="lg-summary-card">
                            <div className="lg-summary-label"><Activity size={12} /> Total Transactions</div>
                            <div className="lg-summary-value">{loading ? "—" : transactions.length}</div>
                        </div>
                        <div className="lg-summary-card">
                            <div className="lg-summary-label"><ArrowDownLeft size={12} /> Total Received</div>
                            <div className="lg-summary-value blue">
                                {loading ? "—" : `₹${totalReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                            </div>
                        </div>
                        <div className="lg-summary-card">
                            <div className="lg-summary-label"><ArrowUpRight size={12} /> Total Sent</div>
                            <div className="lg-summary-value red">
                                {loading ? "—" : `₹${totalSent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="lg-toolbar sx-fade" style={{ animationDelay: "0.15s" }}>
                        <div className="lg-search">
                            <Search size={14} className="lg-search-icon" />
                            <input
                                type="text"
                                placeholder="Search by account, note, amount..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="lg-filter-group">
                            {[
                                { key: "all", label: "All" },
                                { key: "received", label: "Received" },
                                { key: "sent", label: "Sent" },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    className={`lg-filter-btn${filterType === key ? " active" : ""}`}
                                    onClick={() => setFilterType(key)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <span className="lg-count">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
                    </div>

                    {/* Table */}
                    <div className="lg-table sx-fade" style={{ animationDelay: "0.2s" }}>
                        <div className="lg-header">
                            <div className="lg-header-cell">Type</div>
                            <div className="lg-header-cell">Account</div>
                            <div className="lg-header-cell">Note</div>
                            <div className="lg-header-cell">Date</div>
                            <div className="lg-header-cell" style={{ justifyContent: "flex-end" }}>Amount</div>
                        </div>

                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                        ) : filtered.length === 0 ? (
                            <div className="lg-empty">
                                <Activity size={28} />
                                {search || filterType !== "all"
                                    ? "No transactions match your filters"
                                    : "No transactions found"
                                }
                            </div>
                        ) : (
                            filtered.map((tx, i) => {
                                const outgoing = String(tx.sender_id) === String(accountId);
                                const counterparty = outgoing ? tx.receiver_account : tx.sender_account;
                                const amt = Number(tx.amount);
                                const amtStr = outgoing
                                    ? `−₹${amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                                    : `+₹${amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
                                const date = tx.timestamp
                                    ? new Date(tx.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })
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
                                            {/* VULNERABILITY #6: STORED XSS — raw HTML rendering */}
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
                </main>
            </div>
        </>
    );
}