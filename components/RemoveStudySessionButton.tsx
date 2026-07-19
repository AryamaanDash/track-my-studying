"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, LoaderCircle, Trash2, X } from "lucide-react";
import { deleteSession } from "@/app/actions";

type RemoveStudySessionButtonProps = {
  sessionId: string;
  subject: string;
  hours: number;
  dateLabel: string;
};

export default function RemoveStudySessionButton({
  sessionId,
  subject,
  hours,
  dateLabel,
}: RemoveStudySessionButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);

  function closeDialog() {
    if (isRemoving) return;
    setError("");
    setIsOpen(false);
  }

  async function confirmRemoval() {
    setError("");
    setIsRemoving(true);

    try {
      await deleteSession(sessionId);
      router.refresh();
      setIsOpen(false);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to remove this session."
      );
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-danger-border bg-danger-soft px-3 py-2 text-sm font-semibold text-danger-foreground transition-colors hover:border-danger hover:text-danger"
      >
        <Trash2 className="h-4 w-4" />
        Remove
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            aria-labelledby={`remove-session-${sessionId}`}
            aria-modal="true"
            className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 text-foreground shadow-2xl"
            role="dialog"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="rounded-full bg-danger-soft p-2 text-danger">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <h2
                    id={`remove-session-${sessionId}`}
                    className="text-lg font-semibold"
                  >
                    Remove this session?
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {hours.toFixed(1)} hours for {subject} on {dateLabel}.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDialog}
                className="rounded-lg p-1 text-muted transition-colors hover:bg-surface-strong hover:text-foreground"
                aria-label="Close confirmation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error ? (
              <p className="mb-4 rounded-xl border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger-foreground">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDialog}
                disabled={isRemoving}
                className="rounded-xl border border-border bg-surface-strong px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                Keep Session
              </button>
              <button
                type="button"
                onClick={confirmRemoval}
                disabled={isRemoving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRemoving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Remove Session
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
