"use client";

import { useState, useTransition, type ReactNode } from "react";
import { addStudySession } from "@/app/actions";
import DotBorderButton from "@/components/ui/dot-border-button";

export default function StudyEntryForm({ children }: { children: ReactNode }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="journal-entry-form"
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        const form = event.currentTarget;
        const data = new FormData(form);
        setError("");
        startTransition(async () => {
          try {
            const result = await addStudySession(data);
            if (result.error) {
              setError(result.error);
              return;
            }
            // Production RSC transitions can remain pending after the server
            // commits a save. Reload only on success to show persisted data;
            // rejected/failed saves above retain the user's draft.
            window.location.reload();
          } catch {
            setError("Unable to save your entry. Your notes are still here; please try again.");
          }
        });
      }}
    >
      {children}
      {error && <p className="journal-confirmation-error" role="alert">{error}</p>}
      <DotBorderButton
        type="submit"
        className="journal-save-button"
        wrapperClassName="journal-save-button-wrap"
        disabled={pending}
      >
        {pending ? "Saving entry…" : "Save Entry"}
      </DotBorderButton>
      <p className="journal-form-note">
        Your saved sessions will appear in your journal and analytics.
      </p>
    </form>
  );
}
