import { addStudySession } from "@/app/actions";
import DotBorderButton from "@/components/ui/dot-border-button";
import { getSubjectColor } from "@/lib/study-colors";
import StudySessionDateTimeInput from "@/components/StudySessionDateTimeInput";

type PreviousSession = {
  subject: string;
  hours: number;
  date: string;
  journal: string | null;
};

const previousDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export default function StudyEntryPanel({
  todayLabel,
  todayDateKey,
  previousSession,
}: {
  todayLabel: string;
  todayDateKey: string;
  previousSession?: PreviousSession;
}) {
  const previousDate = previousSession ? new Date(previousSession.date) : null;
  const previousDateLabel =
    previousDate && !Number.isNaN(previousDate.getTime())
      ? previousDateFormatter.format(previousDate)
      : null;

  return (
    <div className="journal-entry-content">
      <div className="journal-section-heading">
        <h2>Today&apos;s Study Entry</h2>
        <time className="journal-hand" dateTime={todayDateKey}>
          {todayLabel}
        </time>
      </div>

      <form action={addStudySession} className="journal-entry-form">
        <div className="journal-form-group journal-form-group--subject">
          <label htmlFor="study-subject">Subject</label>
          <input
            id="study-subject"
            name="subject"
            type="text"
            placeholder="e.g. ICS 45C"
            required
            maxLength={80}
            autoComplete="off"
            className="journal-input journal-hand"
          />
        </div>

        <div className="journal-form-group journal-form-group--hours">
          <label htmlFor="study-hours">Hours studied</label>
          <div className="journal-hours-field">
            <input
              id="study-hours"
              name="hours"
              type="number"
              min="0.1"
              max="24"
              step="0.1"
              inputMode="decimal"
              placeholder="2.5"
              required
              className="journal-input journal-hand"
            />
            <span aria-hidden="true">hrs</span>
          </div>
        </div>

        <div className="journal-form-group journal-form-group--date">
          <label htmlFor="study-date">Date &amp; time</label>
          <StudySessionDateTimeInput id="study-date" />
        </div>

        <div className="journal-form-group journal-form-group--journal">
          <label htmlFor="study-journal">Notes</label>
          <textarea
            id="study-journal"
            name="journal"
            rows={5}
            maxLength={10000}
            placeholder="Write anything—notes, thoughts, links..."
            className="journal-textarea journal-hand"
          />
        </div>

        <DotBorderButton
          type="submit"
          className="journal-save-button"
          wrapperClassName="journal-save-button-wrap"
          pendingLabel="Saving entry…"
        >
          Save Entry
        </DotBorderButton>
        <p className="journal-form-note">
          Your saved sessions will appear in your journal and analytics.
        </p>
      </form>

      <section className="previous-entry" aria-labelledby="previous-entry-heading">
        <h3 id="previous-entry-heading">Previous entry</h3>
        {previousSession ? (
          <div
            className="previous-entry-note"
            style={{ borderColor: getSubjectColor(previousSession.subject) }}
          >
            {previousDateLabel ? <time>{previousDateLabel}</time> : null}
            <p className="journal-hand">
              {previousSession.subject} <span aria-hidden="true">—</span>{" "}
              <span>{previousSession.hours.toFixed(1)} hrs</span>
            </p>
            {previousSession.journal ? (
              <p className="previous-entry-journal">{previousSession.journal}</p>
            ) : null}
          </div>
        ) : (
          <p className="previous-entry-empty">
            Your first saved study session will appear here.
          </p>
        )}
      </section>
    </div>
  );
}
