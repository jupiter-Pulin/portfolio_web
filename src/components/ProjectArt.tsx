import type { ReactElement } from "react";

// Placeholder diagrams, ported verbatim from the `art` object in design/mock/index.html.
// They stand in until a real cover lands in public/projects/<id>/ — see CONTENT.md.
const ART: Record<string, ReactElement> = {
  loop: (
    <svg viewBox="0 0 400 300" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M110 92L200 60L290 92L290 200L200 236L110 200Z" stroke="var(--line-strong)" strokeWidth="2"/>
      <g stroke="var(--cyan)" strokeWidth="2.5" fill="var(--surface-2)">
        <circle cx="200" cy="60" r="15"/><circle cx="290" cy="92" r="15"/><circle cx="290" cy="200" r="15"/><circle cx="110" cy="200" r="15"/>
      </g>
      <g stroke="var(--amber)" strokeWidth="2.5" fill="rgba(245,196,81,.15)">
        <path d="M110 74l18 18-18 18-18-18z"/><path d="M200 218l18 18-18 18-18-18z"/>
      </g>
      <g fontFamily="var(--font-mono)" fontSize="11" fill="var(--muted)" textAnchor="middle">
        <text x="200" y="40">implement</text><text x="326" y="96">verify</text><text x="326" y="204">review</text><text x="72" y="204">route</text>
      </g>
      <g fontFamily="var(--font-mono)" fontSize="11" fill="var(--amber)" textAnchor="middle">
        <text x="68" y="96">approve spec</text><text x="200" y="268">approve merge</text>
      </g>
      <text x="200" y="150" fontFamily="var(--font-mono)" fontSize="11.5" fill="var(--dim)" textAnchor="middle">router picks one of 8 actions</text>
      <text x="200" y="166" fontFamily="var(--font-mono)" fontSize="11.5" fill="var(--dim)" textAnchor="middle">kernel executes · humans decide twice</text>
    </svg>
  ),
  live: (
    <svg viewBox="0 0 400 300" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M40 200 q10-40 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="var(--dim)" strokeWidth="2"/>
      <path d="M40 200 q10-14 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="var(--dim)" strokeWidth="2" opacity=".5"/>
      <path d="M40 110 q10-30 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="var(--cyan)" strokeWidth="2.5"/>
      <path d="M200 110 q10-6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="var(--cyan)" strokeWidth="2.5" opacity=".45"/>
      <rect x="196" y="82" width="4" height="150" rx="2" fill="var(--amber)"/>
      <g fontFamily="var(--font-mono)" fontSize="11" fill="var(--muted)">
        <text x="40" y="70">translation · mixed on top, ducks the floor</text>
        <text x="40" y="250">original audio · opened at connect, never closed</text>
      </g>
      <text x="208" y="94" fontFamily="var(--font-mono)" fontSize="11" fill="var(--amber)">socket drops → still a meeting you can hear</text>
    </svg>
  ),
  chain: (
    <svg viewBox="0 0 400 300" fill="none" aria-hidden="true">
      <g fill="var(--green)">
        <rect x="52" y="150" width="14" height="80" rx="3"/><rect x="74" y="120" width="14" height="110" rx="3"/><rect x="96" y="160" width="14" height="70" rx="3"/>
        <rect x="118" y="105" width="14" height="125" rx="3"/><rect x="140" y="135" width="14" height="95" rx="3"/><rect x="162" y="128" width="14" height="102" rx="3"/>
        <rect x="206" y="112" width="14" height="118" rx="3"/><rect x="228" y="145" width="14" height="85" rx="3"/><rect x="250" y="98" width="14" height="132" rx="3"/>
        <rect x="272" y="140" width="14" height="90" rx="3"/><rect x="294" y="122" width="14" height="108" rx="3"/><rect x="316" y="152" width="14" height="78" rx="3"/><rect x="338" y="116" width="14" height="114" rx="3"/>
      </g>
      <rect x="184" y="212" width="14" height="18" rx="3" fill="var(--amber)"/>
      <path d="M52 232H352" stroke="var(--line-strong)" strokeWidth="1.5"/>
      <g fontFamily="var(--font-mono)" fontSize="11" fill="var(--muted)">
        <text x="52" y="72">one bar per night · Ethereum mainnet · raw JSON-RPC</text>
        <text x="52" y="258">STATUS.md committed every run, success or failure</text>
      </g>
      <text x="191" y="205" fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--amber)" textAnchor="middle">rpc failed · still committed</text>
    </svg>
  ),
  amm: (
    <svg viewBox="0 0 400 300" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M60 40V240H340" stroke="var(--line-strong)" strokeWidth="2"/>
      <path d="M78 46C82 160 150 226 332 232" stroke="var(--cyan)" strokeWidth="3"/>
      <circle cx="150" cy="176" r="6" fill="var(--amber)"/>
      <path d="M150 176V240M150 176H60" stroke="var(--amber)" strokeWidth="1.5" strokeDasharray="4 4"/>
      <circle cx="205" cy="208" r="6" fill="var(--surface-2)" stroke="var(--cyan)" strokeWidth="2"/>
      <path d="M156 178L200 206" stroke="var(--muted)" strokeWidth="1.5"/>
      <g fontFamily="var(--font-mono)" fontSize="11.5" fill="var(--muted)">
        <text x="250" y="90">x · y = k</text>
        <text x="250" y="110">pair re-derives amounts</text>
        <text x="250" y="126">from its own balances,</text>
        <text x="250" y="142">reverts on the invariant</text>
      </g>
      <text x="72" y="262" fontFamily="var(--font-mono)" fontSize="11" fill="var(--dim)">tokens arrive first · then swap() is called</text>
    </svg>
  ),
};

// A project added to the registry before its diagram exists still renders a frame.
const FALLBACK: ReactElement = (
  <svg viewBox="0 0 400 300" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="62" y="70" width="276" height="160" rx="14" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="6 6"/>
    <path d="M140 176l40-44 34 34 26-26 30 32" stroke="var(--dim)" strokeWidth="2"/>
    <circle cx="146" cy="116" r="9" stroke="var(--dim)" strokeWidth="2"/>
  </svg>
);

/** The stand-in diagram for a project, keyed by registry id. */
export function ProjectArt({ id }: { id: string }) {
  return ART[id] ?? FALLBACK;
}
