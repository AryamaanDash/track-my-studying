import ThemeSelector from "@/components/ThemeSelector";
import { ArrowLeft, BookOpen, Sprout } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="journal-not-found">
      <header className="cover-topbar not-found-topbar">
        <Link className="cover-topbar-brand" href="/" aria-label="Track My Studying home">
          <Sprout aria-hidden="true" />
          <span>Track My Studying</span>
        </Link>

        <nav aria-label="Not found navigation" className="cover-topbar-nav">
          <Link href="/" className="cover-topbar-link">
            Journal cover
          </Link>
          <span className="cover-theme-control">
            <ThemeSelector />
          </span>
        </nav>
      </header>

      <main className="not-found-stage">
        <article className="journal-back-cover" aria-labelledby="not-found-title">
          <span className="back-cover-spine" aria-hidden="true" />
          <span className="back-cover-bookmark" aria-hidden="true" />

          <div className="back-cover-frame">
            <div className="back-cover-message">
              <p className="back-cover-kicker">
                <span>404</span>
                Misplaced page
              </p>

              <span className="back-cover-emblem" aria-hidden="true">
                <BookOpen />
              </span>

              <h1 id="not-found-title">This page was never written.</h1>
              <p className="back-cover-description">
                You have reached the back cover. The page you were looking for is not in
                this journal, but your work is still right where you left it.
              </p>

              <Link href="/" className="back-cover-return">
                <ArrowLeft aria-hidden="true" />
                <span>
                  <strong>Return to your journal</strong>
                  <small>Pick up where you left off</small>
                </span>
              </Link>
            </div>

            <footer className="back-cover-colophon">
              <span className="back-cover-imprint">
                <Sprout aria-hidden="true" />
                Track My Studying
              </span>
              <span>Notes become progress</span>
            </footer>
          </div>
        </article>
      </main>
    </div>
  );
}
