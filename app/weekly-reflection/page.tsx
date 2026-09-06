import ResponsiveStudyNotebook from "@/components/ResponsiveStudyNotebook";
import MobileNotebookUtilities from "@/components/MobileNotebookUtilities";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, ArrowRight, BookOpenText, Sprout } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reflectionWeek, reflectionWeekLabel } from "@/lib/weekly-reflection";
import WeeklyReflectionForm from "@/components/WeeklyReflectionForm";
import ThemeSelector from "@/components/ThemeSelector";

export const metadata: Metadata = { title: "Weekly Reflection" };

export default async function WeeklyReflectionPage({ searchParams }: {
  searchParams: Promise<{ week?: string | string[]; before?: string | string[] }>;
}) {
  await connection();
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const params = await searchParams;
  const requestedWeek = Array.isArray(params.week) ? params.week[0] : params.week;
  const currentWeek = reflectionWeek(new Date().toISOString().slice(0, 10));
  let week = currentWeek;
  try {
    if (requestedWeek) week = reflectionWeek(requestedWeek);
  } catch {
    redirect("/weekly-reflection");
  }
  const requestedBefore = Array.isArray(params.before) ? params.before[0] : params.before;
  let before: string | undefined;
  try {
    if (requestedBefore) before = reflectionWeek(requestedBefore);
  } catch {
    redirect(`/weekly-reflection?week=${week}`);
  }
  const weekStart = new Date(`${week}T00:00:00.000Z`);
  const [reflection, historyRows, previous, next] = await Promise.all([
    prisma.weeklyReflection.findUnique({ where: { userId_weekStart: { userId, weekStart } } }),
    prisma.weeklyReflection.findMany({
      where: { userId, ...(before ? { weekStart: { lt: new Date(`${before}T00:00:00.000Z`) } } : {}) },
      orderBy: { weekStart: "desc" }, take: 13,
      select: { weekStart: true, worked: true, difficult: true, priorities: true },
    }),
    prisma.weeklyReflection.findFirst({ where: { userId, weekStart: { lt: weekStart } }, orderBy: { weekStart: "desc" }, select: { weekStart: true } }),
    prisma.weeklyReflection.findFirst({ where: { userId, weekStart: { gt: weekStart } }, orderBy: { weekStart: "asc" }, select: { weekStart: true } }),
  ]);
  const history = historyRows.slice(0, 12);
  const hasOlder = historyRows.length > 12;
  const reflectionHref = (date: Date) => `/weekly-reflection?week=${date.toISOString().slice(0, 10)}${before ? `&before=${before}` : ""}`;

  return (
    <ResponsiveStudyNotebook
      deskClassName="reflection-desk"
      journalClassName="reflection-journal"
      leftLabel="Weeks"
      rightLabel="Reflection"
      leftPageId="reflection-left-page"
      rightPageId="reflection-right-page"
    >
        <section id="reflection-left-page" className="journal-page journal-page--left reflection-context" aria-labelledby="reflection-title">
          <header className="journal-brand">
            <Sprout aria-hidden="true" />
            <div><Link href="/dashboard">Track My Studying</Link><p>Personal Study Journal</p></div>
          </header>
          <MobileNotebookUtilities />
          <div className="reflection-intro">
            <p className="remove-hours-eyebrow">Pause. Notice. Begin again.</p>
            <div className="remove-hours-title-row"><h1 id="reflection-title">Weekly Reflection</h1><BookOpenText aria-hidden="true" /></div>
            <p className="remove-hours-description">Make sense of your week in three entries. Keep what helped, give the hard parts some space, and choose where to go next.</p>
          </div>
          <form action="/weekly-reflection" className="reflection-week-picker">
            <label htmlFor="reflection-week">Choose a date in the week</label>
            <div><input className="journal-input" type="date" id="reflection-week" name="week" defaultValue={week} key={week} required /><button type="submit" className="journal-edit-save">Open week</button></div>
            <p>Weeks run Monday through Sunday.</p>
          </form>
          <nav className="reflection-history" aria-label="Saved reflections">
            <h2>Previous reflections</h2>
            {history.length ? <ul>{history.map((item) => {
              const key = item.weekStart.toISOString().slice(0, 10);
              const preview = item.worked || item.difficult || item.priorities;
              return <li key={key}><Link href={reflectionHref(item.weekStart)} aria-current={key === week ? "page" : undefined}><span>{reflectionWeekLabel(key)}</span><span className="reflection-history-preview">{preview.length > 100 ? `${preview.slice(0, 100)}…` : preview}</span><span className="reflection-history-open">{key === week ? "Currently open" : "Open reflection"}</span></Link></li>;
            })}</ul> : <p>{before ? "No earlier reflections have been saved." : "Your saved reflections will appear here. A few honest lines are a good start."}</p>}
            <div className="reflection-archive-navigation">
              {before && <Link href={`/weekly-reflection?week=${week}`}>Latest reflections</Link>}
              {hasOlder && <Link href={`/weekly-reflection?week=${week}&before=${history[history.length - 1].weekStart.toISOString().slice(0, 10)}`}>Older reflections <ArrowRight aria-hidden="true" /></Link>}
            </div>
          </nav>
          <div className="reflection-context-bottom"><Link href="/weekly-reflection" className="journal-utility">This week</Link><span className="journal-desktop-utilities"><ThemeSelector /></span></div>
        </section>
        <section id="reflection-right-page" className="journal-page journal-page--right reflection-writing" aria-labelledby="reflection-week-title">
          <MobileNotebookUtilities />
          <Link href="/dashboard" className="journal-utility study-history-dashboard-link journal-desktop-utilities"><ArrowLeft aria-hidden="true" />Back to dashboard</Link>
          <header className="reflection-writing-header"><p className="remove-hours-eyebrow">A week in your words</p><h2 id="reflection-week-title">{reflectionWeekLabel(week)}</h2></header>
          {(previous || next) && <nav className="reflection-saved-navigation" aria-label="Browse saved reflections">
            {previous ? <Link href={reflectionHref(previous.weekStart)}><ArrowLeft aria-hidden="true" />Previous reflection</Link> : <span />}
            {next && <Link href={reflectionHref(next.weekStart)}>Next reflection<ArrowRight aria-hidden="true" /></Link>}
          </nav>}
          <WeeklyReflectionForm key={week} week={week} saved={!!reflection} initialEntries={{ worked: reflection?.worked ?? "", difficult: reflection?.difficult ?? "", priorities: reflection?.priorities ?? "" }} />
          <footer className="journal-colophon"><span>Notes become progress.</span><Link href="/privacy">Privacy Policy</Link><a href="https://aryamaan-dash.vercel.app/" target="_blank" rel="noreferrer">Made by Aryamaan Dash</a></footer>
        </section>
    </ResponsiveStudyNotebook>
  );
}
