"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState, type ReactNode } from "react";

export default function ResponsiveStudyNotebook({
  children,
  deskClassName = "",
  journalClassName = "",
  leftLabel = "Entry",
  rightLabel = "Charts",
  leftPageId = "journal-entry-page",
  rightPageId = "journal-charts-page",
}: {
  children: ReactNode;
  deskClassName?: string;
  journalClassName?: string;
  leftLabel?: string;
  rightLabel?: string;
  leftPageId?: string;
  rightPageId?: string;
}) {
  const [page, setPage] = useState<"entry" | "charts">("entry");

  function selectPage(nextPage: "entry" | "charts") {
    if (nextPage === page) return;
    setPage(nextPage);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" }));
  }

  return (
    <div className={`journal-desk journal-desk--switchable ${deskClassName}`}>
      {/* Keep both pages mounted so drafts and chart selections survive a turn. */}
      <main className={`study-journal ${journalClassName}`} data-mobile-page={page}>
        {children}
      </main>
      <nav className="journal-mobile-pagination" aria-label="Notebook pages">
        <button
          type="button"
          aria-controls={leftPageId}
          aria-pressed={page === "entry"}
          onClick={() => selectPage("entry")}
        >
          <ArrowLeft aria-hidden="true" />
          {leftLabel}
        </button>
        <span aria-live="polite" aria-atomic="true">
          {page === "entry" ? "1 / 2" : "2 / 2"}
        </span>
        <button
          type="button"
          aria-controls={rightPageId}
          aria-pressed={page === "charts"}
          onClick={() => selectPage("charts")}
        >
          {rightLabel}
          <ArrowRight aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
