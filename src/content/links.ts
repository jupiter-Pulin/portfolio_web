// Contact and social links. Single source of truth — UI must import from here.
export const EMAIL = 'Pulin7490@gmail.com';
export const MAILTO =
  `mailto:${EMAIL}?subject=${encodeURIComponent('Hi Nolan — [role] at [company]')}` +
  `&body=${encodeURIComponent('Hi Nolan,\n\nI saw your work on ... and would like to talk about ...\n\n')}`;
export const GITHUB = 'https://github.com/jupiter-Pulin';
export const LINKEDIN = 'https://www.linkedin.com/in/nolan-tang-52b559367/';
// The public profile. x.com/home was here until 2026-09-27: it is the signed-in home feed,
// so every visitor landed on their own timeline instead of this profile.
export const X = 'https://x.com/will_pu7490';

export const SOCIALS = [
  { key: 'github', label: 'GitHub', href: GITHUB, title: 'GitHub · jupiter-Pulin' },
  { key: 'linkedin', label: 'LinkedIn', href: LINKEDIN, title: 'LinkedIn · Nolan Tang' },
  { key: 'x', label: 'X', href: X, title: 'X · @will_pu7490' },
] as const;
// The blog is a page of this site (src/app/blog), so this is a route, not an external address.
export const BLOG = { href: '/blog' } as const;
