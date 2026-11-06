export function Logo({ dark = false, href = '/' }: { dark?: boolean; href?: string }) {
  return (
    <a className={`brand ${dark ? 'brand-dark' : ''}`} href={href} aria-label="VROOO home">
      <img src={`${dark ? '/logo-dark.png' : '/logo.png'}`} alt="VROOO" width="100" />
    </a>
  );
}
