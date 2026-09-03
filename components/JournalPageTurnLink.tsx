"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

const pageTurnDurationMs = 720;

type JournalPageTurnLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

export default function JournalPageTurnLink({
  href,
  className,
  children,
}: JournalPageTurnLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const journalRef = useRef<HTMLElement | null>(null);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isTurning, setIsTurning] = useState(false);

  useEffect(() => {
    router.prefetch(href);
  }, [href, router]);

  useEffect(() => {
    function resetPageTurn() {
      journalRef.current ??=
        linkRef.current?.closest<HTMLElement>(".study-journal") ?? null;
      journalRef.current?.classList.remove("journal-is-turning-forward");
      setIsTurning(false);
    }

    resetPageTurn();
    window.addEventListener("pageshow", resetPageTurn);

    return () => {
      if (navigationTimer.current) clearTimeout(navigationTimer.current);
      journalRef.current?.classList.remove("journal-is-turning-forward");
      window.removeEventListener("pageshow", resetPageTurn);
    };
  }, [pathname]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    if (isTurning) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(href);
      return;
    }

    const journal = event.currentTarget.closest<HTMLElement>(".study-journal");
    journalRef.current = journal;
    setIsTurning(true);
    journal?.classList.add("journal-is-turning-forward");

    navigationTimer.current = setTimeout(() => {
      router.push(href);
    }, pageTurnDurationMs);
  }

  return (
    <Link
      ref={linkRef}
      href={href}
      className={className}
      onClick={handleClick}
      aria-disabled={isTurning || undefined}
    >
      {children}
    </Link>
  );
}
