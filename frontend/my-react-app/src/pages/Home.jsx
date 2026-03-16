import React from 'react'
import { useState } from 'react';
import { toast } from 'sonner';
import { AVAILABLE_MODELS, getModelInfo } from '../constants/models';
import ModelSelector from '../Components/Body/ModelSelector';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const s = { display: 'Syne, sans-serif', mono: 'JetBrains Mono, monospace' };

const parseRating = (text) => {
  if (typeof text === 'number') return text;
  const str = String(text);
  const bracket = str.match(/\[rating:\s*(\d+(?:\.\d+)?)\]/i);
  if (bracket) return parseFloat(bracket[1]);
  const plain = str.match(/\b(10|[1-9])\b/);
  return plain ? parseFloat(plain[1]) : null;
};

const extractReason = (text) => {
  if (typeof text !== 'string') return null;
  const cleaned = text.replace(/\[rating:\s*\d+(?:\.\d+)?\]/gi, '').trim();
  return cleaned.length > 0 ? cleaned : null;
};

const Cursor = () => <span style={{ display: 'inline-block', width: 2, height: '1em', background: '#63b3ed', marginLeft: 2, verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />;
const Spinner = () => (
  <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
    {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#63b3ed', animation: 'pulse-glow 1.2s ease-in-out infinite', animationDelay: `${i*0.2}s`, boxShadow: '0 0 6px rgba(99,179,237,0.6)' }} />)}
  </span>
);

const ScoreBar = ({ rawScore, fromLabel }) => {
  const [expanded, setExpanded] = useState(false);
  const num = parseRating(rawScore);
  const pct = num !== null ? (num / 10) * 100 : 0;
  const color = num === null ? '#4a5568' : num >= 7 ? '#68d391' : num >= 5 ? '#f6ad55' : '#fc8181';
  const glow = num === null ? 'transparent' : num >= 7 ? 'rgba(104,211,145,0.3)' : num >= 5 ? 'rgba(246,173,85,0.3)' : 'rgba(252,129,129,0.3)';
  const reason = extractReason(rawScore);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 10, color: '#4a5568', width: 78, flexShrink: 0, fontFamily: s.mono }}>{fromLabel}</span>
        <div style={{ flex: 1, height: 3, background: 'rgba(99,179,237,0.08)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: color, boxShadow: `0 0 8px ${glow}`, transition: 'width 1s cubic-bezier(0.22,1,0.36,1)' }} />
        </div>
        <span style={{ fontSize: 12, color, fontWeight: 600, width: 24, textAlign: 'right', flexShrink: 0, fontFamily: s.display }}>{num !== null ? num : '?'}</span>
        {reason && <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: expanded ? '#63b3ed' : '#4a5568', fontSize: 9, padding: '0 2px', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</button>}
      </div>
      {expanded && reason && (
        <div style={{ marginTop: 6, marginLeft: 88, fontSize: 11, color: '#718096', lineHeight: 1.6, fontStyle: 'italic', fontFamily: s.mono, borderLeft: `2px solid ${color}55`, paddingLeft: 10 }}>{reason}</div>
      )}
    </div>
  );
};

const ModelCard = ({ model, response, ratings, isLoading, rank }) => {
  const modelInfo = getModelInfo(model);
  const ratingEntries = ratings ? Object.entries(ratings).filter(([rater]) => rater !== model) : [];
  const parsedScores = ratingEntries.map(([, scores]) => parseRating(scores[model])).filter(s => s !== null);
  const avg = parsedScores.length ? (parsedScores.reduce((a, b) => a + b, 0) / parsedScores.length).toFixed(1) : null;
  const isWinner = rank === 1 && avg !== null;
  const isError = response?.startsWith('[groq error]') || response?.startsWith('[request error]');

  return (
    <div style={{ background: '#0d1220', border: `1px solid ${isError ? 'rgba(252,129,129,0.3)' : isWinner ? 'rgba(99,179,237,0.4)' : isLoading ? 'rgba(99,179,237,0.2)' : 'rgba(99,179,237,0.08)'}`, borderRadius: 12, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', overflow: 'hidden', boxShadow: isWinner ? '0 0 40px rgba(99,179,237,0.1)' : 'none', animation: 'fadeUp 0.4s ease' }}>
      {isWinner && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #63b3ed, #90cdf4, #63b3ed, transparent)', backgroundSize: '200% auto', animation: 'shimmer 2s linear infinite' }} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4a5568', marginBottom: 4, fontFamily: s.mono }}>{isWinner ? '🏆 winner' : `model_${String(rank||'').padStart(2,'0')}`}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: isWinner ? '#90cdf4' : '#e8f0fe', fontFamily: s.display, letterSpacing: '-0.02em' }}>{modelInfo.label}</div>
        </div>
        {avg !== null ? (
          <div style={{ textAlign: 'center', background: 'rgba(99,179,237,0.06)', border: '1px solid rgba(99,179,237,0.15)', borderRadius: 8, padding: '6px 12px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#63b3ed', fontFamily: s.display, lineHeight: 1 }}>{avg}</div>
            <div style={{ fontSize: 9, color: '#4a5568', fontFamily: s.mono }}>/10</div>
          </div>
        ) : isLoading ? <Spinner /> : null}
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.75, color: isError ? '#fc8181' : response ? '#cbd5e0' : '#4a5568', fontStyle: response ? 'normal' : 'italic', whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: 80, background: response ? (isError ? 'rgba(252,129,129,0.04)' : 'rgba(99,179,237,0.02)') : 'transparent', borderRadius: 6, padding: response ? '10px 12px' : '0', border: response ? `1px solid ${isError ? 'rgba(252,129,129,0.1)' : 'rgba(99,179,237,0.06)'}` : 'none' }}>
        {response || (isLoading ? <span>generating response <Cursor /></span> : 'awaiting prompt...')}
      </div>
      {ratingEntries.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(99,179,237,0.08)', paddingTop: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4a5568', marginBottom: 10, fontFamily: s.mono }}>peer ratings</div>
          {ratingEntries.map(([rater, scores]) => (
            <ScoreBar key={rater} rawScore={scores[model]} fromLabel={getModelInfo(rater).short} />
          ))}
        </div>
      )}
    </div>
  );
};

