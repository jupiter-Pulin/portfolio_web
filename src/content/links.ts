// Contact and social links. Single source of truth — UI must import from here.
export const EMAIL = 'Pulin7490@gmail.com';
export const MAILTO =
  `mailto:${EMAIL}?subject=${encodeURIComponent('Hi Nolan — [role] at [company]')}` +
  `&body=${encodeURIComponent('Hi Nolan,\n\nI saw your work on ... and would like to talk about ...\n\n')}`;
export const GITHUB = 'https://github.com/jupiter-Pulin';
export const LINKEDIN = 'https://www.linkedin.com/in/nolan-tang-52b559367/';
// No X link: the account (@will_pu7490) is suspended, so it was taken off the site on 2026-10-09.

export const SOCIALS = [
  { key: 'github', label: 'GitHub', href: GITHUB, title: 'GitHub · jupiter-Pulin' },
  { key: 'linkedin', label: 'LinkedIn', href: LINKEDIN, title: 'LinkedIn · Nolan Tang' },
] as const;
// The blog is a page of this site (src/app/blog), so this is a route, not an external address.
export const BLOG = { href: '/blog' } as const;
