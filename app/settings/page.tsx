import { auth, signOut } from "@/auth";
import DeleteAccountForm from "@/components/DeleteAccountForm";
import ThemeSelector from "@/components/ThemeSelector";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  BookOpenText,
  LogOut,
  Settings2,
  Sprout,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Account Settings",
};

const joinedDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

export default async function SettingsPage() {
  await connection();

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      createdAt: true,
      _count: { select: { studySessions: true } },
    },
  });

  if (!account) {
    redirect("/login");
  }

  const joinedLabel = joinedDateFormatter.format(account.createdAt);

  return (
    <div className="journal-desk settings-desk">
      <main className="study-journal settings-journal">
        <section
          className="journal-page journal-page--left settings-page settings-page--account"
          aria-labelledby="settings-title"
        >
          <header className="journal-brand">
            <Sprout aria-hidden="true" />
            <div>
              <Link href="/dashboard">Track My Studying</Link>
              <p>Personal Study Journal</p>
            </div>
          </header>

          <div className="settings-intro">
            <p className="settings-eyebrow">Journal settings</p>
            <div className="settings-title-row">
              <h1 id="settings-title">Account Settings</h1>
              <Settings2 aria-hidden="true" />
            </div>
            <p className="settings-description">
              Review the account connected to this journal and choose how its
              final page should be handled.
            </p>
          </div>

          <dl className="settings-account-card" aria-label="Account details">
            <div>
              <dt>
                <UserRound aria-hidden="true" />
                Signed in as
              </dt>
              <dd>{account.email ?? "Email unavailable"}</dd>
            </div>
            <div>
              <dt>
                <BookOpenText aria-hidden="true" />
                Journal record
              </dt>
              <dd>
                {account._count.studySessions} {account._count.studySessions === 1 ? "entry" : "entries"}
                <span> · joined {joinedLabel}</span>
              </dd>
            </div>
          </dl>

          <footer className="settings-page-footer">
            <nav className="journal-utilities settings-utilities" aria-label="Settings utilities">
              <Link href="/dashboard" className="journal-utility">
                <ArrowLeft aria-hidden="true" />
                Back to Dashboard
              </Link>
              <ThemeSelector />
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button type="submit" className="journal-utility">
                  <LogOut aria-hidden="true" />
                  Sign Out
                </button>
              </form>
            </nav>
            <p>Your journal remains private to this account.</p>
          </footer>
        </section>

        <section
          className="journal-page journal-page--right settings-page settings-page--danger"
          aria-labelledby="delete-account-title"
        >
          <div className="settings-danger-header">
            <p>Danger zone</p>
            <span aria-hidden="true">Final page</span>
          </div>

          <div className="settings-danger-content">
            <div className="settings-danger-heading">
              <span className="settings-danger-number">Account / 01</span>
              <h2 id="delete-account-title">Close this journal for good</h2>
              <p>
                Deleting your account removes the journal and every study record
                written inside it. There is no recovery period or undo.
              </p>
            </div>

            <DeleteAccountForm />
          </div>

          <p className="settings-danger-note">
            If you only need a break, sign out instead—your journal will be here
            when you return.
          </p>
        </section>
      </main>
    </div>
  );
}
