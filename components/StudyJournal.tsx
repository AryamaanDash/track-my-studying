import StudyCalendar from "@/components/StudyCalendar";
import StudyCharts from "@/components/StudyCharts";
import StudyEntryPanel from "@/components/StudyEntryPanel";
import JournalUtilities from "@/components/JournalUtilities";
import ResponsiveStudyNotebook from "@/components/ResponsiveStudyNotebook";
import WeeklyStudyCelebration from "@/components/WeeklyStudyCelebration";
import type {
  StudyCalendarData,
  StudyChartData,
} from "@/lib/study-session-data";
import { Sprout } from "lucide-react";
import Link from "next/link";

type PreviousJournalSession = {
  subject: string;
  hours: number;
  date: string;
  journal: string | null;
};

export default function StudyJournal({
  previousSession,
  initialChartData,
  initialCalendarData,
  todayLabel,
  todayDateKey,
  referenceDate,
  totalHours,
}: {
  previousSession?: PreviousJournalSession;
  initialChartData: StudyChartData;
  initialCalendarData: StudyCalendarData;
  todayLabel: string;
  todayDateKey: string;
  referenceDate: string;
  totalHours: number;
}) {
  return (
    <ResponsiveStudyNotebook>
      <section id="journal-entry-page" className="journal-page journal-page--left" aria-label="Study entry page">
        <header className="journal-brand">
          <Sprout aria-hidden="true" />
          <div>
            <Link href="/dashboard">Track My Studying</Link>
            <p>Personal Study Journal</p>
          </div>
        </header>

        <div className="journal-mobile-utilities">
          <JournalUtilities />
        </div>

        <WeeklyStudyCelebration sessions={initialChartData.points} />

        <StudyEntryPanel
          todayLabel={todayLabel}
          todayDateKey={todayDateKey}
          previousSession={previousSession}
        />
      </section>

      <div className="journal-page-turn-underlay" aria-hidden="true">
        <span>Study History</span>
        <i />
        <i />
        <i />
        <i />
      </div>

      <div className="journal-page-turn-sheet">
        <section id="journal-charts-page" className="journal-page journal-page--right" aria-label="Study analytics page">
          <header className="journal-right-header">
            <JournalUtilities />

            <div className="journal-total" aria-label={`${totalHours.toFixed(1)} total hours`}>
              <strong>{totalHours.toFixed(1)}</strong>
              <span>Total Hours</span>
            </div>
          </header>

          <StudyCharts
            key={`charts-${totalHours}`}
            initialData={initialChartData}
          />
          <StudyCalendar
            key={`calendar-${totalHours}`}
            initialData={initialCalendarData}
            fallbackDate={referenceDate}
          />

          <footer className="journal-colophon">
            <span>Notes become progress.</span>
            <Link href="/privacy">Privacy Policy</Link>
            <a href="https://aryamaan-dash.vercel.app/" target="_blank" rel="noreferrer">
              Made by Aryamaan Dash
            </a>
          </footer>
        </section>

        <div className="journal-page-turn-back" aria-hidden="true">
          <span>continued</span>
        </div>
      </div>
    </ResponsiveStudyNotebook>
  );
}
