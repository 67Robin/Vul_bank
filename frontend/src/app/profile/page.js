"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { 
    LayoutDashboard, 
    ArrowLeftRight, 
    ClipboardList, 
    ShieldAlert, 
    LogOut, 
    User, 
    Mail, 
    CreditCard, 
    Calendar, 
    Trophy,
    RefreshCw,
    Check,
    Copy,
    Landmark,
    ShieldCheck,
    LifeBuoy,
    ShoppingCart,
    Hash,
    BookOpen
} from "lucide-react";

/* ─────────────────────────────────────────
   HELPER COMPONENTS
───────────────────────────────────────── */

function Sidebar({ username, nickname, role, onLogout }) {
    const router = useRouter();
    const [active, setActive] = useState("profile");

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
                {nav.map(({ id, label, icon: Icon, path }) => (
                    <button key={id} className={`sx-sb-link${active === id ? " active" : ""}`} onClick={() => { setActive(id); router.push(path); }}>
                        <Icon size={15} /><span>{label}</span>
                        {active === id && <div className="sx-sb-pip" />}
                    </button>
                ))}
            </nav>

            <button className="sx-sb-logout" onClick={onLogout}><LogOut size={14} /><span>LogOut</span></button>
        </aside>
    );
}

function ProfileDetail({ label, value, icon: Icon, color = "#6B6B6B" }) {
    return (
        <div className="sx-detail-row">
            <div className="sx-detail-icon">
                <Icon size={16} color={color} />
            </div>
            <div className="sx-detail-content">
                <span className="sx-detail-label">{label}</span>
                <span className="sx-detail-value">{value}</span>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   PROFILE PAGE
───────────────────────────────────────── */

export default function ProfilePage() {
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState("");
    const [nickname, setNickname] = useState("");
    const [role, setRole] = useState("");
    const [newNick, setNewNick] = useState("");
    const [updateLoading, setUpdateLoading] = useState(false);
    const [msg, setMsg] = useState("");
    
    // Shield States
    const [shieldLoading, setShieldLoading] = useState(false);
    const [shieldMsg, setShieldMsg] = useState("");
    const [shieldMsgColor, setShieldMsgColor] = useState("#00FF9D");

    useEffect(() => {
        const userId = sessionStorage.getItem("user_id");
        const uname = sessionStorage.getItem("username");
        const urole = sessionStorage.getItem("role");

        if (!userId) { router.push("/"); return; }
        setUsername(uname || "");
        setRole(urole || "user");

        const fetchData = async () => {
            try {
                const [userRes, accRes] = await Promise.all([
                    axios.get(`/api/v1/user-data/${userId}`),
                    axios.get(`/api/v1/accounts/${userId}`)
                ]);
                setUserData(userRes.data);
                setNickname(userRes.data.nickname || "");
                setNewNick(userRes.data.nickname || "");
                setAccount(accRes.data);
            } catch (err) {
                console.error("Failed to fetch profile data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleLogout = () => {
        sessionStorage.clear();
        router.push("/");
    };

    const handleUpdateNickname = async (e) => {
        e.preventDefault();
        setUpdateLoading(true);
        setMsg("");
        const userId = sessionStorage.getItem("user_id");
        try {
            const formData = new FormData();
            formData.append("user_id", userId);
            formData.append("nickname", newNick);
            await axios.post("/api/v1/update_profile", formData);
            setMsg("Profile updated successfully.");
            setNickname(newNick);
        } catch (err) {
            setMsg("Update failed.");
        } finally {
            setUpdateLoading(false);
        }
    };

    // --- NEW: Shield Activation Logic ---
    const handleActivateShield = async () => {
        setShieldLoading(true);
        setShieldMsg("");
        const userId = sessionStorage.getItem("user_id");
        try {
            const res = await axios.post("/api/v1/buy-immunity", {}, {
                headers: { Authorization: `Bearer ${userId}` }
            });
            setShieldMsg(res.data.message);
            setShieldMsgColor("#00FF9D"); // Green for success
            
            // Refresh account balance after purchase
            const [accRes, userRes] = await Promise.all([axios.get(`/api/v1/accounts/${userId}`), 
                                                        axios.get(`/api/v1/user-data/${userId}`)])
            setAccount(accRes.data);
            setUserData(userRes.data);
        } catch (err) {
            setShieldMsg(err.response?.data?.detail || "Failed to activate shield.");
            setShieldMsgColor("#FF453A"); // Red for error
        } finally {
            setShieldLoading(false);
        }
    };

    if (loading) return (
        <div style={{ background: '#050505', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#115fe8', fontFamily: 'JetBrains Mono' }}>
            <RefreshCw className="sx-spin" />
        </div>
    );

    return (
        <>
            <style>{`

                /* ── Page header ── */
                .sx-page-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 24px; border-bottom: 1px solid #1A1A1A; flex-wrap: wrap; gap: 20px; }
                .sx-page-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: #F0F0F0; }
                
                /* ── Profile Card ── */
                .sx-profile-card { background: #0D0D0D; border: 1px solid #1A1A1A; border-radius: 16px; padding: 40px; position: relative; overflow: hidden; display: grid; grid-template-columns: 1fr 1.5fr; gap: 60px;
                  backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12);
                }
                .sx-profile-card::before { content: ''; position: absolute; top: 0; right: 0; width: 300px; height: 300px; background: radial-gradient(circle at top right, rgba(17,95,232,0.05), transparent 70%); pointer-events: none; }
                
                .sx-profile-left { display: flex; flex-direction: column; align-items: center; text-align: center; border-right: 1px solid #1A1A1A; padding-right: 60px; gap: 5px;}
                .sx-profile-avatar { width: 120px; height: 120px; border-radius: 24px; background: linear-gradient(135deg, #115fe8 0%, #0943f0 100%); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 42px; font-weight: 800; color: #FFF; margin-bottom: 24px; box-shadow: 0 12px 24px rgba(9,67,240,0.2); position: relative; }
                .sx-profile-avatar::after { content: ''; position: absolute; inset: -8px; border: 2px solid rgba(17,95,232,0.1); border-radius: 32px; }
                
                .sx-profile-name { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 700; color: #F0F0F0; margin-bottom: 6px; }
                .sx-profile-role { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.15em; color: #115fe8; text-transform: uppercase; font-weight: 600; background: rgba(17,95,232,0.1); padding: 4px 12px; border-radius: 20px; margin-bottom: 32px; }
                
                .sx-profile-right { display: flex; flex-direction: column; gap: 24px; }
                .sx-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px; }
                .sx-detail-row { display: flex; gap: 16px; align-items: center; }
                .sx-detail-icon { width: 40px; height: 40px; border-radius: 16px; background: #141414; border: 1px solid #1E1E1E; display: flex; align-items: center; justify-content: center;backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12); }
                .sx-detail-content { display: flex; flex-direction: column; gap: 4px; }
                .sx-detail-label { font-size: 10px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.1em; color: #3A3A3A; }
                .sx-detail-value { font-size: 14px; color: #C0C0C0; font-family: 'Inter', sans-serif; }

                .sx-edit-section { margin-top: 32px; padding-top: 32px; border-top: 1px solid #1A1A1A; }
                .sx-edit-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 600; color: #F0F0F0; margin-bottom: 16px; }
                .sx-form-row { display: flex; gap: 12px; }
                .sx-input { flex: 1; background: #141414; border: 1px solid #1E1E1E; border-radius: 16px; color: #F0F0F0; padding: 12px 16px; font-family: 'Inter', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s; }
                .sx-input:focus { border-color: #115fe8; }
                .sx-btn-save { background: #115fe8; color: #FFF; border: none; border-radius: 16px; padding: 0 24px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px;backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.28),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12); }
                .sx-btn-save:hover { background: #0d4fd0; transform: translateY(-1px);backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12); }
                .sx-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
                
                /* ── NEW: Shield Box Styles ── */
                .sx-shield-box { background: rgba(0, 255, 157, 0.05); padding: 20px; border-radius: 16px; margin-top: 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12);}
                .sx-shield-text h4 { margin: 0 0 4px 0; color: #00FF9D; font-family: 'Syne', sans-serif; font-size: 16px; display: flex; align-items: center; gap: 6px; }
                .sx-shield-text p { margin: 0; color: #A0A0A0; font-size: 12px; }
                .sx-btn-shield { background: #050505; color: #00FF9D; border: 1px solid #d6d6d643; border-radius: 16px; padding: 10px 20px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px;backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12); }
                .sx-btn-shield:hover:not(:disabled) { background: rgba(0, 255, 157, 0.1); transform: translateY(-1px);backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12); }
                .sx-btn-shield:disabled { opacity: 0.4; cursor: not-allowed; border-color: #333; color: #666; }

                @media (max-width: 1024px) {
                    .sx-profile-card { grid-template-columns: 1fr; gap: 40px; }
                    .sx-profile-left { border-right: none; border-bottom: 1px solid #1A1A1A; padding-right: 0; padding-bottom: 40px; }
                }

                @media (max-width: 640px) {
                    .sx-detail-grid { grid-template-columns: 1fr; }
                    .sx-shield-box { flex-direction: column; align-items: flex-start; }
                }
            `}</style>

            <div className="sx-shell">
                <Sidebar username={username} nickname={nickname} role={role} onLogout={handleLogout} />

                <main className="sx-main">
                    <div className="sx-page-header sx-fade" style={{ animationDelay: '0.1s' }}>
                        <div className="sx-page-title">Profile</div>
                    </div>

                    <div className="sx-profile-card sx-fade" style={{ animationDelay: '0.2s' }}>
                        <div className="sx-profile-left">
                            <div className="sx-profile-avatar">
                                {(username || "?").slice(0, 2).toUpperCase()}
                            </div>
                            <h2 className="sx-profile-name" dangerouslySetInnerHTML={{ __html: nickname || username }} />
                            <div className={`sx-profile-role ${role === "manager" ? "manager" : ""}`}>
                                {role === "manager" && <ShieldCheck size={12} style={{ marginRight: 4 }} />}
                                {role.toUpperCase()}
                            </div>
                            
                            <div style={{ textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <ProfileDetail label="Team Name" value={username} icon={User} />
                                <ProfileDetail label="Global UID" value={sessionStorage.getItem("user_id")} icon={Hash} />
                            </div>
                        </div>

                        <div className="sx-profile-right">
                            <div className="sx-edit-title" style={{ marginTop: 0 }}>Financial Credentials</div>
                            <div className="sx-detail-grid">
                                <ProfileDetail label="Account Number" value={account?.account_number || "—"} icon={CreditCard} color="#115fe8" />
                                <ProfileDetail label="Network Balance" value={`₹${(account?.balance || 0).toLocaleString()}`} icon={Trophy} color="#00FF9D" />
                                <ProfileDetail label="Member Since" value={userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : "—"} icon={Calendar} />
                                <ProfileDetail label="Clearance Level" value={role === "manager" ? "Level 5 - Overlord" : "Level 1 - Citizen"} icon={ShieldAlert} color={role === "manager" ? "#FF453A" : "#6B6B6B"} />
                            </div>

                                                        {/* --- NEW: Defensive Capabilities Section --- */}
                            <div className="sx-shield-box">
                                <div className="sx-shield-text">
                                    <h4><ShieldCheck size={16} /> StellarX Shield</h4>
                                    <p>Activate cyber-immunity for 1 hour. Deflects all financial attacks.</p>
                                    <p style={{ marginTop: 4, color: '#FF453A' }}>Cost: ₹5,000 + 100 Points</p>
                                </div>
                                <div>
                                    <button 
                                        className="sx-btn-shield" 
                                        onClick={handleActivateShield} 
                                        disabled={shieldLoading || account?.balance < 5000 || userData?.score < 100}
                                    >
                                        {shieldLoading ? <RefreshCw size={16} className="sx-spin" /> : 'Activate System'}
                                    </button>
                                </div>
                            </div>
                            {shieldMsg && <div style={{ fontSize: 12, color: shieldMsgColor, marginTop: 12, fontFamily: 'JetBrains Mono' }}>{shieldMsg}</div>}

                            <div className="sx-edit-section">
                                <div className="sx-edit-title">Identity Modification</div>
                                <form onSubmit={handleUpdateNickname} className="sx-form-row">
                                    <input 
                                        className="sx-input" 
                                        value={newNick} 
                                        onChange={e => setNewNick(e.target.value)} 
                                        placeholder="Update your alias..."
                                    />
                                    <button className="sx-btn-save" type="submit" disabled={updateLoading}>
                                        {updateLoading ? <RefreshCw size={14} className="sx-spin" /> : <><Check size={14} /> Save</>}
                                    </button>
                                </form>
                                {msg && <div style={{ fontSize: 11, color: '#115fe8', marginTop: 12, fontFamily: 'JetBrains Mono' }}>{msg}</div>}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}