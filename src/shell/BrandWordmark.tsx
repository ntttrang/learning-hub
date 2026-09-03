/**
 * Inline brand wordmark so the title follows the theme ink via currentColor.
 */
export default function BrandWordmark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 260 58"
      fill="none"
      role="img"
      aria-label="Captain Corgi Learning Hub"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(8 7)">
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
        x="58"
        y="28"
        fontSize="22"
        fontWeight="800"
        fill="currentColor"
        letterSpacing="1.2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        LEARNING HUB
      </text>
      <text
        x="58"
        y="48"
        fontSize="11"
        fontWeight="700"
        fill="var(--fg-3)"
        letterSpacing="0.6"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        SMALL PAWS. BIG JOURNEYS.
      </text>
    </svg>
  );
}
