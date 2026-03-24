import type { CreateClanState } from '../../../types';

interface Props {
  state: CreateClanState;
  set:   (k: keyof CreateClanState, v: any) => void;
  onNext: () => void;
}

export function Step0Identity({ state: cs, set, onNext }: Props) {
  return (
    <>
      <div className="field">
        <label className="field-label">Clan Name *</label>
        <input
          className="field-input"
          value={cs.name}
          maxLength={24}
          placeholder="e.g. Crimson Wolves"
          onChange={e => set('name', e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Motto</label>
        <input
          className="field-input"
          value={cs.motto ?? ''}
          maxLength={60}
          placeholder="Your clan's war cry"
          onChange={e => set('motto', e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Telegram Group</label>
        <div className="social-input">
          <span className="social-prefix">t.me/</span>
          <input
            placeholder="yourclangroup"
            value={cs.telegram}
            onChange={e => set('telegram', e.target.value)}
          />
        </div>
        <div className="field-hint">
          Only revealed to members who hold the required tokens
        </div>
      </div>

      <div className="field">
        <label className="field-label">Min tokens to join</label>
        <input
          className="field-input"
          type="number"
          min={1}
          value={cs.minTokens}
          onChange={e => set('minTokens', Math.max(1, parseInt(e.target.value) || 1))}
        />
        <div className="field-hint">Members must hold this many clan tokens to join</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-dark" onClick={() => {
          if (!cs.name.trim()) return alert('Enter a clan name');
          onNext();
        }}>Next: Style →</button>
      </div>
    </>
  );
}