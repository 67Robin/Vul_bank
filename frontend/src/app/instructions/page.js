"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
    LayoutDashboard, 
    ArrowLeftRight, 
    ClipboardList, 
    ShieldAlert, 
    LogOut,  
    LifeBuoy, 
    ShoppingCart,
    BookOpen,
    Landmark,
    Terminal,
    AlertTriangle,
    Flag
} from "lucide-react";

/* ─────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────── */
function Sidebar({ username, nickname, role, onLogout }) {
    const router = useRouter();
    // Tracks the live URL path id directly from Next.js (e.g. "/transfer" becomes "transfer")
    const currentPathId = router.pathname === "/" || !router.pathname
        ? "instructions"
        : router.pathname.split("/")[1] || "instructions";


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

function InstructionCard({ title, desc, icon: Icon, color = "#115fe8" }) {
    return (
        <div className="ins-card sx-fade">
            <div className="ins-card-icon" style={{ background: `${color}15`, color: color, borderColor: `${color}25` }}>
                <Icon size={20} />
            </div>
            <div className="ins-card-title">{title}</div>
            <div className="ins-card-desc">{desc}</div>
        </div>
    );
}

export default function InstructionsPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [nickname, setNickname] = useState("");
    const [role, setRole] = useState("");

    useEffect(() => {
        const userId = sessionStorage.getItem("user_id");
        const uname = sessionStorage.getItem("username");
        const urole = sessionStorage.getItem("role");

        if (!userId) { router.push("/"); return; }
        setUsername(uname || "");
        setRole(urole || "user");
    }, [router]);

    const handleLogout = () => {
        sessionStorage.clear();
        router.push("/");
    };

    return (
        <>
            <style>{`
                .sx-page-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 24px; border-bottom: 1px solid #1A1A1A; flex-wrap: wrap; gap: 20px; }
                .sx-page-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: #F0F0F0; }
                
                .ins-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 24px; }
                .ins-card { background: #0D0D0D; border: 1px solid #1A1A1A; border-radius: 16px; padding: 28px; transition: border-color 0.3s, transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s; position: relative; overflow: hidden;
                 backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.224),
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),
          0 12px 32px rgba(12, 12, 12, 0.12);
                }
                .ins-card::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, rgba(17,95,232,0.25), transparent); opacity: 0; transition: opacity 0.3s; }
                .ins-card:hover { border-color: rgba(17,95,232,0.15); transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
                .ins-card:hover::after { opacity: 1; }
                .ins-card-icon { width: 44px; height: 44px; border-radius: 10px; border: 1px solid transparent; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
                .ins-card-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #F0F0F0; margin-bottom: 8px; }
                .ins-card-desc { font-size: 12px; color: #6B6B6B; line-height: 1.6; }

                .ins-content { margin-top: 32px; padding: 32px; background: #0D0D0D; border: 1px solid #1A1A1A; border-radius: 16px; color: #C0C0C0; font-size: 14px; line-height: 1.7; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.224), inset 0 -1px 2px rgba(39, 38, 38, 0.184), 0 12px 32px rgba(12, 12, 12, 0.12); }
                .ins-content h1 { font-family: 'Syne', sans-serif; font-size: 24px; color: #115fe8; margin-top: 0; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.05em; }
                .ins-content h2 { font-family: 'Syne', sans-serif; font-size: 20px; color: #F0F0F0; margin-top: 32px; margin-bottom: 16px; }
                .ins-content h3 { font-family: 'Syne', sans-serif; font-size: 16px; color: #C0C0C0; margin-top: 24px; margin-bottom: 12px; }
                .ins-content p { margin-bottom: 16px; }
                .ins-content ul { padding-left: 20px; margin-bottom: 16px; }
                .ins-content li { margin-bottom: 8px; }
            `}</style>

            <div className="sx-shell">
                <Sidebar username={username} nickname={nickname} role={role} onLogout={handleLogout} />

                <main className="sx-main">
                    <div className="sx-page-header sx-fade" style={{ animationDelay: '0.1s' }}>
                        <div className="sx-page-title">Operations Manual</div>
                    </div>
                    <div className="ins-content sx-fade" style={{ animationDelay: '0.2s' }}>
                        <h1>Account Operations</h1>

                        <h2>Welcome to StellarX</h2>
                        <p>Welcome to <strong>StellarX Account Operations</strong>, a controlled cybersecurity banking environment.</p>
                        <p>Your objective is simple:</p>
                        <blockquote style={{ borderLeft: '3px solid #115fe8', paddingLeft: '16px', margin: '16px 0', fontStyle: 'italic', color: '#F0F0F0' }}>
                            <strong>Identify vulnerabilities in the banking system and use them to transfer funds from other players’ accounts into your own account.</strong>
                        </blockquote>
                        <p>However, not all activity contributes to your score.</p>
                        <p>A standard transfer uses the system as intended and only moves funds. A transfer achieved through a valid security exploit may earn <strong>XP based on the amount successfully transferred</strong>.</p>
                        <hr style={{ borderColor: '#1A1A1A', margin: '32px 0' }} />

                        <h2>1. Your Objective</h2>
                        <p>Your goal is to maximize your <strong>XP</strong> by discovering and exploiting weaknesses in the StellarX banking system.</p>
                        <p>You are encouraged to:</p>
                        <ul>
                            <li>Explore the banking interface</li>
                            <li>Review account and transaction features</li>
                            <li>Interact with transfer functionality</li>
                            <li>Analyze how accounts, sessions, and authorization are handled</li>
                            <li>Identify security weaknesses</li>
                            <li>Exploit vulnerabilities to perform unauthorized transfers</li>
                            <li>Increase your XP through successful exploit-based transactions</li>
                        </ul>
                        <p>Your <strong>XP determines your competition ranking</strong>.</p>
                        <p>The highest XP at the end of the event ranks at the top of the leaderboard.</p>
                        <hr style={{ borderColor: '#1A1A1A', margin: '32px 0' }} />

                        <h2>2. Account Types</h2>
                        <p>The system includes multiple account categories.</p>
                        <h3>Standard Player Accounts</h3>
                        <p>These are regular participant accounts used for normal transactions. They form the primary environment for interaction and exploitation.</p>
                        <h3>High-Value Preconfigured Accounts</h3>
                        <p>The system also includes <strong>preloaded accounts with significantly higher balances</strong>.</p>
                        <p>These accounts are designed to:</p>
                        <ul>
                            <li>Enable higher-value exploit scenarios</li>
                            <li>Encourage deeper analysis of system behavior</li>
                            <li>Allow advanced participants to achieve higher XP through successful exploitation</li>
                        </ul>
                        <p>All accounts operate under the same system rules and constraints.</p>
                        <hr style={{ borderColor: '#1A1A1A', margin: '32px 0' }} />

                        <h2>3. Shop &amp; Hardware System</h2>
                        <p>StellarX includes an integrated <strong>Hardware Shop</strong> that extends gameplay beyond banking operations.</p>
                        <h3>Overview</h3>
                        <p>The Shop allows participants to:</p>
                        <ul>
                            <li>Purchase hardware tools</li>
                            <li>Spend both <strong>money and XP</strong></li>
                            <li>Unlock access to hardware-based challenges</li>
                            <li>Earn additional rewards through challenge completion</li>
                        </ul>
                        <h3>How It Works</h3>
                        <ul>
                            <li>Each item has a defined cost in <strong>currency and XP</strong></li>
                            <li>Purchased items are added to your inventory</li>
                            <li>Certain challenges require specific hardware tools to access or complete</li>
                            <li>Completing hardware challenges may reward additional XP or bonuses</li>
                        </ul>
                        <h3>Purpose</h3>
                        <p>The Shop introduces a secondary progression system designed to:</p>
                        <ul>
                            <li>Encourage strategic resource management</li>
                            <li>Reward efficient use of both money and XP</li>
                            <li>Unlock deeper layers of gameplay</li>
                            <li>Expand beyond core banking exploitation mechanics</li>
                        </ul>
                        <p>The Shop is fully integrated into the StellarX ecosystem and directly interacts with your account progression.</p>
                        <hr style={{ borderColor: '#1A1A1A', margin: '32px 0' }} />

                        <h2>4. Normal Transfers vs. Exploit Transfers</h2>
                        <p>There are two ways to move funds within the system.</p>
                        <h3>Normal Transfer</h3>
                        <p>A normal transfer uses the banking system as intended.</p>
                        <p>Example:</p>
                        <blockquote style={{ borderLeft: '3px solid #115fe8', paddingLeft: '16px', margin: '16px 0', fontStyle: 'italic', color: '#F0F0F0' }}>
                            Player A transfers ₹1,000 to Player B using the standard transfer interface.
                        </blockquote>
                        <p>Result:</p>
                        <ul>
                            <li>Funds are transferred successfully</li>
                            <li><strong>XP Earned: 0</strong></li>
                        </ul>
                        <p>Normal activity does not contribute to competition scoring.</p>

                        <h3>Exploit-Based Transfer</h3>
                        <p>An exploit-based transfer occurs when a vulnerability is used to bypass intended system behavior and perform an unauthorized transaction.</p>
                        <p>Example:</p>
                        <blockquote style={{ borderLeft: '3px solid #115fe8', paddingLeft: '16px', margin: '16px 0', fontStyle: 'italic', color: '#F0F0F0' }}>
                            A vulnerability allows manipulation of authorization logic, resulting in a ₹1,000 transfer into your account.
                        </blockquote>
                        <p>If the transaction is valid under event rules:</p>
                        <ul>
                            <li><strong>Funds transferred: ₹1,000</strong></li>
                            <li><strong>XP awarded: based on ₹1,000</strong></li>
                        </ul>
                        <p>Scoring is determined by the event’s internal XP conversion rules.</p>
                        <hr style={{ borderColor: '#1A1A1A', margin: '32px 0' }} />

                        <h2>5. What You Should Look For</h2>
                        <p>The system is intentionally designed with vulnerabilities.</p>
                        <p>Do not assume standard banking security behavior.</p>
                        <p>Focus on how the system handles:</p>
                        <h3>Account Access</h3>
                        <ul>
                            <li>Account identification</li>
                            <li>Authorization checks</li>
                            <li>Access control between users</li>
                            <li>Session validation</li>
                            <li>Ownership verification</li>
                        </ul>
                        <h3>Transactions</h3>
                        <ul>
                            <li>Who can initiate transfers</li>
                            <li>Source and destination account validation</li>
                            <li>Server-side verification of transaction data</li>
                            <li>Integrity of transaction parameters</li>
                        </ul>
                        <h3>Input Validation</h3>
                        <ul>
                            <li>Trust placed in client-provided data</li>
                            <li>Server-side validation of critical fields</li>
                            <li>Possibility of parameter manipulation</li>
                        </ul>
                        <h3>Business Logic</h3>
                        <p>Some vulnerabilities may arise from flawed logic rather than technical bugs.</p>
                        <p>Ask:</p>
                        <blockquote style={{ borderLeft: '3px solid #115fe8', paddingLeft: '16px', margin: '16px 0', fontStyle: 'italic', color: '#F0F0F0' }}>
                            Can the system be made to perform an action that should not be allowed under normal rules?
                        </blockquote>
                        <hr style={{ borderColor: '#1A1A1A', margin: '32px 0' }} />

                        <h2>6. Core Objective: Fund Transfer</h2>
                        <p>Identifying a vulnerability is not sufficient on its own.</p>
                        <p>To earn XP, the exploit must result in a <strong>successful and valid fund transfer</strong>.</p>
                        <p>Workflow:</p>
                        <blockquote style={{ borderLeft: '3px solid #115fe8', paddingLeft: '16px', margin: '16px 0', fontStyle: 'italic', color: '#F0F0F0' }}>
                            Identify vulnerability → Exploit behavior → Transfer funds → Earn XP
                        </blockquote>
                        <p>Only validated exploit-based transfers contribute to scoring.</p>
                        <hr style={{ borderColor: '#1A1A1A', margin: '32px 0' }} />

                        <h2>7. Scoring System</h2>
                        <p>XP is awarded based on successful exploit-driven transfers.</p>
                        <h3>Rule</h3>
                        <blockquote style={{ borderLeft: '3px solid #115fe8', paddingLeft: '16px', margin: '16px 0', fontStyle: 'italic', color: '#F0F0F0' }}>
                            XP is proportional to the amount of money successfully transferred through a valid exploit.
                        </blockquote>
                        <h3>Example</h3>
                        <ul>
                            <li>₹500 exploit transfer → lower XP gain</li>
                            <li>₹2,000 exploit transfer → higher XP gain</li>
                        </ul>
                        <p>Higher-value exploits result in significantly greater XP rewards.</p>
                        <p>All scores are reflected in the dashboard and leaderboard.</p>
                        <hr style={{ borderColor: '#1A1A1A', margin: '32px 0' }} />

                        <h2>8. System Exploration</h2>
                        <p>Before attempting exploitation, familiarize yourself with:</p>
                        <ul>
                            <li>Dashboard interface</li>
                            <li>Account overview</li>
                            <li>Transfer system</li>
                            <li>Transaction history</li>
                            <li>Shop interface</li>
                            <li>Navigation structure</li>
                            <li>System responses</li>
                            <li>Error messages and validation behavior</li>
                        </ul>
                        <p>Understanding system behavior is key to identifying weaknesses.</p>
                        <hr style={{ borderColor: '#1A1A1A', margin: '32px 0' }} />

                        <h2>9. Security Mindset</h2>
                        <p>For every operation, ask:</p>
                        <blockquote style={{ borderLeft: '3px solid #115fe8', paddingLeft: '16px', margin: '16px 0', fontStyle: 'italic', color: '#F0F0F0' }}>
                            What does the system assume is safe without verifying it?
                        </blockquote>
                        <p>Consider:</p>
                        <ul>
                            <li>Is ownership properly verified?</li>
                            <li>Are server-side checks enforced?</li>
                            <li>Can client-side data influence critical logic?</li>
                            <li>Are there hidden trust assumptions?</li>
                            <li>Can expected workflows be bypassed?</li>
                        </ul>
                        <p>Your goal is to break these assumptions.</p>
                        <hr style={{ borderColor: '#1A1A1A', margin: '32px 0' }} />

                        <h2>10. Verification</h2>
                        <p>After any exploit attempt, verify the outcome:</p>
                        <ul>
                            <li>Account balances</li>
                            <li>Transaction history</li>
                            <li>XP updates</li>
                            <li>Shop inventory changes</li>
                            <li>Leaderboard position</li>
                        </ul>
                        <p>A successful request does not guarantee a valid exploit.</p>
                        <hr style={{ borderColor: '#1A1A1A', margin: '32px 0' }} />

                        <h2>11. Rules of Engagement</h2>
                        <p>StellarX operates as a controlled cybersecurity environment.</p>
                        <p>Testing is permitted only within the challenge scope.</p>
                        <h3>Allowed</h3>
                        <ul>
                            <li>Testing the banking application</li>
                            <li>Analyzing system behavior</li>
                            <li>Exploiting intended vulnerabilities</li>
                            <li>Using security tools for analysis</li>
                            <li>Interacting with participant accounts as designed</li>
                        </ul>
                        <h3>Not Allowed</h3>
                        <ul>
                            <li>Attacking infrastructure</li>
                            <li>Targeting organizer systems</li>
                            <li>Performing denial-of-service attacks</li>
                            <li>Accessing external systems</li>
                            <li>Disrupting the competition</li>
                            <li>Exploiting systems outside intended scope</li>
                        </ul>
                        <hr style={{ borderColor: '#1A1A1A', margin: '32px 0' }} />

                        <h2>12. System Protection</h2>
                        <p>If you discover a vulnerability that:</p>
                        <ul>
                            <li>Affects system stability</li>
                            <li>Impacts all users</li>
                            <li>Alters leaderboard integrity</li>
                            <li>Exposes internal infrastructure</li>
                            <li>Corrupts account data</li>
                            <li>Disrupts gameplay</li>
                        </ul>
                        <p>you must stop testing immediately and report it to event staff.</p>
                        <p>Do not damage the system.</p>
                        <hr style={{ borderColor: '#1A1A1A', margin: '32px 0' }} />

                        <h2>13. Unscored Exploits</h2>
                        <p>In some cases, a vulnerability may successfully result in a fund transfer but may not qualify for XP scoring due to internal validation rules or event constraints.</p>
                        <p>If this occurs:</p>
                        <ul>
                            <li>The exploit may be considered <strong>non-qualifying</strong></li>
                            <li>The system may not award XP for the transaction</li>
                        </ul>
                        <p>Additionally:</p>
                        <blockquote style={{ borderLeft: '3px solid #115fe8', paddingLeft: '16px', margin: '16px 0', fontStyle: 'italic', color: '#F0F0F0' }}>
                            Once a vulnerability has been successfully used, it is considered exhausted and cannot be reused for additional scoring.
                        </blockquote>
                        <p>If you believe a valid exploit was not properly scored, contact an event organizer for review and validation.</p>
                        <hr style={{ borderColor: '#1A1A1A', margin: '32px 0' }} />

                        <h2>Final Objective</h2>
                        <blockquote style={{ borderLeft: '3px solid #115fe8', paddingLeft: '16px', margin: '16px 0', fontStyle: 'italic', color: '#F0F0F0' }}>
                            <h3 style={{ marginTop: 0, color: '#F0F0F0' }}>Identify the weakness.</h3>
                            <h3 style={{ color: '#F0F0F0' }}>Break the assumption.</h3>
                            <h3 style={{ color: '#F0F0F0' }}>Transfer the funds.</h3>
                            <h3 style={{ marginBottom: 0, color: '#F0F0F0' }}>Earn the XP.</h3>
                        </blockquote>
                        <p><strong>Welcome to StellarX Account Operations.</strong></p>
                        <p>Good luck, and may the best security researcher win.</p>
                    </div>
                </main>
            </div>
        </>
    );
}
