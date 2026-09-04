"use client";

import type { FormEvent, KeyboardEvent, MouseEvent } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { FilePenLine, LoaderCircle, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateStudySession } from "@/app/actions";

type EditStudySessionButtonProps = {
  sessionId: string;
  subject: string;
  hours: number;
  date: string;
  journal: string | null;
};

export default function EditStudySessionButton({
  sessionId,
  subject,
  hours,
  date,
  journal,
}: EditStudySessionButtonProps) {
  const router = useRouter();
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, startSavingTransition] = useTransition();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const editButton = editButtonRef.current;
    document.body.style.overflow = "hidden";
    subjectInputRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      editButton?.focus();
    };
  }, [isOpen]);

  function closeDialog() {
    if (isSaving) return;
    setError("");
    setIsOpen(false);
  }

  function closeFromBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) closeDialog();
  }

  function keepFocusInDialog(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      closeDialog();
      return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements?.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  function saveChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError("");

    startSavingTransition(async () => {
      try {
        await updateStudySession(sessionId, formData);
        router.refresh();
        setIsOpen(false);
      } catch (updateError) {
        setError(
          updateError instanceof Error
            ? updateError.message
            : "Unable to update this session."
        );
      }
    });
  }

  return (
    <>
      <button
        ref={editButtonRef}
        type="button"
        onClick={() => setIsOpen(true)}
        className="ledger-edit-button"
      >
        <FilePenLine aria-hidden="true" />
        Edit
      </button>

      {isOpen
        ? createPortal(
            <div
              className="journal-dialog-backdrop"
              onMouseDown={closeFromBackdrop}
            >
              <div
                ref={dialogRef}
                aria-labelledby={`edit-session-${sessionId}`}
                aria-describedby={`edit-session-description-${sessionId}`}
                aria-modal="true"
                className="journal-confirmation journal-edit-dialog"
                onKeyDown={keepFocusInDialog}
                role="dialog"
              >
                <div className="journal-confirmation-header">
                  <div>
                    <span className="journal-confirmation-mark journal-edit-mark">
                      <FilePenLine aria-hidden="true" />
                    </span>
                    <div>
                      <h2 id={`edit-session-${sessionId}`}>
                        Edit study session
                      </h2>
                      <p id={`edit-session-description-${sessionId}`}>
                        Update the details written in this journal entry.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeDialog}
                    className="journal-confirmation-close"
                    aria-label="Close edit dialog"
                  >
                    <X aria-hidden="true" />
                  </button>
                </div>

                <form
                  aria-busy={isSaving}
                  className="journal-edit-form"
                  onSubmit={saveChanges}
                >
                  <div className="journal-form-group journal-edit-field--subject">
                    <label htmlFor={`edit-subject-${sessionId}`}>Subject</label>
                    <input
                      ref={subjectInputRef}
                      id={`edit-subject-${sessionId}`}
                      name="subject"
                      type="text"
                      defaultValue={subject}
                      required
                      maxLength={80}
                      autoComplete="off"
                      className="journal-input journal-hand"
                    />
                  </div>

                  <div className="journal-form-group">
                    <label htmlFor={`edit-hours-${sessionId}`}>
                      Hours studied
                    </label>
                    <div className="journal-hours-field journal-edit-hours-field">
                      <input
                        id={`edit-hours-${sessionId}`}
                        name="hours"
                        type="number"
                        min="0.1"
                        max="24"
                        step="0.1"
                        inputMode="decimal"
                        defaultValue={hours}
                        required
                        className="journal-input journal-hand"
                      />
                      <span aria-hidden="true">hrs</span>
                    </div>
                  </div>

                  <div className="journal-form-group">
                    <label htmlFor={`edit-date-${sessionId}`}>Date</label>
                    <input
                      id={`edit-date-${sessionId}`}
                      name="date"
                      type="date"
                      defaultValue={date}
                      required
                      className="journal-input journal-date-input journal-hand [color-scheme:var(--input-color-scheme)]"
                    />
                  </div>

                  <div className="journal-form-group journal-edit-field--journal">
                    <label htmlFor={`edit-journal-${sessionId}`}>Notes</label>
                    <textarea
                      id={`edit-journal-${sessionId}`}
                      name="journal"
                      rows={5}
                      maxLength={10000}
                      defaultValue={journal ?? ""}
                      placeholder="Write anything—notes, thoughts, links..."
                      className="journal-textarea journal-hand"
                    />
                  </div>

                  {error ? (
                    <p className="journal-confirmation-error" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <div className="journal-confirmation-actions journal-edit-actions">
                    <button
                      type="button"
                      onClick={closeDialog}
                      disabled={isSaving}
                      className="journal-confirmation-keep"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="journal-edit-save"
                    >
                      {isSaving ? (
                        <LoaderCircle
                          className="journal-spinner"
                          aria-hidden="true"
                        />
                      ) : (
                        <Save aria-hidden="true" />
                      )}
                      {isSaving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
