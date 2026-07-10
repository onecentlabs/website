type Props = { size?: number; className?: string };

/**
 * OneCent Labs mark — minimalist pixel cent symbol (¢).
 * 8x8 grid. Single color via currentColor. No fills, no highlights.
 */
export function Logo({ size = 24, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      {/* vertical stem (the slash through the C) */}
      <rect x="3" y="0" width="1" height="8" />
      {/* top of C */}
      <rect x="2" y="1" width="3" height="1" />
      {/* left side of C */}
      <rect x="1" y="2" width="1" height="4" />
      {/* bottom of C */}
      <rect x="2" y="6" width="3" height="1" />
      {/* right tips */}
      <rect x="5" y="2" width="1" height="1" />
      <rect x="5" y="5" width="1" height="1" />
    </svg>
  );
}