const Home = () => {
  const [prompt, setPrompt] = useState('');
  const [lastPrompt, setLastPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState(['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']);
  const [responses, setResponses] = useState({});
  const [ratings, setRatings] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleModel = (id) => setSelectedModels(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const getModelRank = (model) => {
    if (!Object.keys(ratings).length) return null;
    const ranked = selectedModels.map(m => {
      const scores = selectedModels.filter(r => r !== m).map(r => parseRating(ratings[r]?.[m])).filter(s => s !== null);
      return { model: m, avg: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0 };
    }).sort((a, b) => b.avg - a.avg);
    return ranked.findIndex(r => r.model === model) + 1;
  };

  const runBattle = async (promptText) => {
    if (!promptText.trim() || selectedModels.length === 0) { toast.error('Enter a prompt and select at least one model.'); return; }
    setIsGenerating(true);
    setResponses({});
    setRatings({});
    setLastPrompt(promptText);
    try {
      const res = await fetch(`${BACKEND_URL}/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: promptText, models: selectedModels }) });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResponses(data.responses || {});
      setRatings(data.ratings || {});
      toast.success('Battle complete! Results saved to stats.');
    } catch (err) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const hasResults = Object.keys(responses).length > 0;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>
      <header style={{ marginBottom: '3.5rem', textAlign: 'center', animation: 'fadeUp 0.5s ease' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#63b3ed', fontFamily: s.mono, marginBottom: 16, opacity: 0.8 }}>⚡ groq-powered</div>
        <h1 style={{ fontFamily: s.display, fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: '#e8f0fe', marginBottom: 8 }}>
          AI Model<br />
          <span style={{ background: 'linear-gradient(135deg, #63b3ed 0%, #90cdf4 50%, #63b3ed 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'shimmer 3s linear infinite' }}>Battle</span>
        </h1>
        <p style={{ color: '#4a5568', fontFamily: s.mono, fontSize: 12 }}>submit a prompt → models respond → models rate each other</p>
      </header>

      <div style={{ background: '#0d1220', border: '1px solid rgba(99,179,237,0.1)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem', animation: 'fadeUp 0.5s ease 0.1s both' }}>
        <label style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#63b3ed', display: 'block', marginBottom: 10, fontFamily: s.mono }}>prompt</label>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Ask something the models will have to battle over..." rows={3}
          style={{ width: '100%', background: 'transparent', border: 'none', color: '#e8f0fe', fontFamily: s.mono, fontSize: 13.5, outline: 'none', resize: 'none', lineHeight: 1.7 }}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) runBattle(prompt); }}
        />
        <div style={{ borderTop: '1px solid rgba(99,179,237,0.06)', paddingTop: 12, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 10, color: '#4a5568', fontFamily: s.mono }}>⌘↵ to run</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {hasResults && (
              <button onClick={() => runBattle(lastPrompt)} disabled={isGenerating} style={{ background: 'transparent', border: '1px solid rgba(99,179,237,0.25)', color: '#63b3ed', fontFamily: s.display, fontSize: 12, fontWeight: 700, padding: '9px 18px', borderRadius: 8, cursor: isGenerating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                🔁 rematch
              </button>
            )}
            <button onClick={() => runBattle(prompt)} disabled={isGenerating} style={{ background: isGenerating ? 'transparent' : 'linear-gradient(135deg, #2b6cb0, #3182ce)', border: isGenerating ? '1px solid rgba(99,179,237,0.3)' : 'none', color: isGenerating ? '#63b3ed' : '#fff', fontFamily: s.display, fontSize: 13, fontWeight: 700, padding: '10px 28px', borderRadius: 8, cursor: isGenerating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: isGenerating ? 'none' : '0 0 20px rgba(49,130,206,0.4)' }}>
              {isGenerating ? <><Spinner /> running battle...</> : '⚡ run battle'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2.5rem', animation: 'fadeUp 0.5s ease 0.2s both' }}>
        <ModelSelector selectedModels={selectedModels} onToggle={toggleModel} />
      </div>

      {(isGenerating || hasResults) && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4a5568', fontFamily: s.mono }}>responses</div>
            <div style={{ flex: 1, height: 1, background: 'rgba(99,179,237,0.06)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(selectedModels.length, 2)}, 1fr)`, gap: '1rem', marginBottom: '3rem' }}>
            {selectedModels.map((model, i) => (
              <ModelCard key={model} model={model} response={responses[model]} ratings={ratings} isLoading={isGenerating && !responses[model]} rank={getModelRank(model) || (i+1)} />
            ))}
          </div>
        </>
      )}

      {Object.keys(ratings).length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4a5568', fontFamily: s.mono }}>ratings matrix</div>
            <div style={{ flex: 1, height: 1, background: 'rgba(99,179,237,0.06)' }} />
          </div>
          <div style={{ background: '#0d1220', border: '1px solid rgba(99,179,237,0.08)', borderRadius: 12, overflow: 'hidden', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'rgba(99,179,237,0.04)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid rgba(99,179,237,0.08)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4a5568', fontWeight: 400, fontFamily: s.mono }}>rater ↓ / rated →</th>
                  {selectedModels.map(m => <th key={m} style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid rgba(99,179,237,0.08)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#718096', fontWeight: 400, fontFamily: s.mono }}>{getModelInfo(m).short}</th>)}
                  <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid rgba(99,179,237,0.08)', fontSize: 9, color: '#63b3ed', fontWeight: 400, fontFamily: s.mono }}>avg</th>
                </tr>
              </thead>
              <tbody>
                {selectedModels.map((rater, ri) => {
                  const raterRatings = ratings[rater] || {};
                  const nums = selectedModels.filter(m => m !== rater).map(m => parseRating(raterRatings[m])).filter(s => s !== null);
                  const avg = nums.length ? (nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(1) : '—';
                  return (
                    <tr key={rater} style={{ borderBottom: ri < selectedModels.length-1 ? '1px solid rgba(99,179,237,0.04)' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontSize: 10, color: '#718096', fontFamily: s.mono }}>{getModelInfo(rater).short}</td>
                      {selectedModels.map(rated => {
                        const isSelf = rater === rated;
                        const num = isSelf ? null : parseRating(raterRatings[rated]);
                        const color = num === null ? '#4a5568' : num >= 7 ? '#68d391' : num >= 5 ? '#f6ad55' : '#fc8181';
                        return <td key={rated} style={{ padding: '12px 16px', textAlign: 'center' }}>{isSelf ? <span style={{ color: '#2d3748', fontFamily: s.mono }}>—</span> : <span style={{ background: `${color}18`, border: `1px solid ${color}44`, color, padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, fontFamily: s.display }}>{num !== null ? num : '?'}</span>}</td>;
                      })}
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: '#63b3ed', fontWeight: 700, fontFamily: s.display, fontSize: 13 }}>{avg}</td>
                    </tr>
                  );
                })}
                <tr style={{ background: 'rgba(99,179,237,0.03)', borderTop: '1px solid rgba(99,179,237,0.1)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#63b3ed', fontFamily: s.mono }}>avg score</td>
                  {selectedModels.map(model => {
                    const scores = selectedModels.filter(r => r !== model).map(r => parseRating(ratings[r]?.[model])).filter(s => s !== null);
                    const avg = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : '—';
                    return <td key={model} style={{ padding: '12px 16px', textAlign: 'center', color: '#90cdf4', fontWeight: 700, fontFamily: s.display, fontSize: 14 }}>{avg}</td>;
                  })}
                  <td style={{ padding: '12px 16px' }} />
                </tr>
              </tbody>
            </table>
          </div>

          {(() => {
            const ranked = selectedModels.map(model => {
              const scores = selectedModels.filter(r => r !== model).map(r => parseRating(ratings[r]?.[model])).filter(s => s !== null);
              return { model, avg: scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : 0 };
            }).sort((a,b) => b.avg - a.avg);
            const winner = ranked[0];
            return (
              <div style={{ background: 'linear-gradient(135deg, rgba(43,108,176,0.15), rgba(49,130,206,0.08))', border: '1px solid rgba(99,179,237,0.3)', borderRadius: 12, padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, boxShadow: '0 0 40px rgba(99,179,237,0.08)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #63b3ed, #90cdf4, #63b3ed, transparent)', backgroundSize: '200% auto', animation: 'shimmer 2s linear infinite' }} />
                <div>
                  <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#63b3ed', marginBottom: 6, fontFamily: s.mono }}>🏆 battle winner</div>
                  <div style={{ fontFamily: s.display, fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: '#e8f0fe', letterSpacing: '-0.02em' }}>{getModelInfo(winner.model).label}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: s.display, fontSize: '3rem', fontWeight: 800, color: '#63b3ed', lineHeight: 1, textShadow: '0 0 30px rgba(99,179,237,0.5)' }}>{winner.avg.toFixed(1)}</div>
                  <div style={{ fontSize: 10, color: '#4a5568', fontFamily: s.mono }}>avg score / 10</div>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {!isGenerating && !hasResults && (
        <div style={{ textAlign: 'center', padding: '5rem 0', animation: 'fadeUp 0.6s ease 0.3s both' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>⚔️</div>
          <div style={{ fontFamily: s.display, fontSize: '1.5rem', fontWeight: 700, color: '#2d3748', marginBottom: 8, letterSpacing: '-0.02em' }}>No battle yet</div>
          <div style={{ fontSize: 12, color: '#4a5568', fontFamily: s.mono }}>write a prompt, pick your fighters, hit run</div>
        </div>
      )}
    </div>
  );
};

export default Home;