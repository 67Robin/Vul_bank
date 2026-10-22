"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TopNav() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    setUsername(sessionStorage.getItem("username"));
    setRole(sessionStorage.getItem("role"));
  }, []);

  return (
    <nav className="sx-nav">
      <div className="sx-logo" onClick={() => router.push("/dashboard")}>
        <span className="material-symbols-outlined sx-logo-icon" style={{ fontSize: '28px' }}>account_balance</span>
        <span className="sx-logo-text sx-nav-text">StellarX</span>
      </div>
      <div className="sx-user-controls">
        <span>SESSION_ID // {username}</span>
        {role === 'admin' && (
          <div className="sx-badge-admin">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>admin_panel_settings</span>
            ROOT
          </div>
        )}
        <div 
          className="sx-logout"
          onClick={() => { sessionStorage.clear(); router.push("/"); }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>power_settings_new</span>
          TERMINATE
        </div>
      </div>
    </nav>
  );
}