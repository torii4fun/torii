import { useApp } from '../../context/AppContext';

export function Footer() {
  const { state } = useApp();

  return (
    <footer className="site-footer">
      <div className="footer-inner">

        {/* Left — brand */}
        <div className="footer-brand">
          <img src="/logo.png" alt="Torii" className="footer-logo" />
          <span className="footer-name">Torii</span>
          <span className="footer-tagline">Trade · Clan · Conquer</span>
        </div>

        {/* Center — links */}
        <div className="footer-links">
          <a
            className="footer-social"
            href="https://x.com/torii4fun"
            target="_blank"
            rel="noreferrer"
            aria-label="X / Twitter"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.25 2.25h6.922l4.24 5.614 5.832-5.614Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"/>
            </svg>
            <span>Twitter</span>
          </a>

          <a
            className="footer-social"
            href="https://discord.gg/v47vPHte"
            target="_blank"
            rel="noreferrer"
            aria-label="Discord"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.175 13.175 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028ZM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38Zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38Z"/>
            </svg>
            <span>Discord</span>
          </a>
        </div>

        {/* Right — info */}
        <div className="footer-right">
          <span className="footer-chain">Solana Mainnet</span>
          <span className="footer-copy">© 2025 Torii</span>
        </div>

      </div>
    </footer>
  );
}