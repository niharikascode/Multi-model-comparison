import React from 'react'
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const s = { display: 'Syne, sans-serif', mono: 'JetBrains Mono, monospace' };

const AVAILABLE_MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', short: 'Llama 3.3' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', short: 'Llama 3.1' },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout', short: 'L4 Scout' },
  { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', label: 'Llama 4 Maverick', short: 'L4 Maverick' },
  { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B', short: 'GPT-OSS 120B' },
  { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B', short: 'GPT-OSS 20B' },
  { id: 'qwen/qwen-3-32b', label: 'Qwen 3 32B', short: 'Qwen 3' },
  { id: 'moonshotai/kimi-k2-instruct-0905', label: 'Kimi K2', short: 'Kimi K2' },
];

const getShort = (id) => AVAILABLE_MODELS.find(m => m.id === id)?.short || id.split('/').pop();

const COLORS = ['#63b3ed','#68d391','#f6ad55','#fc8181','#b794f4','#76e4f7','#fbb6ce','#90cdf4'];

const BarChart = ({ data, maxVal = 10 }) => {
  if (!data.length) return null;
  const chartH = 180;
  const barW = Math.min(60, Math.floor(500 / data.length) - 12);
  const totalW = data.length * (barW + 12);

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <svg width={Math.max(totalW + 40, 300)} height={chartH + 60} style={{ display: 'block', margin: '0 auto' }}>
        {/* Grid lines */}
        {[0, 2.5, 5, 7.5, 10].map(v => {
          const y = chartH - (v / maxVal) * chartH;
          return (
            <g key={v}>
              <line x1={20} y1={y} x2={totalW + 20} y2={y} stroke="rgba(99,179,237,0.06)" strokeWidth={1} />
              <text x={14} y={y + 4} fontSize={9} fill="#4a5568" textAnchor="end" fontFamily={s.mono}>{v}</text>
            </g>
          );
        })}
        {data.map(({ label, value, color }, i) => {
          const x = 20 + i * (barW + 12);
          const barH = (value / maxVal) * chartH;
          const y = chartH - barH;
          return (
            <g key={label}>
              {/* Bar background */}
              <rect x={x} y={0} width={barW} height={chartH} fill="rgba(99,179,237,0.03)" rx={4} />
              {/* Bar */}
              <rect x={x} y={y} width={barW} height={barH} fill={color} rx={4} opacity={0.85} />
              {/* Glow */}
              <rect x={x} y={y} width={barW} height={Math.min(barH, 4)} fill={color} rx={2} opacity={0.5} />
              {/* Value */}
              <text x={x + barW/2} y={y - 6} fontSize={11} fill={color} textAnchor="middle" fontFamily={s.display} fontWeight="700">{value}</text>
              {/* Label */}
              <text x={x + barW/2} y={chartH + 16} fontSize={9} fill="#718096" textAnchor="middle" fontFamily={s.mono}>{label}</text>
              {/* Battles count */}
              <text x={x + barW/2} y={chartH + 28} fontSize={8} fill="#4a5568" textAnchor="middle" fontFamily={s.mono}>{data[i].battles}b</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const Stats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedBattle, setExpandedBattle] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/stats`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      const json = await res.json();
      setData(json);
    } catch (err) {
      toast.error(`Failed to load stats: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleClear = async () => {
    if (!confirm('Clear all battle history? This cannot be undone.')) return;
    try {
      await fetch(`${BACKEND_URL}/stats/clear`, { method: 'DELETE' });
      toast.success('Battle history cleared.');
      fetchStats();
    } catch (err) {
      toast.error('Failed to clear stats.');
    }
  };

  const chartData = data?.leaderboard.map((entry, i) => ({
    label: getShort(entry.model),
    value: entry.avg,
    battles: entry.battles,
    color: COLORS[i % COLORS.length],
  })) || [];

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>

      {/* Header */}
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, animation: 'fadeUp 0.5s ease' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#63b3ed', fontFamily: s.mono, marginBottom: 10, opacity: 0.8 }}>📊 battle stats</div>
          <h1 style={{ fontFamily: s.display, fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#e8f0fe', lineHeight: 1 }}>
            Leaderboard &<br />
            <span style={{ background: 'linear-gradient(135deg, #63b3ed, #90cdf4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              History
            </span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={fetchStats} style={{ background: 'transparent', border: '1px solid rgba(99,179,237,0.2)', color: '#63b3ed', fontFamily: s.mono, fontSize: 11, padding: '7px 14px', borderRadius: 6, cursor: 'pointer' }}>
            ↻ refresh
          </button>
          {data?.total_battles > 0 && (
            <button onClick={handleClear} style={{ background: 'transparent', border: '1px solid rgba(252,129,129,0.2)', color: '#fc8181', fontFamily: s.mono, fontSize: 11, padding: '7px 14px', borderRadius: 6, cursor: 'pointer' }}>
              ✕ clear all
            </button>
          )}
        </div>
      </header>

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#4a5568', fontFamily: s.mono, fontSize: 12 }}>
          loading stats...
        </div>
      )}

      {!loading && data && (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2.5rem', animation: 'fadeUp 0.4s ease' }}>
            {[
              { label: 'Total Battles', value: data.total_battles, color: '#63b3ed' },
              { label: 'Models Tested', value: data.leaderboard.length, color: '#68d391' },
              { label: 'Top Model', value: data.leaderboard[0] ? getShort(data.leaderboard[0].model) : '—', color: '#f6ad55', small: true },
            ].map(({ label, value, color, small }) => (
              <div key={label} style={{ background: 'var(--surface)', border: '1px solid rgba(99,179,237,0.08)', borderRadius: 12, padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontFamily: s.display, fontSize: small ? 18 : 32, fontWeight: 800, color, lineHeight: 1, marginBottom: 6 }}>{value}</div>
                <div style={{ fontFamily: s.mono, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4a5568' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
                <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4a5568', fontFamily: s.mono }}>avg score by model</div>
                <div style={{ flex: 1, height: 1, background: 'rgba(99,179,237,0.06)' }} />
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid rgba(99,179,237,0.08)', borderRadius: 12, padding: '1.5rem', marginBottom: '2.5rem', animation: 'fadeUp 0.5s ease' }}>
                <BarChart data={chartData} maxVal={10} />
              </div>
            </>
          )}

          {/* Leaderboard Table */}
          {data.leaderboard.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
                <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4a5568', fontFamily: s.mono }}>leaderboard</div>
                <div style={{ flex: 1, height: 1, background: 'rgba(99,179,237,0.06)' }} />
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid rgba(99,179,237,0.08)', borderRadius: 12, overflow: 'hidden', marginBottom: '2.5rem', animation: 'fadeUp 0.5s ease' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(99,179,237,0.04)' }}>
                      {['Rank', 'Model', 'Avg Score', 'Battles'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Rank' || h === 'Avg Score' || h === 'Battles' ? 'center' : 'left', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4a5568', fontWeight: 400, fontFamily: s.mono, borderBottom: '1px solid rgba(99,179,237,0.08)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.leaderboard.map((entry, i) => {
                      const color = COLORS[i % COLORS.length];
                      const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;
                      return (
                        <tr key={entry.model} style={{ borderBottom: i < data.leaderboard.length - 1 ? '1px solid rgba(99,179,237,0.04)' : 'none' }}>
                          <td style={{ padding: '14px 16px', textAlign: 'center', fontFamily: s.display, fontSize: 16, fontWeight: 800 }}>{rankEmoji}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontFamily: s.display, fontSize: 14, fontWeight: 700, color: '#e8f0fe' }}>{AVAILABLE_MODELS.find(m => m.id === entry.model)?.label || entry.model}</div>
                            <div style={{ fontFamily: s.mono, fontSize: 10, color: '#4a5568', marginTop: 2 }}>{entry.model}</div>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ fontFamily: s.display, fontSize: 18, fontWeight: 800, color, textShadow: `0 0 12px ${color}44` }}>{entry.avg}</span>
                            <span style={{ fontFamily: s.mono, fontSize: 10, color: '#4a5568' }}>/10</span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center', fontFamily: s.mono, fontSize: 12, color: '#718096' }}>{entry.battles}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Battle History */}
          {data.battles.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
                <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4a5568', fontFamily: s.mono }}>battle history</div>
                <div style={{ flex: 1, height: 1, background: 'rgba(99,179,237,0.06)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.battles.map((battle) => {
                  const winner = Object.entries(battle.avg_scores).sort(([,a],[,b]) => b - a)[0];
                  const isExpanded = expandedBattle === battle.id;
                  return (
                    <div key={battle.id} style={{ background: 'var(--surface)', border: '1px solid rgba(99,179,237,0.08)', borderRadius: 10, overflow: 'hidden', animation: 'fadeUp 0.3s ease' }}>
                      <button onClick={() => setExpandedBattle(isExpanded ? null : battle.id)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: s.mono, fontSize: 12, color: '#cbd5e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{battle.prompt}</div>
                          <div style={{ fontFamily: s.mono, fontSize: 10, color: '#4a5568', marginTop: 4 }}>
                            {formatDate(battle.created_at)} · {battle.models.length} models
                            {winner && <span style={{ marginLeft: 10, color: '#63b3ed' }}>winner: {getShort(winner[0])} ({winner[1]}/10)</span>}
                          </div>
                        </div>
                        <span style={{ color: '#4a5568', fontSize: 10 }}>{isExpanded ? '▲' : '▼'}</span>
                      </button>

                      {isExpanded && (
                        <div style={{ borderTop: '1px solid rgba(99,179,237,0.06)', padding: '14px 16px', animation: 'fadeUp 0.2s ease' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            {battle.models.map((model, i) => {
                              const score = battle.avg_scores[model];
                              const color = COLORS[i % COLORS.length];
                              return (
                                <div key={model} style={{ background: `${color}0a`, border: `1px solid ${color}25`, borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{ fontFamily: s.mono, fontSize: 11, color: '#718096' }}>{getShort(model)}</span>
                                  <span style={{ fontFamily: s.display, fontSize: 14, fontWeight: 800, color }}>{score}/10</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {data.total_battles === 0 && (
            <div style={{ textAlign: 'center', padding: '5rem 0', animation: 'fadeUp 0.5s ease' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>📊</div>
              <div style={{ fontFamily: s.display, fontSize: '1.3rem', fontWeight: 700, color: '#2d3748', marginBottom: 8 }}>No battles yet</div>
              <div style={{ fontFamily: s.mono, fontSize: 12, color: '#4a5568' }}>run a battle on the home page to see stats here</div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Stats;