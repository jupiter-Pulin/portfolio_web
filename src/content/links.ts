// Contact and social links. Single source of truth — UI must import from here.
export const EMAIL = 'Pulin7490@gmail.com';
export const MAILTO =
  `mailto:${EMAIL}?subject=${encodeURIComponent('Hi Nolan — [role] at [company]')}` +
  `&body=${encodeURIComponent('Hi Nolan,\n\nI saw your work on ... and would like to talk about ...\n\n')}`;
export const GITHUB = 'https://github.com/jupiter-Pulin';
export const LINKEDIN = 'https://www.linkedin.com/in/pulin-tang-52b559367/';
// Provided by Pulin on 2026-09-13, used as-is. Note: x.com/home is the signed-in home feed,
// not a public profile URL — replace with https://x.com/<handle> once the handle is confirmed.
export const X = 'https://x.com/home';

export const SOCIALS = [
  { key: 'github', label: 'GitHub', href: GITHUB, title: 'GitHub · jupiter-Pulin' },
  { key: 'linkedin', label: 'LinkedIn', href: LINKEDIN, title: 'LinkedIn · Nolan Tang' },
  { key: 'x', label: 'X', href: X, title: 'X' },
] as const;
// The blog is a page of this site (src/app/blog), so this is a route, not an external address.
export const BLOG = { href: '/blog' } as const;
