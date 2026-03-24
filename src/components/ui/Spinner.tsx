export function Spinner({ size = 16 }: { size?: number }) {
  return <span className="spinner" style={{ fontSize: size }}>⟳</span>;
}
