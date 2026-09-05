"use client";

import { useState, useTransition } from "react";
import { saveWeeklyReflection } from "@/app/weekly-reflection/actions";

const prompts = [
  { key: "worked", title: "What worked this week?", hint: "Celebrate the habits, small wins, and study strategies you want to keep.", placeholder: "This week, I made progress when…" },
  { key: "difficult", title: "What felt difficult?", hint: "Notice what got in the way, without judging yourself. What might help?", placeholder: "Something I struggled with was…" },
  { key: "priorities", title: "What are next week’s priorities?", hint: "Choose a few realistic priorities and a first step for each.", placeholder: "Next week, I want to focus on…" },
] as const;

type Entries = Record<(typeof prompts)[number]["key"], string>;

export default function WeeklyReflectionForm({ week, initialEntries, saved }: {
  week: string;
  initialEntries: Entries;
  saved: boolean;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState(saved ? "Your saved reflection. You can keep editing." : "");

  return (
    <form className="reflection-form" aria-busy={pending} onSubmit={(event) => {
      event.preventDefault();
      if (pending) return;
      const data = new FormData(event.currentTarget);
      setError("");
      setMessage("");
      startTransition(async () => {
        try {
          const result = await saveWeeklyReflection(data);
          if (result.error) setError(result.error);
          else setMessage("Reflection saved. A little perspective to carry forward.");
        } catch {
          setError("Unable to save right now. Your writing is still here; please try again.");
        }
      });
    }}>
      <input type="hidden" name="week" value={week} />
      {prompts.map((prompt, index) => (
        <div className="reflection-entry" key={prompt.key}>
          <label htmlFor={`reflection-${prompt.key}`}><span>0{index + 1}</span>{prompt.title}</label>
          <p id={`reflection-${prompt.key}-hint`}>{prompt.hint}</p>
          <textarea
            id={`reflection-${prompt.key}`}
            name={prompt.key}
            aria-describedby={`reflection-${prompt.key}-hint`}
            className="journal-textarea journal-hand"
            rows={4}
            maxLength={10000}
            placeholder={prompt.placeholder}
            value={entries[prompt.key]}
            disabled={pending}
            onChange={(event) => {
              setEntries({ ...entries, [prompt.key]: event.target.value });
              setMessage("");
            }}
          />
        </div>
      ))}
      <div className="reflection-save-row">
        <button type="submit" className="journal-edit-save" disabled={pending}>{pending ? "Saving…" : "Save reflection"}</button>
        <span>Save as you go. You can return to finish later.</span>
      </div>
      {error && <p className="journal-confirmation-error" role="alert">{error}</p>}
      <p className="reflection-save-status" role="status">{message}</p>
    </form>
  );
}
