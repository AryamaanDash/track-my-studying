import ThemeSelector from "@/components/ThemeSelector";
import { ArrowRight, BookOpen, PenLine, Sprout } from "lucide-react";
import Link from "next/link";

export default function JournalCover() {
  return (
    <div className="public-journal-home">
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

            <p className="cover-privacy">Private by design · Yours to build one entry at a time</p>
          </div>
        </article>
      </main>

      <footer className="cover-footer">
        <span>Track My Studying</span>
        <span>Made for focused, consistent work.</span>
      </footer>
    </div>
  );
}
