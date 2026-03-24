import { useMemo } from 'react';
import type { CreateClanState } from '../../../types';
import { ToriiGate } from '../../ui/ToriiGate';
import { WALL_COLORS, FLAG_OPTS } from './constants';

interface Props {
  state: CreateClanState;
  set:   (k: keyof CreateClanState, v: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const CLAN_COLORS = [
  { c: '#e91e8c', l: 'Sakura' },
  { c: '#7c3aed', l: 'Violet' },
  { c: '#0ea5e9', l: 'Azure' },
  { c: '#10b981', l: 'Jade' },
  { c: '#f59e0b', l: 'Gold' },
  { c: '#ef4444', l: 'Crimson' },
  { c: '#1e293b', l: 'Obsidian' },
  { c: '#f97316', l: 'Ember' },
];

const EMOJI_OPTS = ['⛩️','🌸','🗡️','🐉','🦊','🌙','⚡','🔥','🌊','🏔️','🌺','🦅'];

export function Step1Castle({ state: cs, set, onNext, onPrev }: Props) {
  return (
    <>
      {/* Torii preview */}
      <div className="castle-preview" style={{
        background: 'linear-gradient(160deg, #fff5f7 0%, #fce4ec 100%)',
        minHeight: 180,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ width: 200, height: 160, margin: '0 auto' }}>
          <ToriiGate color={cs.color} emoji={cs.emoji} />
        </div>
      </div>

      <div className="castle-opts">
        {/* Clan color */}
        <div className="cog">
          <div className="cog-label">Clan Color</div>
          <div style={{ display: 'flex', gap: 6, padding: 10, flexWrap: 'wrap' }}>
            {CLAN_COLORS.map(w => (
              <div
                key={w.c}
                className={`wall-col${cs.color === w.c ? ' selected' : ''}`}
                style={{ background: w.c }}
                title={w.l}
                onClick={() => set('color', w.c)}
              />
            ))}
            {/* Custom color */}
            <input
              type="color"
              value={cs.color}
              onChange={e => set('color', e.target.value)}
              style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid var(--border)', cursor: 'pointer', padding: 0 }}
              title="Custom color"
            />
          </div>
        </div>

        {/* Clan emoji */}
        <div className="cog">
          <div className="cog-label">Clan Symbol</div>
          <div className="cog-items" style={{ flexWrap: 'wrap' }}>
            {EMOJI_OPTS.map(f => (
              <div
                key={f}
                className={`cog-item${cs.emoji === f ? ' selected' : ''}`}
                onClick={() => set('emoji', f)}
                style={{ fontSize: 18 }}
              >{f}</div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <button className="btn" onClick={onPrev}>← Back</button>
        <button className="btn btn-dark" onClick={onNext}>Next: Token →</button>
      </div>
    </>
  );
}