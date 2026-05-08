type Props = { size?: number; className?: string };

export function Logo({ size = 32, className }: Props) {
  const s = size;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      {/* Pixel coin: gold ring, 1¢ inset */}
      <rect x="0" y="0" width="16" height="16" fill="transparent" />
      <g>
        {/* Outer coin shape */}
        <rect x="4" y="1" width="8" height="1" fill="#ffd23f" />
        <rect x="2" y="2" width="2" height="1" fill="#ffd23f" />
        <rect x="12" y="2" width="2" height="1" fill="#ffd23f" />
        <rect x="1" y="3" width="1" height="2" fill="#ffd23f" />
        <rect x="14" y="3" width="1" height="2" fill="#ffd23f" />
        <rect x="0" y="5" width="1" height="6" fill="#ffd23f" />
        <rect x="15" y="5" width="1" height="6" fill="#ffd23f" />
        <rect x="1" y="11" width="1" height="2" fill="#ffd23f" />
        <rect x="14" y="11" width="1" height="2" fill="#ffd23f" />
        <rect x="2" y="13" width="2" height="1" fill="#ffd23f" />
        <rect x="12" y="13" width="2" height="1" fill="#ffd23f" />
        <rect x="4" y="14" width="8" height="1" fill="#ffd23f" />
        {/* Coin face */}
        <rect x="4" y="2" width="8" height="12" fill="#ffb703" />
        <rect x="2" y="3" width="2" height="10" fill="#ffb703" />
        <rect x="12" y="3" width="2" height="10" fill="#ffb703" />
        <rect x="1" y="5" width="1" height="6" fill="#ffb703" />
        <rect x="14" y="5" width="1" height="6" fill="#ffb703" />
        {/* Highlight */}
        <rect x="3" y="3" width="2" height="1" fill="#ffe27a" />
        <rect x="2" y="4" width="1" height="3" fill="#ffe27a" />
        {/* "1" glyph (cent) */}
        <rect x="7" y="4" width="2" height="1" fill="#5a3a00" />
        <rect x="8" y="5" width="1" height="6" fill="#5a3a00" />
        <rect x="7" y="11" width="3" height="1" fill="#5a3a00" />
      </g>
    </svg>
  );
}
