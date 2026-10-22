"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { 
    LayoutDashboard, 
    ArrowLeftRight, 
    ClipboardList, 
    ShieldAlert, 
    LogOut,  
    MessageSquare,  
    LifeBuoy, 
    HelpCircle, 
    ExternalLink,
    Send,
    RefreshCw,
    Check,
    Landmark,
    Zap,
    Globe,
    ShoppingCart,
    BookOpen
} from "lucide-react";

/* ─────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────── */
function Sidebar({ username, nickname, role, onLogout }) {
    const router = useRouter();
    // Tracks the live URL path id directly from Next.js (e.g. "/transfer" becomes "transfer")
    const currentPathId = router.pathname === "/" || !router.pathname
        ? "support"
        : router.pathname.split("/")[1] || "support";


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

function SupportCard({ title, desc, icon: Icon, color = "#115fe8" }) {
    return (
        <div className="su-card sx-fade">
            <div className="su-card-icon" style={{ background: `${color}15`, color: color, borderColor: `${color}25` }}>
                <Icon size={20} />
            </div>
            <div className="su-card-title">{title}</div>
            <div className="su-card-desc">{desc}</div>
            <button className="su-card-btn">Open Link <ExternalLink size={12} /></button>
        </div>
    );
}

/* ─────────────────────────────────────────
   SUPPORT PAGE
───────────────────────────────────────── */

export default function SupportPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState("");
    const [nickname, setNickname] = useState("");
    const [role, setRole] = useState("");
    const [ticket, setTicket] = useState({ subject: "", category: "technical", message: "" });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const userId = sessionStorage.getItem("user_id");
        const uname = sessionStorage.getItem("username");
        const urole = sessionStorage.getItem("role");

        if (!userId) { router.push("/"); return; }
        setUsername(uname || "");
        setRole(urole || "user");

        // Simulate data load for animations
        const t = setTimeout(() => setLoading(false), 300);
        
        // Fetch nickname if available
        axios.get(`/api/v1/user-data/${userId}`)
            .then(res => setNickname(res.data.nickname))
            .catch(() => {});

        return () => clearTimeout(t);
    }, [router]);

    const handleLogout = () => {
        sessionStorage.clear();
        router.push("/");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setSubmitting(false);
            setSubmitted(true);
            setTicket({ subject: "", category: "technical", message: "" });
            setTimeout(() => setSubmitted(false), 5000);
        }, 1500);
    };

    return (
        <>
            <style>{`


                /* ── Page header ── */
                .sx-page-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 24px; border-bottom: 1px solid #1A1A1A; flex-wrap: wrap; gap: 20px; }
                .sx-page-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: #F0F0F0; }
                
                /* ── Support Grid ── */
                .su-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
                .su-card { background: #0D0D0D; border: 1px solid #1A1A1A; border-radius: 16px; padding: 28px; transition: border-color 0.3s, transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s; position: relative; overflow: hidden;
                 backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12);
                }
                .su-card::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, rgba(17,95,232,0.25), transparent); opacity: 0; transition: opacity 0.3s; }
                .su-card:hover { border-color: rgba(17,95,232,0.15); transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
                .su-card:hover::after { opacity: 1; }
                .su-card-icon { width: 44px; height: 44px; border-radius: 10px; border: 1px solid transparent; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
                .su-card-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #F0F0F0; margin-bottom: 8px; }
                .su-card-desc { font-size: 12px; color: #6B6B6B; line-height: 1.6; margin-bottom: 20px; }
                .su-card-btn { background: none; border: none; color: #115fe8; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; padding: 0; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'JetBrains Mono', monospace; }

                /* ── Ticket Form ── */
                .su-ticket-wrap { background: #0D0D0D; border: 1px solid #1A1A1A; border-radius: 16px; padding: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 48px;backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12); }
                .su-ticket-info h3 { font-family: 'Syne', sans-serif; font-size: 20px; margin-bottom: 12px; }
                .su-ticket-info p { font-size: 13px; color: #6B6B6B; line-height: 1.6; margin-bottom: 24px; }
                
                .su-status-pill { display: flex; align-items: center; gap: 8px; font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #00FF9D; background: rgba(0,255,157,0.05); padding: 6px 12px; border-radius: 20px; border: 1px solid rgba(0,255,157,0.1); width: fit-content; }
                .su-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #00FF9D; box-shadow: 0 0 8px #00FF9D; animation: pulse 2s infinite; }
                @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }

                .su-form { display: flex; flex-direction: column; gap: 16px; }
                .su-form-group { display: flex; flex-direction: column; gap: 8px border-radius:16px; }
                .su-label { font-size: 10px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.1em; color: #3A3A3A; font-weight: 600; }
                .su-input, .su-select, .su-textarea { background: #141414; border: 1px solid #1E1E1E; border-radius: 8px; color: #F0F0F0; padding: 12px 16px; font-size: 13px; outline: none; transition: border-color 0.3s, box-shadow 0.3s; font-family: inherit; }
                .su-input:focus, .su-select:focus, .su-textarea:focus { border-color: rgba(17,95,232,0.4); box-shadow: 0 0 0 3px rgba(17,95,232,0.06); }
                .su-textarea { min-height: 120px; resize: none; }
                
                .su-submit { background: #115fe8; color: #FFF; border: none; border-radius: 24px; padding: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; font-family: 'Syne', sans-serif; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 8px;backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12); }
                .su-submit:hover { background: #0d4fd0; transform: translateY(-2px); box-shadow: 0 6px 24px rgba(17,95,232,0.35);
                backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12); }
                .su-submit:disabled { opacity: 0.6; cursor: not-allowed; }

                .su-success { background: rgba(0,255,157,0.05); border: 1px solid rgba(0,255,157,0.1); border-radius: 8px; padding: 16px; color: #00FF9D; font-size: 13px; display: flex; align-items: center; gap: 10px; margin-top: 16px; }

                /* ── Animations ── */



                @media (max-width: 1024px) {
                    .su-ticket-wrap { grid-template-columns: 1fr; gap: 32px; }
                }
            `}</style>

            <div className="sx-shell">
                <Sidebar username={username} nickname={nickname} role={role} onLogout={handleLogout} />

                <main className="sx-main">
                    <div className="sx-page-header sx-fade" style={{ animationDelay: '0.1s' }}>
                        <div className="sx-page-title">Command & Support</div>
                    </div>

                    <div className="su-grid">
                        <SupportCard 
                            title="Direct Subspace Link" 
                            desc="Establish a high-bandwidth encrypted chat with a StellarX operative. Response time: < 4 Earth Minutes." 
                            icon={MessageSquare} 
                            color="#115fe8"
                        />
                        <SupportCard 
                            title="Galactic Archive" 
                            desc="Access our deep-space knowledge base for manuals on orbital transfers and security protocols." 
                            icon={HelpCircle} 
                            color="#00FF9D"
                        />
                        <SupportCard 
                            title="Network Status" 
                            desc="Monitor the status of our interplanetary nodes and quantum processing clusters." 
                            icon={Globe} 
                            color="#FF9F0A"
                        />
                    </div>

                    <div className="su-ticket-wrap sx-fade" style={{ animationDelay: '0.3s' }}>
                        <div className="su-ticket-info">
                            <div className="su-status-pill">
                                <div className="su-status-dot" />
                                SYSTEM OPERATIONAL
                            </div>
                            <h3 style={{ marginTop: 24 }}>Open Transmission</h3>
                            <p>If you've encountered a glitch in the simulation or a financial anomaly in your ledger, establish a new support transmission here. Our security droids will triage your request immediately.</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#C0C0C0' }}>
                                    <Zap size={14} color="#FFD700" /> Priority response for Level 5 Operatives
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#C0C0C0' }}>
                                    <ShieldAlert size={14} color="#FF453A" /> Report security breaches immediately
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="su-form">
                            <div className="su-form-group">
                                <label className="su-label">Subject of Transmission</label>
                                <input 
                                    className="su-input" 
                                    placeholder="Brief summary..." 
                                    value={ticket.subject}
                                    onChange={e => setTicket({...ticket, subject: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="su-form-group">
                                <label className="su-label">Anomaly Category</label>
                                <select 
                                    className="su-select"
                                    value={ticket.category}
                                    onChange={e => setTicket({...ticket, category: e.target.value})}
                                >
                                    <option value="technical">Technical Glitch</option>
                                    <option value="financial">Financial Anomaly</option>
                                    <option value="security">Security Protocol</option>
                                    <option value="identity">Identity Management</option>
                                </select>
                            </div>
                            <div className="su-form-group">
                                <label className="su-label">Encrypted Message Content</label>
                                <textarea 
                                    className="su-textarea" 
                                    placeholder="Describe the situation in detail..."
                                    value={ticket.message}
                                    onChange={e => setTicket({...ticket, message: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <button className="su-submit" type="submit" disabled={submitting}>
                                {submitting ? <RefreshCw className="sx-spin" size={18} /> : <><Send size={18} /> Establish Link</>}
                            </button>

                            {submitted && (
                                <div className="su-success">
                                    <Check size={18} /> Transmission established. Operative will respond shortly.
                                </div>
                            )}
                        </form>
                    </div>
                </main>
            </div>
        </>
    );
}
