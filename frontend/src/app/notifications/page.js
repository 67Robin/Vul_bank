"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import TopNav from "../components/TopNav"; // Adjust path if needed

export default function NotificationsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAlerts = async () => {
      const userId = sessionStorage.getItem("user_id");
      if (!userId) {
        router.push("/");
        return;
      }
      try {
        const response = await axios.get(`/api/v1/notifications`, {
          headers: { 'Authorization': `Bearer ${userId}` }
        });
        setAlerts(response.data.notifications);
      } catch (err) {
        console.error("Failed to fetch alerts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [router]);

  return (
    <div className="sx-root" style={{ background: '#020005', minHeight: '100vh' }}>
      <div className="sx-scanlines" />
      <TopNav />

      <main className="sx-main" style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <span className="material-symbols-outlined" style={{ color: '#e5e2e1', fontSize: '32px' }}>warning</span>
          <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: '24px', fontWeight: '700', color: '#e5e2e1', letterSpacing: '0.05em' }}>
            SYSTEM ALERTS
          </h2>
        </div>

        <div className="sx-card" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          {loading ? (
            <div style={{ color: '#585b61ff', fontFamily: '"JetBrains Mono", monospace' }}>SCANNING LOGS...</div>
          ) : alerts.length === 0 ? (
            <div style={{ color: '#585b61ff', fontFamily: '"JetBrains Mono", monospace' }}>NO NEW ALERTS.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.map((alert) => (
                <div key={alert.id} style={{ 
                  background: alert.is_read ? '#0a0a0a' : 'rgba(255, 69, 58, 0.1)', 
                  borderLeft: `4px solid ${alert.message.includes('🛡️') ? '#115fe8c6' : '#ff453a'}`, 
                  padding: '16px', 
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '13px'
                }}>
                  <div style={{ color: '#585b61ff', fontSize: '10px', marginBottom: '8px' }}>
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                  {/* VULNERABILITY: BLIND XSS
                    If a malicious payload is saved into the database, it detonates right here 
                    in the victim's browser without them doing anything but opening the page.
                  */}
                  <div 
                    style={{ color: '#e5e2e1' }}
                    dangerouslySetInnerHTML={{ __html: alert.message }} 
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}