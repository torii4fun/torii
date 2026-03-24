import { useMemo } from 'react';

export function StarField({ count = 20 }: { count?: number }) {
  const stars = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top:  Math.random() * 80,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 2,
      dur:   1.5 + Math.random() * 2,
    })),
  [count]);

  return (
    <>
      {stars.map(s => (
        <div
          key={s.id}
          className="star-particle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </>
  );
}
