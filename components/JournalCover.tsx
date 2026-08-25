"use client";

import ThemeSelector from "@/components/ThemeSelector";
import { ArrowRight, BookOpen, PenLine, Sprout } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type CoverView = "playing" | "settled" | "rewound";

const introDurationMs = 2400;
const interactionCooldownMs = 350;
const wheelThreshold = 14;
const touchThreshold = 42;

export default function JournalCover() {
  const [coverView, setCoverView] = useState<CoverView>("playing");

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reducedMotion = reducedMotionQuery.matches;
    let touchStartY: number | null = null;
    let lastInteractionAt = 0;

    const introTimer = window.setTimeout(
      () => setCoverView("settled"),
      reducedMotion ? 0 : introDurationMs
    );

    if (reducedMotion) {
      return () => window.clearTimeout(introTimer);
    }

    function moveCover(direction: "in" | "out") {
      const now = window.performance.now();

      if (now - lastInteractionAt < interactionCooldownMs) return;

      setCoverView((currentView) => {
        if (currentView === "playing") return currentView;

        const nextView = direction === "in" ? "rewound" : "settled";
        if (currentView === nextView) return currentView;

        lastInteractionAt = now;
        return nextView;
      });
    }

    function handleWheel(event: WheelEvent) {
      if (Math.abs(event.deltaY) < wheelThreshold) return;
      moveCover(event.deltaY < 0 ? "in" : "out");
    }

    function handleTouchStart(event: TouchEvent) {
      touchStartY = event.touches.length === 1 ? event.touches[0].clientY : null;
    }

    function handleTouchEnd(event: TouchEvent) {
      if (touchStartY === null || event.changedTouches.length === 0) return;

      const distance = event.changedTouches[0].clientY - touchStartY;
      touchStartY = null;

      if (Math.abs(distance) < touchThreshold) return;
      moveCover(distance > 0 ? "in" : "out");
    }

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.clearTimeout(introTimer);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <div className="public-journal-home" data-cover-view={coverView}>
      <header className="cover-topbar">
        <Link className="cover-topbar-brand" href="/" aria-label="Track My Studying home">
          <Sprout aria-hidden="true" />
          <span>Track My Studying</span>
        </Link>

        <nav aria-label="Primary navigation" className="cover-topbar-nav">
          <Link href="/login" className="cover-topbar-link">
            Log in
          </Link>
          <Link href="/register" className="cover-topbar-signup">
            Sign up
          </Link>
          <span className="cover-theme-control">
            <ThemeSelector />
          </span>
        </nav>
      </header>

      <main className="cover-stage">
        <article className="closed-journal-cover" aria-labelledby="cover-title">
          <span className="cover-spine" aria-hidden="true" />
          <span className="cover-bookmark" aria-hidden="true" />

          <div className="cover-inner-frame">
            <p className="cover-welcome" aria-hidden="true">
              <span>Welcome to your</span>
              personal study journal
            </p>

            <header className="cover-title-block">
              <span className="cover-emblem" aria-hidden="true">
                <Sprout />
              </span>
              <p>Personal Study Journal</p>
              <h1 id="cover-title">Track My Studying</h1>
              <span className="cover-title-rule" aria-hidden="true" />
              <p className="cover-subtitle">
                A quiet place to record the work, notice the patterns, and keep going.
              </p>
            </header>

            <div className="cover-inscription" aria-hidden="true">
              <span>Notes become progress</span>
            </div>

            <nav className="cover-access" aria-label="Journal access">
              <Link href="/login" className="cover-access-link cover-access-link--login">
                <BookOpen aria-hidden="true" />
                <span>
                  <strong>Log in</strong>
                  <small>Open your journal</small>
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link href="/register" className="cover-access-link cover-access-link--signup">
                <PenLine aria-hidden="true" />
                <span>
                  <strong>Sign up</strong>
                  <small>Begin a new journal</small>
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </nav>
          </div>
        </article>
      </main>
    </div>
  );
}
