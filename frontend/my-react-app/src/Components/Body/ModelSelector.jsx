import React from 'react'
import { AVAILABLE_MODELS } from '../../constants/models';

const s = { mono: 'JetBrains Mono, monospace' };

const ModelSelector = ({ selectedModels, onToggle, minSelect = 1 }) => {
  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4a5568', marginBottom: 10, fontFamily: s.mono }}>
        select models {minSelect > 1 ? `(min ${minSelect})` : ''}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {AVAILABLE_MODELS.map(m => {
          const selected = selectedModels.includes(m.id);
          return (
            <button key={m.id} onClick={() => onToggle(m.id)} style={{
              padding: '7px 14px', borderRadius: 6, cursor: 'pointer',
              fontFamily: s.mono, fontSize: 11,
              background: selected ? 'rgba(49,130,206,0.15)' : '#0d1220',
              border: `1px solid ${selected ? 'rgba(99,179,237,0.5)' : 'rgba(99,179,237,0.08)'}`,
              color: selected ? '#90cdf4' : '#4a5568',
              boxShadow: selected ? '0 0 12px rgba(99,179,237,0.1)' : 'none',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>{selected ? '◉' : '○'}</span>
              <span>{m.short}</span>
              {m.tier === 'preview' && (
                <span style={{ fontSize: 8, background: 'rgba(246,173,85,0.1)', border: '1px solid rgba(246,173,85,0.2)', color: '#f6ad55', padding: '1px 5px', borderRadius: 3 }}>
                  preview
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModelSelector;