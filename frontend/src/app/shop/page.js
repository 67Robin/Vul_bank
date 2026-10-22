"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
    ShoppingCart, RefreshCw, Package,
    Landmark, LayoutDashboard, ArrowLeftRight, ClipboardList,
    ShieldAlert, LogOut, LifeBuoy, Lightbulb, BookOpen,CircuitBoard
} from "lucide-react";

import { MdDeveloperBoard, MdNfc, MdSurroundSound, MdSettingsRemote, MdSettingsInputComponent, } from 'react-icons/md';
// import { } from 'react-icons/tb';
// import { } from 'react-icons/gi';

// Map database strings to actual React Icons
const IconMap = {
    "Cpu": MdDeveloperBoard,
    "RFID": MdNfc,
    "IR": MdSettingsRemote,
    "buzzer": MdSurroundSound,
    "Jumper Wire": MdSettingsInputComponent,
    "LED": Lightbulb,
    "Breadboard": CircuitBoard,
};

/* ─────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────── */
function Sidebar({ username, nickname, role, onLogout }) {
    const router = useRouter();
    // Tracks the live URL path id directly from Next.js (e.g. "/transfer" becomes "transfer")
    const currentPathId = router.pathname === "/" || !router.pathname
        ? "shop"
        : router.pathname.split("/")[1] || "shop";


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

export default function ShopPage() {
    const router = useRouter();
    const [balance, setBalance] = useState(0);
    const [score, setScore] = useState(0);
    const [inventory, setInventory] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [buyLoading, setBuyLoading] = useState(null);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [username, setUsername] = useState("");
    const [nickname, setNickname] = useState("");
    const [role, setRole] = useState("");

    // NEW: Step-Up Auth Modal State
    const [showModal, setShowModal] = useState(false);
    const [pendingItem, setPendingItem] = useState(null);
    const [authUsername, setAuthUsername] = useState("");
    const [authPassword, setAuthPassword] = useState("");

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

    const fetchData = async () => {
        const userId = sessionStorage.getItem("user_id");
        if (!userId) { router.push("/"); return; }

        setUsername(sessionStorage.getItem("username") || "");
        setRole(sessionStorage.getItem("role") || "user");

        try {
            const [accRes, invRes, userRes, shopRes] = await Promise.all([
                axios.get(`${API_URL}/api/v1/accounts/${userId}`),
                axios.get(`${API_URL}/api/v1/inventory/${userId}`),
                axios.get(`${API_URL}/api/v1/user-data/${userId}`),
                axios.get(`${API_URL}/api/v1/shop/items`)
            ]);
            setBalance(accRes.data.balance || 0);
            setInventory(invRes.data.inventory || []);
            setNickname(userRes.data.nickname || "");
            setScore(userRes.data.score || 0);
            setCatalog(shopRes.data.catalog || []);
        } catch (err) {
            console.error("Failed to load shop data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 1. Triggers when they click a buy button in the catalog
    const initiateBuy = (itemName) => {
        setPendingItem(itemName);
        setMsg({ text: "", type: "" });
        setShowModal(true);
    };

    // 2. Triggers when they submit the security modal
    const confirmSecurePurchase = async (e) => {
        e.preventDefault();
        setBuyLoading(pendingItem);
        const userId = sessionStorage.getItem("user_id");

        try {
            const formData = new FormData();
            formData.append("item_name", pendingItem);
            formData.append("auth_username", authUsername);
            formData.append("auth_password", authPassword);

            const res = await axios.post(`${API_URL}/api/v1/shop/buy`, formData, {
                headers: { Authorization: `Bearer ${userId}` }
            });

            setMsg({ text: res.data.message, type: "success" });
            setShowModal(false);
            setAuthPassword(""); // Clear sensitive input
            fetchData(); // Refresh stock, balance, and inventory
        } catch (err) {
            setMsg({
                text: err.response?.data?.detail || "Security Authorization Failed.",
                type: "error"
            });
            // Intentionally keeping the modal open so they see it failed
        } finally {
            setBuyLoading(null);
        }
    };

    const handleLogout = () => { sessionStorage.clear(); router.push("/"); };

    return (
        <>
            <style>{`
                .sx-page-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 24px; border-bottom: 1px solid #1A1A1A; flex-wrap: wrap; gap: 20px; }
                .sx-page-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #F0F0F0; }
                .sx-page-sub { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #3A3A3A; letter-spacing: 0.06em; margin-top: 3px; }
                
                .sx-shop-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 24px; margin-bottom: 40px; }
                .sx-shop-card { background: #0D0D0D; border: 1px solid #1A1A1A; border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 15px; transition: border-color 0.3s, transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s; position: relative; overflow: hidden;
                backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12); }
                .sx-shop-card:hover { border-color: rgba(17,95,232,0.15); transform: translateY(-4px); box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(17,95,232,0.08);backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12);
          animation: float-anim 2s ease-in-out infinite; }

                 @keyframes float-anim {
    0%, 100% { transform: translateY(0px) scale(1.05); }
    50% { transform: translateY(-8px) scale(1.05); } /* Lift 6px */
}
                .sx-shop-card:hover { border-color: rgba(17,95,232,0.15); transform: translateY(-4px); box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(17,95,232,0.08);backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12); }
                
                .sx-btn-primary { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 18px; background: #115fe8; color: #ffffff; border: none; border-radius: 16px; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; transition: background 0.15s, transform 0.12s; font-family: 'Syne', sans-serif;
                backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12); }
                }
                .sx-btn-primary:hover:not(:disabled) { background: #0d4fd0; box-shadow: 0 4px 20px rgba(17,95,232,0.3), 0 0 0 1px rgba(17,95,232,0.15); transform: translateY(-1px));
                backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12); } }
                .sx-btn-primary:active:not(:disabled) { transform: scale(0.97) translateY(0); box-shadow: none; }
                .sx-btn-primary:disabled { background: #1A1A1A; color: #6B6B6B; cursor: not-allowed; }

                .sx-ledger-card { background: #0D0D0D; border: 1px solid #1A1A1A; border-radius: 16px; transition: border-color 0.3s;
                backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12); }
                .sx-ledger-card:hover { border-color: #222; }
                .sx-ledger-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-bottom: 1px solid #1A1A1A; }
                .sx-ledger-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #F0F0F0; letter-spacing: -0.01em; }
            `}</style>

            <div className="sx-shell">
                <Sidebar username={username} nickname={nickname} role={role} onLogout={handleLogout} />

                <main className="sx-main">
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#115fe8' }}>
                            <RefreshCw size={24} className="sx-spin" />
                        </div>
                    ) : (
                        <>
                            <div className="sx-page-header sx-fade" style={{ animationDelay: "0.05s" }}>
                                <div>
                                    <div className="sx-page-title" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <ShoppingCart size={24} color="#115fe8" /> Black Market Shop
                                    </div>
                                    <div className="sx-page-sub">Purchase hardware to flex your stolen wealth.</div>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', gap: '20px' }}>
                                    <div>
                                        <div className="sx-page-sub" style={{ textTransform: 'uppercase', marginBottom: '4px' }}>AVAILABLE POINTS</div>
                                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '20px', color: 'Red', fontWeight: 'bold' }}>{score.toLocaleString()} PTS</div>
                                    </div>
                                    <div>
                                        <div className="sx-page-sub" style={{ textTransform: 'uppercase', marginBottom: '4px' }}>AVAILABLE FUNDS</div>
                                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '20px', color: 'silver', fontWeight: 'bold' }}>₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                                    </div>
                                </div>
                            </div>

                            {msg.text && (
                                <div className="sx-fade" style={{ animationDelay: "0.1s", padding: '15px', marginTop: '24px', borderRadius: '8px', background: msg.type === 'success' ? 'rgba(0, 255, 157, 0.1)' : 'rgba(255, 69, 58, 0.1)', color: msg.type === 'success' ? '#00FF9D' : '#FF453A', border: `1px solid ${msg.type === 'success' ? '#00FF9D' : '#FF453A'}`, fontFamily: 'JetBrains Mono, monospace', fontSize: '14px' }}>
                                    {msg.text}
                                </div>
                            )}

                            <div className="sx-shop-grid sx-fade" style={{ animationDelay: "0.15s" }}>
                                {catalog.map((item) => {
                                    const IconComponent = IconMap[item.icon] || Package;
                                    const isOutOfStock = item.stock <= 0;
                                    const cannotAfford = balance < item.cost || score < item.point_cost;

                                    return (
                                        <div key={item.name} className="sx-shop-card" style={{ opacity: isOutOfStock ? 0.6 : 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '48px', height: '48px', background: 'rgba(17, 95, 232, 0.1)', border: '1px solid rgba(17, 95, 232, 0.3)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#115fe8' }}>
                                                    <IconComponent size={24} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#F0F0F0', fontFamily: 'Syne, sans-serif' }}>{item.name}</div>
                                                    <div style={{ fontSize: '12px', color: '#6B6B6B', fontFamily: 'Inter, sans-serif' }}>{item.description}</div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '15px', borderTop: '1px dashed #1A1A1A' }}>
                                                <div>
                                                    <div style={{ color: 'Red', fontWeight: 'bold', fontFamily: 'JetBrains Mono, monospace' }}>
                                                        ₹{item.cost.toLocaleString()}
                                                    </div>
                                                    <div style={{ color: 'silver', fontWeight: 'bold', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', marginTop: '2px' }}>
                                                        {item.point_cost} PTS
                                                    </div>
                                                    <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', marginTop: '4px', color: isOutOfStock ? '#FF453A' : '#6B6B6B' }}>
                                                        {isOutOfStock ? 'OUT OF STOCK' : `Stock: ${item.stock} left`}
                                                    </div>
                                                </div>
                                                <button
                                                    className="sx-btn-primary"
                                                    onClick={() => initiateBuy(item.name)}
                                                    disabled={buyLoading === item.name || cannotAfford || isOutOfStock}
                                                >
                                                    {buyLoading === item.name ? <RefreshCw size={14} className="sx-spin" /> : 'Purchase'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="sx-ledger-card sx-fade" style={{ animationDelay: "0.2s" }}>
                                <div className="sx-ledger-header">
                                    <div className="sx-ledger-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Package size={16} /> Your Rig Inventory
                                    </div>
                                </div>
                                <div style={{ padding: '24px' }}>
                                    {inventory.length === 0 ? (
                                        <p style={{ color: '#6B6B6B', fontStyle: 'italic', fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>Your rack is currently empty. Buy some hardware.</p>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                            {inventory.map((invItem) => (
                                                <div key={invItem.item_name} style={{ background: '#141414', border: '1px solid #1E1E1E', padding: '12px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'JetBrains Mono, monospace' }}>
                                                    <span style={{ color: '#115fe8', fontSize: '13px' }}>{invItem.item_name}</span>
                                                    <span style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', color: '#F0F0F0' }}>x{invItem.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* STEP-UP AUTHENTICATION OVERLAY */}
                            {showModal && (
                                <div style={{
                                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'rgba(0,0,0,0.85)', zIndex: 999,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    backdropFilter: 'blur(8px)'
                                }}>
                                    <div style={{
                                        background: '#0D0D0D', border: '1px solid #FF453A',
                                        borderRadius: '12px', padding: '30px', width: '400px',
                                        maxWidth: '90%', boxShadow: '0 10px 40px rgba(255, 69, 58, 0.15)'
                                    }}>
                                        <div style={{
                                            color: '#FF453A', display: 'flex', alignItems: 'center', gap: '10px',
                                            marginBottom: '15px', fontFamily: 'Syne, sans-serif',
                                            fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase'
                                        }}>
                                            <ShieldAlert size={24} /> Security Verification
                                        </div>

                                        <p style={{ color: '#6B6B6B', fontSize: '13px', marginBottom: '20px', fontFamily: 'Inter, sans-serif' }}>
                                            Authorizing transfer for <span style={{ color: '#F0F0F0', fontFamily: 'JetBrains Mono, monospace' }}>{pendingItem}</span>. Please verify your credentials.
                                        </p>

                                        <form onSubmit={confirmSecurePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <input
                                                type="text"
                                                placeholder="Team Name"
                                                value={authUsername}
                                                onChange={(e) => setAuthUsername(e.target.value)}
                                                required
                                                style={{
                                                    background: '#141414', border: '1px solid #1A1A1A', padding: '14px',
                                                    color: '#F0F0F0', borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace',
                                                    outline: 'none'
                                                }}
                                            />
                                            <input
                                                type="password"
                                                placeholder="Password"
                                                value={authPassword}
                                                onChange={(e) => setAuthPassword(e.target.value)}
                                                required
                                                style={{
                                                    background: '#141414', border: '1px solid #1A1A1A', padding: '14px',
                                                    color: '#F0F0F0', borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace',
                                                    outline: 'none'
                                                }}
                                            />

                                            {msg.type === 'error' && (
                                                <div style={{ color: '#FF453A', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', }}>
                                                    {msg.text}
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                <button
                                                    type="submit"
                                                    disabled={buyLoading === pendingItem}
                                                    style={{
                                                        flex: 1, background: '#FF453A', color: '#fff', border: 'none',
                                                        padding: '12px', borderRadius: '16px', fontWeight: 'bold',
                                                        cursor: 'pointer', fontFamily: 'Syne, sans-serif', letterSpacing: '0.05em', backdropFilter: 'blur(6px)',
                                                        WebkitBackdropFilter: 'blur(8px)', boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.98), inset 0 -1px 2px rgba(39, 38, 38, 0.184), 0 12px 32px rgba(12, 12, 12, 0.12)'
                                                    }}
                                                >
                                                    {buyLoading === pendingItem ? 'VERIFYING...' : 'AUTHORIZE'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowModal(false)}
                                                    style={{
                                                        flex: 1, background: '#1A1A1A', color: '#F0F0F0', border: 'none',
                                                        padding: '12px', borderRadius: '16px', fontWeight: 'bold',
                                                        cursor: 'pointer', fontFamily: 'Syne, sans-serif', letterSpacing: '0.05em', backdropFilter: 'blur(6px)',
                                                        WebkitBackdropFilter: 'blur(8px)', boxShadow: 'inset 0 1px 1px rgba(196, 196, 196, 0.51), inset 0 -1px 2px rgba(39, 38, 38, 0.184), 0 12px 32px rgba(12, 12, 12, 0.12)'
                                                    }}
                                                >
                                                    CANCEL
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </>
    );
}