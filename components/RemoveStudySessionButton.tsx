"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
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
        className="ledger-remove-button"
      >
        <Trash2 aria-hidden="true" />
        Remove
      </button>

      {isOpen
        ? createPortal(
            <div className="journal-dialog-backdrop">
              <div
                aria-labelledby={`remove-session-${sessionId}`}
                aria-describedby={`remove-session-description-${sessionId}`}
                aria-modal="true"
                className="journal-confirmation"
                onKeyDown={(event) => {
                  if (event.key === "Escape") closeDialog();
                }}
                role="dialog"
              >
                <div className="journal-confirmation-header">
                  <div>
                    <span className="journal-confirmation-mark">
                      <AlertTriangle aria-hidden="true" />
                    </span>
                    <div>
                      <h2 id={`remove-session-${sessionId}`}>
                        Remove this session?
                      </h2>
                      <p id={`remove-session-description-${sessionId}`}>
                        {hours.toFixed(1)} hours for {subject} on {dateLabel}.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeDialog}
                    className="journal-confirmation-close"
                    aria-label="Close confirmation"
                  >
                    <X aria-hidden="true" />
                  </button>
                </div>

                {error ? (
                  <p className="journal-confirmation-error" role="alert">
                    {error}
                  </p>
                ) : null}

                <div className="journal-confirmation-actions">
                  <button
                    type="button"
                    onClick={closeDialog}
                    disabled={isRemoving}
                    className="journal-confirmation-keep"
                    autoFocus
                  >
                    Keep Session
                  </button>
                  <button
                    type="button"
                    onClick={confirmRemoval}
                    disabled={isRemoving}
                    className="journal-confirmation-remove"
                  >
                    {isRemoving ? (
                      <LoaderCircle
                        className="journal-spinner"
                        aria-hidden="true"
                      />
                    ) : (
                      <Trash2 aria-hidden="true" />
                    )}
                    Remove Session
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
