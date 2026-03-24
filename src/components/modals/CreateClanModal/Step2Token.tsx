import type { CreateClanState } from '../../../types';

interface Props {
  state:  CreateClanState;
  set:    (k: keyof CreateClanState, v: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step2Token({ state: cs, set, onNext, onPrev }: Props) {
  function handleImg(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      set('imageUrl',  ev.target?.result as string);
      set('imageType', file.type);
    };
    reader.readAsDataURL(file);
  }

  function validate() {
    if (!cs.tokenName.trim()) { alert('Enter a token name'); return; }
    if (!cs.ticker.trim())    { alert('Enter a ticker symbol'); return; }
    if (!cs.description.trim()) { alert('Enter a description'); return; }
    if (!cs.imageUrl)           { alert('Upload a token image'); return; }
    onNext();
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 18, alignItems: 'flex-start' }}>

        {/* Image upload */}
        <div>
          <div className="field" style={{ marginBottom: 6 }}>
            <label className="field-label">Token Image *</label>
          </div>
          <div
            className={`img-upload${cs.imageUrl ? ' has-img' : ''}`}
            onClick={() => document.getElementById('token-img-input')?.click()}
          >
            {cs.imageUrl ? (
              <img src={cs.imageUrl} alt="token" />
            ) : (
              <div className="img-upload-hint">
                <div style={{ fontSize: 28, marginBottom: 6 }}>⛩</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>
                  Upload image<br />
                  <span style={{ fontSize: 9 }}>PNG · JPG · GIF · max 5MB</span>
                </div>
              </div>
            )}
            <input
              type="file"
              id="token-img-input"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImg}
            />
          </div>
          <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 4, textAlign: 'center' }}>
            Square · 500×500px recommended
          </div>
        </div>

        {/* Fields */}
        <div>
          <div className="grid-2">
            <div className="field">
              <label className="field-label">Token Name *</label>
              <input
                className="field-input"
                placeholder="e.g. Sakura Warriors"
                maxLength={32}
                value={cs.tokenName}
                onChange={e => set('tokenName', e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">Ticker *</label>
              <input
                className="field-input"
                placeholder="e.g. SAKR"
                maxLength={10}
                style={{ textTransform: 'uppercase' }}
                value={cs.ticker}
                onChange={e => set('ticker', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              />
            </div>
          </div>
          <div className="field">
            <label className="field-label">Description *</label>
            <textarea
              className="field-textarea"
              rows={4}
              placeholder="Describe your clan token and its purpose…"
              maxLength={300}
              value={cs.description}
              onChange={e => set('description', e.target.value)}
            />
            <div className="field-hint">{cs.description.length}/300</div>
          </div>
        </div>
      </div>

      {/* Social links */}
      <div className="field">
        <label className="field-label">
          Social Links{' '}
          <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text3)' }}>
            (optional)
          </span>
        </label>
        <div className="social-input">
          <span className="social-prefix">𝕏 twitter.com/</span>
          <input
            placeholder="username"
            value={cs.twitter}
            onChange={e => set('twitter', e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <button className="btn" onClick={onPrev}>← Back</button>
        <button className="btn btn-dark" onClick={validate}>Next: Launch →</button>
      </div>
    </>
  );
}