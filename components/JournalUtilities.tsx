import { signOut } from "@/auth";
import JournalPageTurnLink from "@/components/JournalPageTurnLink";
import ThemeSelector from "@/components/ThemeSelector";
import { BookOpenText, FilePenLine, LogOut, Settings2 } from "lucide-react";
import Link from "next/link";

export default function JournalUtilities() {
  return (
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
  );
}
