import { auth, signOut } from "../auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "../lib/prisma";
import { addStudySession } from "./actions";
import StudyCalendar from "../components/StudyCalendar";
import StudyCharts from "../components/StudyCharts";
import StudySessionDateTimeInput from "../components/StudySessionDateTimeInput";
import ThemeSelector from "../components/ThemeSelector";
import { Activity, LogOut, Trash2 } from "lucide-react";

export default async function Home() {
  await connection();

  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      email: true,
      studySessions: {
        select: {
          id: true,
          subject: true,
          hours: true,
          date: true,
        },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!user) redirect("/login");

  const totalHours = user.studySessions.reduce(
    (sum, studySession) => sum + studySession.hours,
    0
  );
  const chartSessions = user.studySessions.map((studySession) => ({
    ...studySession,
    date: studySession.date.toISOString(),
  }));
  const calendarFallbackDate = new Date().toISOString();

  return (
    <div className="min-h-screen bg-background p-6 font-sans text-foreground md:p-10">
      <header className="mx-auto mb-10 flex max-w-7xl flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight">TrackMy<span className="text-accent">Studying</span></h1>
        
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <Link
            href="/remove-hours"
            className="flex items-center gap-2 rounded-xl border border-border bg-surface-strong px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" />
            Remove Hours
          </Link>
          <ThemeSelector />
          <span className="text-sm text-muted">{session.user.email}</span>
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}>
             <button className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-danger">
               <LogOut className="w-4 h-4" /> Sign Out
             </button>
          </form>
        </div>
      </header>

      <main className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
        
        {/* Left Column: Input Form & Recent History */}
        <section className="xl:col-span-1 space-y-8">
          
          {/* Quick Add Widget */}
          <div className="rounded-3xl border border-border bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" /> Log Session
            </h2>
            <form action={addStudySession} className="space-y-4">
              <div>
                <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Subject</label>
                <input name="subject" type="text" placeholder="e.g., ICS 45C" required className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Hours</label>
                <input name="hours" type="number" step="0.1" placeholder="2.5" required className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="text-xs text-muted uppercase tracking-wider mb-2 block">When?</label>
                <StudySessionDateTimeInput />
              </div>
              <button type="submit" className="w-full rounded-xl bg-accent py-3 font-bold text-accent-foreground shadow-lg transition-colors hover:bg-accent-hover">
                Commit Hours
              </button>
            </form>
          </div>

          {/* KPI Widget */}
          <div className="flex flex-col justify-center rounded-3xl border border-border bg-surface p-6 text-center">
            <span className="text-muted text-sm mb-1 uppercase tracking-wider">Total Time Spent Studying</span>
            <span className="text-5xl font-bold text-accent">{totalHours.toFixed(1)} <span className="text-2xl text-muted">hrs</span></span>
          </div>
        </section>

        {/* Right Column: Interactive Charts */}
        <section className="xl:col-span-2">
          {user.studySessions.length > 0 ? (
            <StudyCharts sessions={chartSessions} />
          ) : (
             <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-3xl border border-border bg-surface p-6 text-muted">
                <Activity className="w-12 h-12 mb-4 opacity-20" />
                <p>Log your first session to generate your data pipeline.</p>
             </div>
          )}
        </section>

      </main>

      <StudyCalendar sessions={chartSessions} fallbackDate={calendarFallbackDate} />
    </div>
  );
}
