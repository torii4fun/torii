import { buildCastleSVG } from '../../lib/castleSVG';
import type { CastleStyle } from '../../types';

interface Props { style: CastleStyle; emoji: string; width?: number }

export function CastleSVG({ style, emoji, width = 200 }: Props) {
  return (
    <div
      style={{ width }}
      dangerouslySetInnerHTML={{ __html: buildCastleSVG(style, emoji) }}
    />
  );
}
