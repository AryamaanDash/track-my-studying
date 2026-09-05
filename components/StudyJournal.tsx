import { signOut } from "@/auth";
import StudyCalendar from "@/components/StudyCalendar";
import StudyCharts from "@/components/StudyCharts";
import StudyEntryPanel from "@/components/StudyEntryPanel";
import JournalPageTurnLink from "@/components/JournalPageTurnLink";
import ThemeSelector from "@/components/ThemeSelector";
import WeeklyStudyCelebration from "@/components/WeeklyStudyCelebration";
import type {
  StudyCalendarData,
  StudyChartData,
} from "@/lib/study-session-data";
import { BookOpenText, FilePenLine, LogOut, Settings2, Sprout } from "lucide-react";
import Link from "next/link";

export type PreviousJournalSession = {
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
    <div className="journal-desk">
      <main className="study-journal">
        <section className="journal-page journal-page--left" aria-label="Study entry page">
          <header className="journal-brand">
            <Sprout aria-hidden="true" />
            <div>
              <Link href="/dashboard">Track My Studying</Link>
              <p>Personal Study Journal</p>
            </div>
          </header>

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
          <section className="journal-page journal-page--right" aria-label="Study analytics page">
            <header className="journal-right-header">
              <nav className="journal-utilities" aria-label="Journal utilities">
                <ThemeSelector />
                <Link href="/weekly-reflection" className="journal-utility">
                  <BookOpenText aria-hidden="true" />
                  Weekly Reflection
                </Link>
                <JournalPageTurnLink href="/remove-hours" className="journal-utility">
                  <FilePenLine aria-hidden="true" />
                  Edit Hours
                </JournalPageTurnLink>
                <Link href="/settings" className="journal-utility">
                  <Settings2 aria-hidden="true" />
                  Settings
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button type="submit" className="journal-utility">
                    <LogOut aria-hidden="true" />
                    Sign Out
                  </button>
                </form>
              </nav>

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
      </main>
    </div>
  );
}
