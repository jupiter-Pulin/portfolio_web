export const TOAST_MS = 1900;

/** Mock behaviour: confirm the copy, or fall back to showing the address itself.
    The address is passed in so this module stays importable from plain Node tests. */
export const copyToastMessage = (copied: boolean, email: string): string =>
  copied ? `Copied ${email}` : email;
