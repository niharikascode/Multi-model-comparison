import { useState } from 'react';
import { toast } from 'sonner';
import { AVAILABLE_MODELS, getModelInfo } from '../constants/models';
import ModelSelector from '../Components/Body/ModelSelector';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const s = { display: 'Syne, sans-serif', mono: 'JetBrains Mono, monospace' };

const parseRating = (text) => {
  if (typeof text === 'number') return text;
  const str = String(text);
  const m = str.match(/\[rating:\s*(\d+(?:\.\d+)?)\]/i) || str.match(/\b(10|[1-9])\b/);
  return m ? parseFloat(m[1]) : null;
};


const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const Spinner = () => (
  <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
    {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#63b3ed', animation: 'pulse-glow 1.2s ease-in-out infinite', animationDelay: `${i*0.2}s` }} />)}
  </span>
);

const STEPS = { SETUP: 'setup', GENERATING: 'generating', VOTE: 'vote', REVEAL: 'reveal' };

const Blind = () => {
  const [step, setStep] = useState(STEPS.SETUP);
  const [prompt, setPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState(['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']);
  const [responses, setResponses] = useState({});   // model -> text
  const [ratings, setRatings] = useState({});
  const [shuffled, setShuffled] = useState([]);      // [{letter, model}] shuffled order
  const [votes, setVotes] = useState({});            // letter -> 1-5 score
  const [revealed, setRevealed] = useState(false);

  const toggleModel = (id) => setSelectedModels(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const handleGenerate = async () => {
    if (!prompt.trim() || selectedModels.length < 2) { toast.error('Enter a prompt and select at least 2 models.'); return; }
    setStep(STEPS.GENERATING);
    setResponses({});
    setRatings({});
    setVotes({});
    setRevealed(false);
    try {
      const res = await fetch(`${BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, models: selectedModels }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResponses(data.responses || {});
      setRatings(data.ratings || {});
      // Shuffle model order so user doesn't know which is which
      const shuffledOrder = [...selectedModels]
        .sort(() => Math.random() - 0.5)
        .map((model, i) => ({ letter: LETTERS[i], model }));
      setShuffled(shuffledOrder);
      setStep(STEPS.VOTE);
    } catch (err) {
      toast.error(`Failed: ${err.message}`);
      setStep(STEPS.SETUP);
    }
  };

  const allVoted = shuffled.length > 0 && shuffled.every(({ letter }) => votes[letter] !== undefined);

  const handleReveal = () => {
    if (!allVoted) { toast.error('Rate all responses before revealing!'); return; }
    setRevealed(true);
    setStep(STEPS.REVEAL);
  };

  const handleReset = () => { setStep(STEPS.SETUP); setPrompt(''); setResponses({}); setRatings({}); setShuffled([]); setVotes({}); setRevealed(false); };

  // Compute human winner vs AI winner
  const humanRanked = [...shuffled].sort((a, b) => (votes[b.letter] || 0) - (votes[a.letter] || 0));
  const aiRanked = [...shuffled].map(({ model }) => {
    const scores = selectedModels.filter(r => r !== model).map(r => parseRating(ratings[r]?.[model])).filter(s => s !== null);
    return { model, avg: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0 };
  }).sort((a, b) => b.avg - a.avg);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>

      {/* Header */}
      <header style={{ marginBottom: '3rem', textAlign: 'center', animation: 'fadeUp 0.5s ease' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#63b3ed', fontFamily: s.mono, marginBottom: 12, opacity: 0.8 }}>🎭 blind mode</div>
        <h1 style={{ fontFamily: s.display, fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#e8f0fe', marginBottom: 8 }}>
          Can You Tell<br />
          <span style={{ background: 'linear-gradient(135deg, #63b3ed, #90cdf4, #63b3ed)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'shimmer 3s linear infinite' }}>
            Them Apart?
          </span>
        </h1>
        <p style={{ color: '#4a5568', fontFamily: s.mono, fontSize: 12 }}>responses are hidden behind letters — vote before the reveal</p>
      </header>

      {/* STEP: SETUP */}
      {step === STEPS.SETUP && (
        <div style={{ animation: 'fadeUp 0.4s ease' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid rgba(99,179,237,0.1)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <label style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#63b3ed', display: 'block', marginBottom: 10, fontFamily: s.mono }}>prompt</label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Ask a question where response quality matters..." rows={3}
              style={{ width: '100%', background: 'transparent', border: 'none', color: '#e8f0fe', fontFamily: s.mono, fontSize: 13.5, outline: 'none', resize: 'none', lineHeight: 1.7 }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <ModelSelector selectedModels={selectedModels} onToggle={toggleModel} minSelect={2} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button onClick={handleGenerate} style={{ background: 'linear-gradient(135deg, #2b6cb0, #3182ce)', border: 'none', color: '#fff', fontFamily: s.display, fontSize: 13, fontWeight: 700, padding: '12px 36px', borderRadius: 8, cursor: 'pointer', boxShadow: '0 0 20px rgba(49,130,206,0.4)' }}>
              🎭 start blind battle
            </button>
          </div>
        </div>
      )}

      {/* STEP: GENERATING */}
      {step === STEPS.GENERATING && (
        <div style={{ textAlign: 'center', padding: '4rem 0', animation: 'fadeUp 0.4s ease' }}>
          <Spinner />
          <div style={{ marginTop: 20, fontFamily: s.display, fontSize: '1.2rem', fontWeight: 700, color: '#4a5568' }}>Generating responses...</div>
          <div style={{ marginTop: 8, fontFamily: s.mono, fontSize: 11, color: '#2d3748' }}>identities will be hidden</div>
        </div>
      )}

      {/* STEP: VOTE */}
      {step === STEPS.VOTE && (
        <div style={{ animation: 'fadeUp 0.4s ease' }}>
          <div style={{ background: 'rgba(99,179,237,0.04)', border: '1px solid rgba(99,179,237,0.1)', borderRadius: 10, padding: '12px 16px', marginBottom: '2rem', textAlign: 'center' }}>
            <span style={{ fontFamily: s.mono, fontSize: 12, color: '#718096' }}>prompt: </span>
            <span style={{ fontFamily: s.mono, fontSize: 12, color: '#e8f0fe' }}>{prompt}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(shuffled.length, 2)}, 1fr)`, gap: '1rem', marginBottom: '2rem' }}>
            {shuffled.map(({ letter, model }) => (
              <div key={letter} style={{ background: 'var(--surface)', border: `1px solid ${votes[letter] !== undefined ? 'rgba(99,179,237,0.3)' : 'rgba(99,179,237,0.08)'}`, borderRadius: 12, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: s.display, fontSize: 28, fontWeight: 800, color: '#63b3ed', lineHeight: 1 }}>Model {letter}</div>
                  {votes[letter] !== undefined && (
                    <div style={{ background: 'rgba(99,179,237,0.1)', border: '1px solid rgba(99,179,237,0.3)', borderRadius: 6, padding: '4px 10px', fontFamily: s.display, fontSize: 14, fontWeight: 700, color: '#63b3ed' }}>
                      {votes[letter]}/5
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.75, color: '#cbd5e0', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'rgba(99,179,237,0.02)', borderRadius: 6, padding: '10px 12px', border: '1px solid rgba(99,179,237,0.06)', minHeight: 100 }}>
                  {responses[model]}
                </div>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4a5568', marginBottom: 8, fontFamily: s.mono }}>your rating</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1,2,3,4,5].map(score => (
                      <button key={score} onClick={() => setVotes(v => ({ ...v, [letter]: score }))} style={{ flex: 1, padding: '8px 0', borderRadius: 6, cursor: 'pointer', fontFamily: s.display, fontSize: 13, fontWeight: 700, border: `1px solid ${votes[letter] === score ? 'rgba(99,179,237,0.6)' : 'rgba(99,179,237,0.1)'}`, background: votes[letter] === score ? 'rgba(49,130,206,0.2)' : 'transparent', color: votes[letter] === score ? '#90cdf4' : '#4a5568', transition: 'all 0.15s' }}>
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button onClick={handleReveal} disabled={!allVoted} style={{ background: allVoted ? 'linear-gradient(135deg, #2b6cb0, #3182ce)' : 'var(--surface)', border: allVoted ? 'none' : '1px solid rgba(99,179,237,0.1)', color: allVoted ? '#fff' : '#4a5568', fontFamily: s.display, fontSize: 13, fontWeight: 700, padding: '12px 36px', borderRadius: 8, cursor: allVoted ? 'pointer' : 'not-allowed', boxShadow: allVoted ? '0 0 20px rgba(49,130,206,0.4)' : 'none', transition: 'all 0.2s' }}>
              {allVoted ? '🎭 reveal identities' : `rate all responses to reveal (${Object.keys(votes).length}/${shuffled.length})`}
            </button>
          </div>
        </div>
      )}

      {/* STEP: REVEAL */}
      {step === STEPS.REVEAL && (
        <div style={{ animation: 'fadeUp 0.4s ease' }}>
          {/* Identity Reveal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4a5568', fontFamily: s.mono }}>revealed identities</div>
            <div style={{ flex: 1, height: 1, background: 'rgba(99,179,237,0.06)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(shuffled.length, 2)}, 1fr)`, gap: '1rem', marginBottom: '2.5rem' }}>
            {shuffled.map(({ letter, model }) => {
              const modelInfo = getModelInfo(model);
              const humanScore = votes[letter];
              const aiScores = selectedModels.filter(r => r !== model).map(r => parseRating(ratings[r]?.[model])).filter(s => s !== null);
              const aiAvg = aiScores.length ? (aiScores.reduce((a, b) => a + b, 0) / aiScores.length).toFixed(1) : '—';
              return (
                <div key={letter} style={{ background: 'var(--surface)', border: '1px solid rgba(99,179,237,0.2)', borderRadius: 12, padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #63b3ed, transparent)', backgroundSize: '200% auto', animation: 'shimmer 2s linear infinite' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontFamily: s.mono, fontSize: 10, color: '#4a5568', marginBottom: 4 }}>Model {letter} was</div>
                      <div style={{ fontFamily: s.display, fontSize: 18, fontWeight: 800, color: '#90cdf4', letterSpacing: '-0.02em' }}>{modelInfo?.label}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ textAlign: 'center', background: 'rgba(104,211,145,0.08)', border: '1px solid rgba(104,211,145,0.2)', borderRadius: 8, padding: '6px 12px' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#68d391', fontFamily: s.display }}>{humanScore}/5</div>
                        <div style={{ fontSize: 9, color: '#4a5568', fontFamily: s.mono }}>your vote</div>
                      </div>
                      <div style={{ textAlign: 'center', background: 'rgba(99,179,237,0.06)', border: '1px solid rgba(99,179,237,0.15)', borderRadius: 8, padding: '6px 12px' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#63b3ed', fontFamily: s.display }}>{aiAvg}</div>
                        <div style={{ fontSize: 9, color: '#4a5568', fontFamily: s.mono }}>AI avg /10</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.7, color: '#718096', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'rgba(99,179,237,0.02)', borderRadius: 6, padding: '10px 12px', border: '1px solid rgba(99,179,237,0.06)' }}>
                    {responses[model]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Human vs AI comparison */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4a5568', fontFamily: s.mono }}>human vs AI verdict</div>
            <div style={{ flex: 1, height: 1, background: 'rgba(99,179,237,0.06)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            {/* Human ranking */}
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(104,211,145,0.2)', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#68d391', marginBottom: 12, fontFamily: s.mono }}>👤 your ranking</div>
              {humanRanked.map(({ letter, model }, i) => {
                const modelInfo = getModelInfo(model);
                return (
                  <div key={letter} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontFamily: s.display, fontSize: 16, fontWeight: 800, color: i === 0 ? '#68d391' : '#4a5568', width: 24 }}>#{i+1}</span>
                    <span style={{ fontFamily: s.mono, fontSize: 12, color: '#cbd5e0', flex: 1 }}>{modelInfo?.short}</span>
                    <span style={{ fontFamily: s.display, fontSize: 13, fontWeight: 700, color: '#68d391' }}>{votes[letter]}/5</span>
                  </div>
                );
              })}
            </div>
            {/* AI ranking */}
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(99,179,237,0.2)', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#63b3ed', marginBottom: 12, fontFamily: s.mono }}>🤖 AI ranking</div>
              {aiRanked.map(({ model, avg }, i) => {
                const modelInfo = getModelInfo(model);
                return (
                  <div key={model} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontFamily: s.display, fontSize: 16, fontWeight: 800, color: i === 0 ? '#63b3ed' : '#4a5568', width: 24 }}>#{i+1}</span>
                    <span style={{ fontFamily: s.mono, fontSize: 12, color: '#cbd5e0', flex: 1 }}>{modelInfo?.short}</span>
                    <span style={{ fontFamily: s.display, fontSize: 13, fontWeight: 700, color: '#63b3ed' }}>{avg.toFixed(1)}/10</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agreement check */}
          {(() => {
            const humanWinner = humanRanked[0]?.model;
            const aiWinner = aiRanked[0]?.model;
            const agree = humanWinner === aiWinner;
            return (
              <div style={{ background: agree ? 'rgba(104,211,145,0.06)' : 'rgba(252,129,129,0.06)', border: `1px solid ${agree ? 'rgba(104,211,145,0.25)' : 'rgba(252,129,129,0.25)'}`, borderRadius: 10, padding: '1rem 1.5rem', textAlign: 'center', marginBottom: '2rem' }}>
                <span style={{ fontFamily: s.display, fontSize: 15, fontWeight: 700, color: agree ? '#68d391' : '#fc8181' }}>
                  {agree ? '✓ You agree with the AI!' : '✗ You disagree with the AI!'}
                </span>
                <span style={{ fontFamily: s.mono, fontSize: 12, color: '#718096', marginLeft: 12 }}>
                  {agree ? `Both picked ${getModelInfo(humanWinner)?.short}` : `You picked ${getModelInfo(humanWinner)?.short}, AI picked ${getModelInfo(aiWinner)?.short}`}
                </span>
              </div>
            );
          })()}

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button onClick={handleReset} style={{ background: 'transparent', border: '1px solid rgba(99,179,237,0.25)', color: '#63b3ed', fontFamily: s.display, fontSize: 13, fontWeight: 700, padding: '10px 28px', borderRadius: 8, cursor: 'pointer' }}>
              ↩ new blind battle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blind;