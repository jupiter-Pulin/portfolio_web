"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** A header link that knows when its section is the current one. */
export function NavLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const current = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link className={className} href={href} aria-current={current ? "page" : undefined}>
      {children}
    </Link>
  );
}
