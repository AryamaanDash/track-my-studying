import ThemeSelector from "@/components/ThemeSelector";
import { ArrowLeft, Sprout } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type JournalAuthPageProps = {
  activePage: "login" | "register";
  title: string;
  description: string;
  annotation: string;
  children: ReactNode;
  alternatePrompt: string;
  alternateHref: string;
  alternateLabel: string;
};

export default function JournalAuthPage({
  activePage,
  title,
  description,
  annotation,
  children,
  alternatePrompt,
  alternateHref,
  alternateLabel,
}: JournalAuthPageProps) {
  return (
    <div className="journal-auth-shell">
      <header className="cover-topbar journal-auth-topbar">
        <Link className="cover-topbar-brand" href="/" aria-label="Track My Studying home">
          <Sprout aria-hidden="true" />
          <span>Track My Studying</span>
        </Link>

        <nav aria-label="Authentication navigation" className="cover-topbar-nav">
          <Link href="/" className="cover-topbar-link journal-auth-cover-link">
            <ArrowLeft aria-hidden="true" />
            Journal cover
          </Link>
          <Link
            href="/login"
            className={`cover-topbar-link${activePage === "login" ? " is-active" : ""}`}
            aria-current={activePage === "login" ? "page" : undefined}
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="cover-topbar-signup"
            aria-current={activePage === "register" ? "page" : undefined}
          >
            Sign up
          </Link>
          <span className="cover-theme-control">
            <ThemeSelector />
          </span>
        </nav>
      </header>

      <main className="journal-auth-stage">
        <article className="journal-auth-book" aria-labelledby="journal-auth-title">
          <span className="journal-auth-bookmark" aria-hidden="true" />

          <div className="journal-auth-page">
            <header className="journal-auth-page-header">
              <div className="journal-auth-imprint">
                <Sprout aria-hidden="true" />
                <span>Personal Study Journal</span>
              </div>
              <span className="journal-auth-annotation">{annotation}</span>
            </header>

            <div className="journal-auth-intro">
              <p>Track My Studying</p>
              <h1 id="journal-auth-title">{title}</h1>
              <p>{description}</p>
            </div>

            <div className="journal-auth-content">{children}</div>

            <footer className="journal-auth-page-footer">
              <p>
                {alternatePrompt}{" "}
                <Link href={alternateHref}>{alternateLabel}</Link>
              </p>
              <span>Private by design · One entry at a time</span>
            </footer>
          </div>
        </article>
      </main>
    </div>
  );
}
