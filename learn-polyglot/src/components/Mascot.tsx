export function Mascot({ size = 220 }: { size?: number }) {
  return (
    <img
      src="/assets/captain-corgi-avatar.png"
      alt="Captain Corgi"
      width={size}
      height={size}
      style={{ borderRadius: 'var(--r-xl)' }}
    />
  );
}
