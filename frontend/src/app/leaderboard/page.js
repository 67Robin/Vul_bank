"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Trophy, Crosshair, ArrowLeft, Activity } from "lucide-react";

export default function LeaderboardPage() {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Fetch the leaderboard data when the hidden page loads
        axios.get("/api/v1/leaderboard")
            .then((res) => {
                setPlayers(res.data.leaderboard);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load leaderboard", err);
                setLoading(false);
            });
    }, []);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

                .lx-root {
                    min-height: 100svh;
                    background: #050505;
                    color: #F0F0F0;
                    font-family: system-ui, -apple-system, sans-serif;
                    padding: 60px 40px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .lx-container {
                    width: 100%;
                    max-width: 900px;
                }

                .lx-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 40px;
                    border-bottom: 1px solid #1A1A1A;
                    padding-bottom: 20px;
                }

                .lx-title-wrap {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .lx-title {
                    font-family: 'Syne', sans-serif;
                    font-size: 32px;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    color: #F0F0F0;
                    text-transform: uppercase;
                }

                .lx-title span {
                    color: #115fe8;
                }

                .lx-back-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #141414;
                    border: 1px solid #1E1E1E;
                    color: #6B6B6B;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 12px;
                    text-transform: uppercase;
                    transition: all 0.2s ease;
                }

                .lx-back-btn:hover {
                    color: #F0F0F0;
                    border-color: #2A2A2A;
                    background: #1A1A1A;
                }

                .lx-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: #0D0D0D;
                    border: 1px solid #1A1A1A;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .lx-th {
                    text-align: left;
                    padding: 16px 24px;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 11px;
                    font-weight: 600;
                    color: #6B6B6B;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    border-bottom: 1px solid #1A1A1A;
                    background: #0A0A0A;
                }

                .lx-tr {
                    border-bottom: 1px solid #111;
                    transition: background 0.15s;
                }

                .lx-tr:hover {
                    background: rgba(17, 95, 232, 0.05);
                }

                .lx-td {
                    padding: 16px 24px;
                    font-size: 14px;
                }

                .lx-rank {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 16px;
                    font-weight: 700;
                    color: #6B6B6B;
                }

                .lx-rank.top-1 { color: #FFD700; text-shadow: 0 0 10px rgba(255, 215, 0, 0.3); }
                .lx-rank.top-2 { color: #C0C0C0; }
                .lx-rank.top-3 { color: #CD7F32; }

                .lx-team {
                    font-family: 'Syne', sans-serif;
                    font-weight: 700;
                    color: #F0F0F0;
                }

                .lx-target {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 12px;
                    color: #FF453A;
                    background: rgba(255, 69, 58, 0.1);
                    padding: 4px 8px;
                    border-radius: 4px;
                    border: 1px solid rgba(255, 69, 58, 0.2);
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }

                .lx-score {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 16px;
                    font-weight: 700;
                    color: #115fe8;
                    text-align: right;
                }

                .lx-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    padding: 60px;
                    color: #6B6B6B;
                    font-family: 'JetBrains Mono', monospace;
                }

                .lx-spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }

                /* ── Responsive ── */
                @media (max-width: 768px) {
                    .lx-container { padding: 16px; border: none; }
                    .lx-header { margin-bottom: 24px; }
                    .lx-title { font-size: 20px; }
                    .lx-th:nth-child(3), .lx-td:nth-child(3) { display: none; }
                    .lx-th:nth-child(2), .lx-td:nth-child(2) { width: auto; }
                    .lx-root { padding: 0; }
                }

                @media (max-width: 480px) {
                    .lx-header { flex-direction: column; align-items: flex-start; gap: 16px; }
                    .lx-back-btn { width: 100%; justify-content: center; }
                    .lx-score { font-size: 14px; }
                    .lx-rank { width: 32px; height: 32px; font-size: 11px; }
                }
            `}</style>

            <div className="lx-root">
                <div className="lx-container">
                    
                    <div className="lx-header">
                        <div className="lx-title-wrap">
                            <Trophy size={32} color="#115fe8" />
                            <h1 className="lx-title">Global <span>Network</span> Status</h1>
                        </div>
                        <button className="lx-back-btn" onClick={() => router.push("/dashboard")}>
                            <ArrowLeft size={14} /> Back
                        </button>
                    </div>

                    <div className="lx-table-wrap">
                        <table className="lx-table">
                            <thead>
                                <tr>
                                    <th className="lx-th">Rank</th>
                                    <th className="lx-th">Operative</th>
                                    <th className="lx-th">Target Account No.</th>
                                    <th className="lx-th" style={{ textAlign: 'right' }}>Xp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4">
                                            <div className="lx-loading">
                                                <Activity size={24} className="lx-spin" />
                                                Scanning network packets...
                                            </div>
                                        </td>
                                    </tr>
                                ) : players.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#6B6B6B' }}>
                                            No operatives found on the network.
                                        </td>
                                    </tr>
                                ) : (
                                    players.map((player) => (
                                        <tr key={player.rank} className="lx-tr">
                                            <td className="lx-td">
                                                <span className={`lx-rank top-${player.rank}`}>
                                                    #{player.rank}
                                                </span>
                                            </td>
                                            <td className="lx-td">
                                                <div className="lx-team" dangerouslySetInnerHTML={{ __html: player.nickname }} />
                                                <div style={{ fontSize: '11px', color: '#6B6B6B', marginTop: '4px' }}>
                                                    ID: {player.team_name}
                                                </div>
                                            </td>
                                            <td className="lx-td">
                                                <span className="lx-target">
                                                    <Crosshair size={12} />
                                                    {player.target_account}
                                                </span>
                                            </td>
                                            <td className="lx-td">
                                                <div className="lx-score">{player.score.toLocaleString()}</div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </>
    );
}