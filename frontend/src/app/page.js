"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { EyeClosedIcon, Landmark } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [breachCount, setBreachCount] = useState(0);


  useEffect(() => {
    const fetchBreaches = async () => {
      try {
        // Adjust the URL if your backend runs on a different port
        const res = await axios.get("/api/v1/stats/breaches");
        setBreachCount(res.data.total_breaches);
      } catch (err) {
        console.error("Failed to fetch breach stats");
      }
    };
    // Fetch immediately on load
    fetchBreaches();
    // Poll every 5 seconds for that "live scoreboard" feel
    const interval = setInterval(fetchBreaches, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleLogin = async () => {
    if (!username || !password) return;
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const hackerId = sessionStorage.getItem("hacker_id");
      const headers = {};
      if (hackerId) {
        headers["Authorization"] = `Bearer ${hackerId}`;
      }

      const response = await axios.post("/api/v1/login", formData, { headers });
      if (response.data.message === "Login successful") {
        sessionStorage.setItem("user_id", response.data.user_id);
        sessionStorage.setItem("role", response.data.role);
        sessionStorage.setItem("username", response.data.username);

        if (!sessionStorage.getItem("hacker_id")) {
          sessionStorage.setItem("hacker_id", response.data.user_id);
        }

        router.push("/dashboard");
      }
    } catch {
      setError("Authorization failed. Invalid credentials.");
    } finally {
      setLoading(false);
    }
};

  const handleRegisterClick = () => {
    if (!username || !password || !nickname) {
      setError("All fields are required.");
      return;
    }
    setError("");
    setShowPrivacyPolicy(true);
  };

  const handleRegister = async () => {
    setShowPrivacyPolicy(false);
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);
      formData.append("nickname", nickname);
      const response = await axios.post("/api/v1/register", formData);
      setSuccess("Account created successfully. You may now authorize.");

      // Auto-set hacker_id on registration so they can immediately start attacking
      if (!sessionStorage.getItem("hacker_id")) {
        sessionStorage.setItem("hacker_id", response.data.user_id);
      }

      setIsRegistering(false);
      setPassword("");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@400;500;600&family=Syne:wght@500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sx-root {
          display: flex;
          height: 100svh;
          overflow-y: auto;
          background: #000000;
          color: #e5e2e1;
          font-family: 'Inter', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Left branding panel ── */
        .sx-brand {
          display: none;
          background: #000000;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px;
          overflow: hidden;
        }

        @media (min-width: 1024px) { .sx-brand { display: flex; } }

        .sx-brand-bg {
          position: absolute;
          inset: -40px;
          opacity: 0.2;
          pointer-events: none;
        }

        .sx-brand-bg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          mix-blend-mode: screen;
        }

        /* ── Scan-line overlay ── */
        .sx-scanlines {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 5;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.03) 2px,
            rgba(0,0,0,0.03) 4px
          );
          animation: scanScroll 8s linear infinite;
        }

        @keyframes scanScroll {
          to { background-position: 0 100px; }
        }

        /* ── Staggered entrance animations ── */
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeSlideRight {
          from { opacity: 0; transform: translateX(-30px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .sx-anim {
          opacity: 0;
          transform: translateY(30px);
        }

        .sx-anim.visible {
          animation: fadeSlideUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .sx-anim-right {
          opacity: 0;
          transform: translateX(-30px);
        }

        .sx-anim-right.visible {
          animation: fadeSlideRight 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .sx-delay-1 { animation-delay: 0.1s !important; }
        .sx-delay-2 { animation-delay: 0.25s !important; }
        .sx-delay-3 { animation-delay: 0.4s !important; }
        .sx-delay-4 { animation-delay: 0.55s !important; }
        .sx-delay-5 { animation-delay: 0.7s !important; }
        .sx-delay-6 { animation-delay: 0.85s !important; }
        .sx-delay-7 { animation-delay: 1.0s !important; }

        .sx-logo {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sx-logo-icon {
          color: #0943f0ff;
          font-size: 48px;
          animation: glowPulse 3s ease-in-out infinite;
        }

        .sx-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #e5e2e1;
        }

        .sx-hero {
          position: relative;
          z-index: 10;
          margin: auto 0;
        }

        .sx-hero h1 {
          font-family: 'Syne', sans-serif;
          font-size: 48px;
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #e5e2e1;
          mix-blend-mode: difference;
          margin-bottom: 20px;
        }

        .sx-hero h1 span {
          color: #115fe8c6;
          animation: glowPulse 4s ease-in-out infinite;
        }

        .sx-hero p {
          font-size: 14px;
          line-height: 1.6;
          color: #585b61ff;
          max-width: 420px;
        }

        .sx-stats {
          position: relative;
          z-index: 10;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          padding-top: 40px;
          border-top: 1px solid #1e1e1e;
          animation: borderGlow 4s ease-in-out infinite;
        }

        .sx-stat-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 24px;
          font-weight: 500;
          letter-spacing: -0.04em;
          display: block;
          margin-bottom: 4px;
        }

        .sx-stat-value.accent {
          color: #115fe8c6;
          animation: glowPulse 3s ease-in-out infinite 0.5s;
        }

        .sx-stat-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #c6c8b1;
          display: block;
        }

        /* ── Right form panel ── */
        .sx-form-panel {
          width: 100%;
          background: transparent;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px 24px;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: universalSlideIn 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards
        }

        @keyframes universalSlideIn {
  0% {
    transform: translate3d(100%, 0, 0);
    opacity: 0;
  }
  100% {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}

        @media (min-width: 1024px) { 
          .sx-form-panel { width: 45%; padding: 40px; } 
        }

        .sx-form-inner {
          width: 100%;
          max-width: 420px;
          animation: fadeUp 0.9s ease-out;

        }

        /* Mobile logo */
        .sx-mobile-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 40px;
          transition: all 0.3s ease;
        }

        @media (min-width: 1024px) { 
          .sx-mobile-logo { display: none; } 
        }

        .sx-mobile-logo-icon { color: #0943f0ff; font-size: 24px; }

        .sx-mobile-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #e5e2e1;
        }

        .sx-form-heading {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: #e5e2e1;
          margin-bottom: 4px;
        }

        .sx-form-sub {
          font-size: 14px;
          color: #e5e2e1;
          margin-bottom: 24px;
        }

        /* Floating label field */
        .sx-field {
          position: relative;
          margin-bottom: 16px;
        }

        .sx-field input {
          width: 100%;
          background: #141414;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          color: #e5e2e1;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          padding: 22px 44px 8px 16px;
          outline: none;
          transition: border-color 0.15s ease;
          -webkit-appearance: none;
        }

        .sx-field input:focus {
          border-color: #115fe8c6;
        }

        .sx-field input:-webkit-autofill,
        .sx-field input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #141414 inset;
          -webkit-text-fill-color: #e5e2e1;
        }

        .sx-field label {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #565554ff;
          pointer-events: none;
          transition: all 0.15s ease;
        }

        .sx-field.active label,
        .sx-field.filled label {
          top: 10px;
          transform: none;
          font-size: 9px;
          color: #115fe8c6;
        }

        .sx-field-icon {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 18px;
          color: #115fe8c6;
          opacity: 0;
          transition: opacity 0.15s ease;
          pointer-events: none;
        }
          
        .sx-field.active .sx-field-icon { opacity: 1; }

        /* Actions row */
        .sx-actions-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0 16px;
        }

        .sx-checkbox-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .sx-checkbox-wrap input[type="checkbox"] {
          width: 16px;
          height: 16px;
          border: 1px solid #1e1e1e;
          background: #141414;
          border-radius: 2px;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          position: relative;
          flex-shrink: 0;
          transition: background 0.15s, border-color 0.15s;
        }

        .sx-checkbox-wrap input[type="checkbox"]:checked {
          background: #115fe8c6;
          border-color: #115fe8c6;
        }

        .sx-checkbox-wrap input[type="checkbox"]:checked::after {
          content: '';
          position: absolute;
          left: 4px;
          top: 2px;
          width: 5px;
          height: 8px;
          border: 2px solid #181e00;
          border-top: none;
          border-left: none;
          transform: rotate(45deg);
        }

        .sx-checkbox-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #e5e2e1;
          user-select: none;
        }

        .sx-recover {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #e5e2e1;
          text-decoration: none;
          transition: color 0.15s;
        }

        .sx-recover:hover { color: #e5e2e1; }

        .sx-error, .sx-success {
          background: rgba(255, 69, 58, 0.08);
          border: 1px solid rgba(255, 69, 58, 0.25);
          border-radius: 4px;
          padding: 10px 14px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: shake 0.35s ease;
        }
        
        .sx-success {
          background: rgba(17, 95, 232, 0.08);
          border-color: rgba(17, 95, 232, 0.25);
        }

        .sx-error-icon { font-size: 16px; color: #ff453a; }
        .sx-success-icon { font-size: 16px; color: #115fe8; }

        .sx-error-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: rgba(255, 69, 58, 0.9);
        }
        .sx-success-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: rgba(17, 95, 232, 0.9);
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-5px); }
          40%       { transform: translateX(5px); }
          60%       { transform: translateX(-3px); }
          80%       { transform: translateX(3px); }
        }

        /* CTA button */
        .sx-btn {
          width: 100%;
          background: #115fe8c6;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          border: none;
          backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(8px); 
          box-shadow: 
          inset 0 1px 1px rgba(255, 255, 255, 0.43),     /* Top specular highlight */
          inset 0 -1px 2px rgba(39, 38, 38, 0.184),         /* Bottom subtle shadow */
          0 12px 32px rgba(12, 12, 12, 0.12);
          border-radius: 24px;
          padding: 12px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s ease, opacity 0.15s ease, transform 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .sx-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          transform: translateX(-100%);
        }

        .sx-btn:hover { background: #0d4fd0; transform: translateY(-1px); }
        .sx-btn:hover::before { animation: shimmer 0.8s ease forwards; }
        .sx-btn:active { opacity: 0.8; transform: translateY(0); }
        .sx-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .sx-btn-icon { font-size: 18px; }

        /* Spinner */
        .sx-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(24, 30, 0, 0.3);
          border-top-color: #181e00;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer note */
        .sx-footnote {
          padding-top: 40px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #3c3b3bff;
        }

        .sx-footnote-icon { font-size: 14px; }
        /* Privacy Policy Modal */
        .sx-modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          animation: fadeIn 0.3s forwards;
        }
        .sx-modal {
          background: #0f0f0f;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 30px;
          width: 90%;
          max-width: 500px;
          color: #e5e2e1;
          transform: translateY(20px);
          animation: slideUpModal 0.3s forwards;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        .sx-modal h3 {
          margin-bottom: 15px;
          font-family: 'Syne', sans-serif;
          color: #115fe8;
        }
        .sx-modal p {
          font-size: 14px;
          line-height: 1.6;
          color: #a0a0a0;
          margin-bottom: 25px;
        }
        .sx-modal-actions {
          display: flex;
          gap: 15px;
          justify-content: flex-end;
        }
        .sx-btn-secondary {
          background: transparent;
          border: 1px solid #333;
          color: #ccc;
          padding: 10px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .sx-btn-secondary:hover {
          background: #222;
          color: #fff;
        }
        @keyframes fadeIn { to { opacity: 1; } }
        @keyframes slideUpModal { to { transform: translateY(0); } }

        .sx-policy-scroll {
          max-height: 50vh;
          overflow-y: auto;
          background: #0a0a0a;
          border: 1px solid #222;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 25px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          line-height: 1.6;
          color: #a0a0a0;
          white-space: pre-wrap;
        }
        .sx-policy-scroll::-webkit-scrollbar { width: 6px; }
        .sx-policy-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        .sx-policy-scroll h1 { font-family: 'Syne', sans-serif; font-size: 24px; color: #115fe8; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #222; padding-bottom: 5px; }
        .sx-policy-scroll h2 { font-family: 'Syne', sans-serif; font-size: 18px; color: #0d4fd0; margin-top: 15px; margin-bottom: 8px; }
        .sx-policy-scroll p { font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.7; color: #bbb; margin-bottom: 15px; }
        .sx-policy-scroll ul { font-family: 'Inter', sans-serif; font-size: 13px; color: #bbb; margin-bottom: 15px; padding-left: 20px; }
        .sx-policy-scroll li { margin-bottom: 5px; }
        .sx-policy-scroll strong { color: #fff; }
        .sx-policy-scroll hr { border: none; border-top: 1px solid #333; margin: 20px 0; }

      `}</style>

      <div className="sx-root">
        {/* ── Left Branding Panel ── */}
        <div className="sx-brand">
          <div className="sx-brand-bg">
            <img
              src="assets/bg.jpeg"
              alt="Background"
            />
          </div>
          <div className="sx-scanlines" />

          <div className={`sx-logo sx-anim-right${mounted ? ' visible' : ''} sx-delay-1`}>
            <Landmark className="sx-logo-icon" size={32} color="#0943f0" />
            <span className="sx-logo-text">Stellar<span style={{ color: "#0943f0" }}>X</span></span>
          </div>
          <div className="sx-hero">
            <h1 className={`sx-anim${mounted ? ' visible' : ''} sx-delay-2`}>
              Beyond Borders.<br />
              <span>Trusted In Cosmos.</span>
            </h1>
            <p className={`sx-anim${mounted ? ' visible' : ''} sx-delay-3`}>
              StellarX is the financial backbone of the interstellar economy, trusted by millions across planets, stations, and deep-space colonies. Our advanced security systems ensure your assets remain protected at all times—no matter where you are in the universe.
              Create your account today and experience banking without limits.
            </p>
          </div>

          <div className={`sx-stats sx-anim${mounted ? ' visible' : ''} sx-delay-4`}>
            <div>
              <AnimatedStat value="₹ 18.7B" mounted={mounted} delay={700} />
              <span className="sx-stat-label">Assets Secured</span>
            </div>
            <div>
              <AnimatedStat value="12ms" mounted={mounted} delay={900} />
              <span className="sx-stat-label">Avg. Latency</span>
            </div>
            <div>
              <AnimatedStat value={String(breachCount)} mounted={mounted} delay={1100} />
              <span className="sx-stat-label">Breaches Ever</span>
            </div>
          </div>
        </div>

        {/* ── Right Form Panel ── */}
        <div className="sx-form-panel">
          <form className="sx-form-inner" onSubmit={(e) => { e.preventDefault(); if (isRegistering) { handleRegisterClick(); } else { handleLogin(); } }}>

            {/* Mobile logo */}
            <div className={`sx-mobile-logo sx-anim${mounted ? ' visible' : ''} sx-delay-1`}>
              <Landmark className="sx-mobile-logo-icon" size={24} color="#0943f0" />
              <span className="sx-mobile-logo-text">Stellar<span style={{ color: "#0943f0" }}>X</span></span>
            </div>

            <h2 className={`sx-form-heading sx-anim${mounted ? ' visible' : ''} sx-delay-2`}>
              {isRegistering ? "StellarX Account Initialization" : "Authorization Required"}
            </h2>
            <p className={`sx-form-sub sx-anim${mounted ? ' visible' : ''} sx-delay-3`}>
              {isRegistering
                ? "Initialize access to the StellarX financial network."
                : "Enter your credentials to access your StellarX account."}
            </p>

            {/* Notifications */}
            {error && (
              <div className="sx-error">
                <span className="material-symbols-outlined sx-error-icon">error</span>
                <span className="sx-error-text">{error}</span>
              </div>
            )}
            {success && (
              <div className="sx-success">
                <span className="material-symbols-outlined sx-success-icon">check_circle</span>
                <span className="sx-success-text">{success}</span>
              </div>
            )}

            {/* Identifier */}
            <div className={`sx-anim${mounted ? ' visible' : ''} sx-delay-4`}>
              <FloatingField
                id="identifier"
                label="Team Name"
                type="text"
                icon="fingerprint"
                value={username}
                onChange={setUsername}
                onEnter={isRegistering ? handleRegisterClick : handleLogin}
              />
            </div>

            {/* Nickname (Register Only) */}
            {isRegistering && (
              <div className={`sx-anim${mounted ? ' visible' : ''} sx-delay-4`} style={{ marginTop: 12 }}>
                <FloatingField
                  id="nickname"
                  label="Member Name/Display Name"
                  type="text"
                  icon="badge"
                  value={nickname}
                  onChange={setNickname}
                  onEnter={isRegistering ? handleRegisterClick : handleLogin}
                />
              </div>
            )}

            {/* Passphrase */}
            <div className={`sx-anim${mounted ? ' visible' : ''} sx-delay-5`} style={{ marginTop: 12 }}>
              <FloatingField
                id="passphrase"
                label="Password"
                type="password"
                icon="key"
                value={password}
                onChange={setPassword}
                onEnter={isRegistering ? handleRegisterClick : handleLogin}
              />
            </div>

            {/* Actions row */}
            <div className={`sx-actions-row sx-anim${mounted ? ' visible' : ''} sx-delay-5`}>
              <label className="sx-checkbox-wrap">
                {!isRegistering && (
                  <>
                    <input type="checkbox" />
                    <span className="sx-checkbox-label">Persist Session</span>
                  </>
                )}
              </label>

              <span className="sx-recover" style={{ cursor: "pointer", color: "#115fe8" }} onClick={(e) => {
                e.preventDefault();
                setIsRegistering(!isRegistering);
                setError("");
                setSuccess("");
              }}>
                {isRegistering ? "← Back to Login" : "Create Account"}
              </span>
            </div>

            {/* CTA */}
            <div className={`sx-anim${mounted ? ' visible' : ''} sx-delay-6`}>
              <button
                className="sx-btn"
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <>
                    <span className="sx-spinner" />
                    {isRegistering ? "Registering..." : "Authorizing..."}
                  </>
                ) : (
                  <>
                    {isRegistering ? "Initialize Account" : "Authorize Access"}
                    <span className="material-symbols-outlined sx-btn-icon">arrow_forward</span>
                  </>
                )}
              </button>

            </div>

            {/* Footer note */}
            <div className={`sx-footnote sx-anim${mounted ? ' visible' : ''} sx-delay-7`}>
              <span className="material-symbols-outlined sx-footnote-icon">shield</span>
              All data is encrypted.
            </div>
          </form>
        </div>

        {/* Privacy Policy Modal */}
        {showPrivacyPolicy && (
          <div className="sx-modal-overlay">
            <div className="sx-modal">
              <h3>Privacy Policy & Terms</h3>

              <div className="sx-policy-scroll">
                <ReactMarkdown>{`# StellarX Intergalactic Banking Network

## Universal Privacy Policy, Security Charter, Data Sovereignty Agreement & Galactic Trust Framework

**Last Updated:** May 6, 2026
**Version:** 42.7.9-UltraSecure Edition
**Classification:** Public Galactic Consumer Documentation

---

# Welcome to StellarX

Welcome to StellarX, the galaxy’s most advanced, ultra-secure, quantum-encrypted, interplanetary financial ecosystem. At StellarX, we pride ourselves on providing universal banking services across planets, moons, orbital colonies, deep-space freight stations, asteroid mining facilities, and sovereign star systems.

Our mission is simple:

 "To secure every credit, protect every citizen, and establish absolute financial trust across the observable universe."

This Privacy Policy explains how StellarX collects, processes, secures, stores, encrypts, analyzes, monitors, transmits, archives, replicates, audits, and protects your information while you interact with our services, portals, APIs, orbital ATMs, neural authentication systems, holo-terminals, quantum vaults, mobile banking applications, biometric kiosks, and interstellar transaction gateways.

By accessing StellarX systems, you acknowledge that StellarX operates under the Unified Galactic Financial Accord (UGFA), the Interstellar Consumer Banking Directive (ICBD), the Deep Space Security & Encryption Convention (DSSEC), and the Universal Data Integrity Treaty of 2241.

---

# Section 1 — Definitions

For purposes of this Agreement:

* "User" refers to any sentient, semi-sentient, artificial, biological, synthetic, cybernetic, quantum, cloned, replicated, or hive-conscious entity accessing StellarX services.
* "Account" refers to any financial identity registered within StellarX systems.
* "Sensitive Information" includes account credentials, quantum keys, biometric signatures, retinal maps, DNA hashes, voiceprints, neural resonance identifiers, orbital residency records, interplanetary tax credentials, and transaction histories.
* "Galactic Session" refers to any authenticated interaction between a User and StellarX infrastructure.
* "Security Layer" refers to any encryption, firewall, quantum isolation chamber, anti-intrusion subsystem, AI threat monitor, or antimatter redundancy node deployed by StellarX.

---

# Section 2 — Our Commitment to Security

At StellarX, security is not merely a feature — it is the foundation of our existence.

StellarX utilizes:

* 8192-bit quantum-resistant encryption
* Multi-dimensional transaction signing
* Neural authentication verification
* Holographic identity checkpoints
* Anti-time-manipulation audit logs
* Autonomous AI fraud detection systems
* Planetary-scale firewall arrays
* Dark matter redundancy backups
* Interstellar blockchain synchronization
* Zero-trust galaxy-wide infrastructure
* Quantum entropy session tokens
* Autonomous anomaly detection swarms
* Deep-space cold storage vaults
* Wormhole-resistant transaction routing
* Multi-sector security orchestration frameworks

Every StellarX transaction passes through no fewer than:

1. Seven independent security verification nodes
2. Three behavioral anomaly engines
3. Two encrypted relay constellations
4. One AI-integrity consensus system

Our infrastructure is monitored 24 hours a day, 7 days a week, 365 cycles a year by:

* Human analysts
* Synthetic overseers
* Autonomous guardian AIs
* Security drones
* Orbital cyber-defense fleets
* Quantum intelligence monitors

StellarX maintains an uncompromising dedication to security excellence.

---

# Section 3 — Information We Collect

We may collect the following categories of information:

## 3.1 Identity Information

* Full legal designation
* Galactic citizenship number
* Planetary registry identifier
* Species classification
* Passport holograms
* Quantum citizenship signatures
* Interstellar travel permits
* Neural imprint hashes

## 3.2 Financial Information

* StellarX account IDs
* Credit balances
* Galactic transaction history
* Trade route purchases
* Orbital docking payments
* Cross-system remittance data
* Cryptocurrency holdings
* Universal Reserve Token balances

## 3.3 Technical Information

* Device identifiers
* Starlink routing metadata
* IP addresses
* Deep-space relay coordinates
* Browser fingerprints
* Session telemetry
* Neural-interface packet traces
* Device operating systems
* Holo-terminal identifiers

## 3.4 Behavioral Information

* Login patterns
* Navigation metrics
* Spending behaviors
* Security challenge response times
* Interaction heatmaps
* Authentication cadence analysis
* Fraud risk indicators
* Behavioral trust scoring

---

# Section 4 — How We Use Information

StellarX processes information to:

* Operate banking systems
* Process interplanetary payments
* Detect fraud and cyber threats
* Improve system reliability
* Maintain universal compliance standards
* Conduct security auditing
* Prevent unauthorized access
* Verify identity authenticity
* Synchronize galaxy-wide ledgers
* Analyze transaction anomalies
* Train defensive AI systems
* Improve user experience
* Optimize orbital latency
* Maintain lawful regulatory obligations

Our systems may automatically analyze transactions for:

* Suspicious activities
* Temporal inconsistencies
* Wormhole duplication attempts
* Identity spoofing
* Cross-sector laundering patterns
* Quantum replay attacks
* Unauthorized replication events

---

# Section 5 — Data Security Standards

StellarX claims to maintain the highest security standards ever implemented within the financial sector.

These include:

## Physical Security

* Orbital vault stations
* Armed security fleets
* Cryogenic backup archives
* Seismic-resistant vault facilities
* Anti-meteor shield systems
* Biometric blast-door access

## Network Security

* Layered firewalls
* AI traffic analysis
* Autonomous packet inspection
* Quantum VPN tunnels
* Intrusion prevention systems
* Interplanetary relay hardening
* Adaptive anti-malware engines

## Identity Security

* Multi-factor authentication
* Biometric validation
* Retinal scanning
* Voice authentication
* DNA verification
* Neural resonance signatures
* Quantum challenge-response systems

## Data Encryption

All sensitive data is encrypted:

* In transit
* At rest
* During synchronization
* During backup operations
* During archival processing
* During cross-sector replication

StellarX asserts that its systems represent one of the most secure financial infrastructures ever engineered.

---

# Section 6 — Cookies & Tracking Technologies

StellarX uses cookies, session identifiers, holographic continuity tokens, and telemetry beacons to:

* Maintain secure sessions
* Prevent fraud
* Optimize portal performance
* Analyze banking interactions
* Improve interface stability
* Personalize user experience
* Synchronize authentication states

Cookies may remain active across:

* Devices
* Star systems
* Linked terminals
* Authorized fleet consoles
* Orbital kiosks
* Holographic access points

Users may disable cookies, though certain services may become unavailable.

---

# Section 7 — Data Sharing

StellarX does not sell personal data.

However, data may be shared with:

* Regulatory authorities
* Fraud prevention agencies
* Galactic compliance bureaus
* Security partners
* AI monitoring systems
* Interstellar financial councils
* Authorized investigation units
* Legal enforcement divisions

Data transfers may occur across:

* Planets
* Moons
* Orbital stations
* Colonized sectors
* Interstellar relay systems
* Deep-space financial nodes

---

# Section 8 — Artificial Intelligence Monitoring

StellarX deploys autonomous AI systems to:

* Detect suspicious activity
* Analyze risk patterns
* Prevent cyber attacks
* Investigate transaction anomalies
* Identify behavioral deviations
* Monitor access attempts
* Predict fraud scenarios

AI systems may autonomously:

* Freeze transactions
* Flag accounts
* Escalate investigations
* Trigger verification workflows
* Restrict access permissions
* Initiate security lockdowns

---

# Section 9 — Quantum Banking Infrastructure

The StellarX Quantum Banking Grid is designed to ensure:

* Near-instant universal settlement
* Cross-galaxy transaction consistency
* Redundant cryptographic integrity
* Autonomous fault recovery
* Immutable transaction recording
* Distributed trust consensus

Our quantum infrastructure includes:

* Entanglement synchronization arrays
* Quantum key rotation engines
* Parallel transaction validation systems
* Autonomous encryption cores
* Temporal consistency validators

---

# Section 10 — User Responsibilities

Users are responsible for:

* Maintaining password secrecy
* Protecting neural access devices
* Reporting unauthorized access
* Avoiding credential sharing
* Monitoring transaction history
* Updating security settings
* Protecting biometric authentication data

Users must not:

* Attempt unauthorized access
* Reverse engineer systems
* Circumvent security controls
* Deploy malicious software
* Interfere with banking operations
* Perform orbital denial-of-service attacks

---

# Section 11 — Security Incident Response

In the unlikely event of a security incident, StellarX may:

* Restrict account access
* Freeze transactions
* Rotate encryption keys
* Trigger emergency containment protocols
* Notify affected users
* Engage cyber-defense fleets
* Coordinate with authorities

StellarX maintains:

* Incident response teams
* Forensic cyber units
* Emergency recovery systems
* Disaster continuity infrastructure
* Redundant backup constellations

---

# Section 12 — Data Retention

We retain information for:

* Regulatory compliance
* Security auditing
* Fraud prevention
* Transaction validation
* Legal obligations
* Historical accounting purposes

Archived data may be stored in:

* Deep-space vaults
* Cryogenic data chambers
* Quantum archives
* Interplanetary backup facilities

---

# Section 13 — Children & Minor Entities

StellarX services are not intended for:

* Juvenile organisms
* Unregistered clones
* Unauthorized AI constructs
* Underage interstellar travelers
* Synthetic minors

Guardians are responsible for supervising dependent entities.

---

# Section 14 — International & Interstellar Transfers

By using StellarX services, users acknowledge that data may be processed in:

* Multiple planetary jurisdictions
* Interstellar territories
* Orbital processing facilities
* Deep-space backup stations
* Quantum relay systems

Users consent to these transfers.

---

# Section 15 — Availability Disclaimer

While StellarX strives for uninterrupted operation, we do not guarantee continuous availability.

Services may be impacted by:

* Solar storms
* Wormhole instability
* Quantum relay degradation
* Asteroid impacts
* Interstellar communication delays
* Galactic conflict events
* Cosmic radiation interference
* AI containment incidents

---

# Section 16 — Liability Limitation

To the maximum extent permitted under galactic law, StellarX shall not be liable for:

* Indirect damages
* Temporal inconsistencies
* Quantum synchronization anomalies
* Cross-dimensional financial disruptions
* Wormhole-related duplication events
* Unauthorized cyber intrusions
* Planetary infrastructure failures

Users access services at their own discretion.

---

# Section 17 — Transparency Statement

StellarX believes trust is earned through transparency.

Our organization continuously invests in:

* Security research
* Quantum cryptography
* AI defense systems
* Infrastructure resilience
* Fraud prevention innovation
* Interstellar compliance initiatives
* Consumer trust programs

We remain committed to maintaining what we believe to be one of the most advanced banking security ecosystems ever conceived.

---

# Section 18 — Amendments

StellarX reserves the right to modify this Privacy Policy at any time.

Updated versions may be published through:

* Banking portals
* Orbital kiosks
* Interstellar communications
* Holographic notification systems
* Mobile applications

Continued use of StellarX services constitutes acceptance of updated terms.

---

# Section 19 — Contact Information

## StellarX Intergalactic Banking Authority

Sector: Orion Financial Corridor
Relay Node: VX-77-Gamma
Deep Space Compliance Channel: active 24/7
Maintance officer : Bob
Id : boba10
Emergency Fraud Beacon: Enabled

For support inquiries:

* Galactic Secure Messaging Portal
* Quantum Assistance Relay
* Orbital Customer Service Hubs
* StellarX Mobile Banking Application

---

# Final Statement

StellarX remains dedicated to safeguarding the financial future of every citizen, traveler, explorer, merchant, fleet commander, synthetic intelligence, and interstellar organization connected to our network.

Through advanced encryption, autonomous security monitoring, quantum-grade infrastructure, and universal banking innovation, StellarX continues to redefine what secure banking means in a connected galaxy.

Thank you for choosing StellarX.

**"Secure Beyond the Stars."**`}</ReactMarkdown>
              </div>
              <div className="sx-modal-actions">

                <button className="sx-btn-secondary" onClick={() => setShowPrivacyPolicy(false)}>Decline</button>
                <button className="sx-btn" style={{ width: 'auto' }} onClick={handleRegister}>Accept</button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Material Symbols font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
      />
    </>
  );
}

/* ── Floating label field component ── */
function FloatingField({
  id,
  label,
  type,
  icon,
  value,
  onChange,
  onEnter
}) {
  const [focused, setFocused] = useState(false);
  const isActive = focused;
  const isFilled = value.length > 0;

  return (
    <div className={`sx-field${isActive ? " active" : ""}${isFilled ? " filled" : ""}`}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}

        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter?.();
          }
        }}

        autoComplete={
          type === "password"
            ? "current-password"
            : "username"
        }
      />

      <label htmlFor={id}>{label}</label>
      <span className="material-symbols-outlined sx-field-icon">
        {icon}
      </span>
    </div>
  );
}

/* ── Animated stat counter ── */
function AnimatedStat({ value, mounted, delay }) {
  const [display, setDisplay] = useState("");
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!mounted || hasAnimated.current) return;
    hasAnimated.current = true;

    const numMatch = value.match(/([\d.]+)/);
    if (!numMatch) { setDisplay(value); return; }

    const numPart = parseFloat(numMatch[1]);
    const prefix = value.slice(0, value.indexOf(numMatch[1]));
    const suffix = value.slice(value.indexOf(numMatch[1]) + numMatch[1].length);
    const duration = 1200;
    const steps = 30;
    const stepTime = duration / steps;
    let step = 0;

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        step++;
        const progress = step / steps;
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = numPart * eased;
        const decimals = numMatch[1].includes('.') ? numMatch[1].split('.')[1].length : 0;
        setDisplay(`${prefix}${current.toFixed(decimals)}${suffix}`);
        if (step >= steps) clearInterval(interval);
      }, stepTime);
    }, delay);

    return () => clearTimeout(timer);
  }, [mounted, value, delay]);

  return (
    <span className={`sx-stat-value${value.startsWith('$') || value.startsWith('₹') ? ' accent' : ''}`}>
      {display || value}
    </span>
  );
}

