/**
 * Inline brand wordmark (same geometry as public/brand/icons/logo-wordmark.svg).
 * The shipped SVG hardcodes dark ink for the title, which vanishes on Dark and
 * Night surfaces; inlining lets the title follow the theme ink via
 * currentColor while star and "/HUB" keep their brand fills.
 */
export default function BrandWordmark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 420 80"
      fill="none"
      role="img"
      aria-label="Captain Corgi Hub"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(8 16)">
        <path
          d="M24 4 L29.7 16.9 L43.8 18.3 L33.2 28.0 L36.4 41.9 L24 34.6 L11.6 41.9 L14.8 28.0 L4.2 18.3 L18.3 16.9 Z"
          fill="#FBC00A"
          stroke="#D9A209"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>
      <text
        x="70"
        y="52"
        fontSize="36"
        fontWeight="800"
        fill="currentColor"
        letterSpacing="-0.5"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Captain Corgi
      </text>
      <text x="70" y="73" fontSize="14" fontWeight="700" fill="#E13429" letterSpacing="2">
        / HUB
      </text>
    </svg>
  );
}
