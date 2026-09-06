import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import JournalUtilities from "@/components/JournalUtilities";

export default function MobileNotebookUtilities() {
  return (
    <div className="journal-mobile-utilities journal-mobile-utilities--secondary">
      <Link href="/dashboard" className="journal-utility">
        <ArrowLeft aria-hidden="true" />
        Back to dashboard
      </Link>
      <JournalUtilities />
    </div>
  );
}
