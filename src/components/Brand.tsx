export function Logo({ dark = false, href = '/' }: { dark?: boolean; href?: string }) {
  return (
    <a className={`brand ${dark ? 'brand-dark' : ''}`} href={href} aria-label="Trafflow home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>Trafflow</span>
    </a>
  );
}
