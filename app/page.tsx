import { auth, signOut } from "../auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "../lib/prisma";
import { addStudySession } from "./actions";
import StudyCharts from "../components/StudyCharts";
import { Activity, LogOut } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-6 md:p-10 font-sans">
      <header className="flex justify-between items-center mb-10 border-b border-neutral-800 pb-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight">TrackMy<span className="text-emerald-500">Studying</span></h1>
        
        <div className="flex items-center gap-6">
          <span className="text-sm text-neutral-400">{session.user.email}</span>
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}>
             <button className="flex items-center gap-2 text-neutral-400 hover:text-red-400 transition-colors text-sm">
               <LogOut className="w-4 h-4" /> Sign Out
             </button>
          </form>
        </div>
      </header>

      <main className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
        
        {/* Left Column: Input Form & Recent History */}
        <section className="xl:col-span-1 space-y-8">
          
          {/* Quick Add Widget */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" /> Log Session
            </h2>
            <form action={addStudySession} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-400 uppercase tracking-wider mb-2 block">Subject</label>
                <input name="subject" type="text" placeholder="e.g., ICS 45C" required className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 uppercase tracking-wider mb-2 block">Hours</label>
                <input name="hours" type="number" step="0.1" placeholder="2.5" required className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 uppercase tracking-wider mb-2 block">When?</label>
                <input name="date" type="datetime-local" required className="w-full bg-neutral-950 border border-neutral-800 text-neutral-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                Commit Hours
              </button>
            </form>
          </div>

          {/* KPI Widget */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-center text-center">
            <span className="text-neutral-400 text-sm mb-1 uppercase tracking-wider">Total Time Engineered</span>
            <span className="text-5xl font-bold text-emerald-400">{totalHours.toFixed(1)} <span className="text-2xl text-neutral-500">hrs</span></span>
          </div>
        </section>

        {/* Right Column: Interactive Charts */}
        <section className="xl:col-span-2">
          {user.studySessions.length > 0 ? (
            <StudyCharts sessions={chartSessions} />
          ) : (
             <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 h-full flex flex-col items-center justify-center text-neutral-500 min-h-[400px]">
                <Activity className="w-12 h-12 mb-4 opacity-20" />
                <p>Log your first session to generate your data pipeline.</p>
             </div>
          )}
        </section>

      </main>
    </div>
  );
}
