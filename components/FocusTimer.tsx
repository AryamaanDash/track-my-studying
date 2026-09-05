"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Pause, Play, Square, Timer, X } from "lucide-react";
import { addStudySession } from "@/app/actions";
import StudySessionDateInput from "@/components/StudySessionDateInput";

const MAX_DURATION = 24 * 60 * 60 * 1000;

function clockLabel(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

export default function FocusTimer() {
  const [phase, setPhase] = useState<"idle" | "running" | "paused" | "ended">("idle");
  const [elapsed, setElapsed] = useState(0);
  const accumulated = useRef(0);
  const startedAt = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const hours = Math.max(0.01, Math.round(elapsed / 36000) / 100).toFixed(2);

  useEffect(() => {
    if (phase !== "running") return;
    const interval = window.setInterval(() => {
      const duration = Math.min(MAX_DURATION, accumulated.current + Date.now() - startedAt.current);
      setElapsed(duration);
      if (duration >= MAX_DURATION) {
        accumulated.current = duration;
        setPhase("ended");
        dialog.current?.showModal();
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [phase]);

  function start() {
    startedAt.current = Date.now();
    setMessage("");
    setPhase("running");
  }

  function stop(end: boolean) {
    if (phase === "running") {
      accumulated.current = Math.min(MAX_DURATION, accumulated.current + Date.now() - startedAt.current);
    }
    setElapsed(accumulated.current);
    setPhase(end ? "ended" : "paused");
    if (end) dialog.current?.showModal();
  }

  function reset() {
    accumulated.current = 0;
    setElapsed(0);
    setPhase("idle");
    setError("");
    dialog.current?.querySelector("form")?.reset();
    dialog.current?.close();
  }

  return (
    <section className="focus-timer" aria-labelledby="focus-timer-heading">
      <div className="journal-section-heading">
        <h2 id="focus-timer-heading"><Timer aria-hidden="true" /> Focus timer</h2>
        <span className="journal-hand">One session at a time</span>
      </div>
      <p className="focus-timer-description">Keep this page open while you study. Pause whenever you need a break.</p>
      <div className="focus-timer-clock" role="timer" aria-label="Active study time">{clockLabel(elapsed)}</div>
      <p className="focus-timer-status" role="status">
        {message || ({ idle: "Ready when you are", running: "Focusing…", paused: "Paused — take your time", ended: "Session complete — ready to save" }[phase])}
      </p>
      <div className="journal-confirmation-actions focus-timer-actions">
        {(phase === "idle" || phase === "paused") && <button type="button" className="journal-edit-save" onClick={start}><Play aria-hidden="true" />{phase === "paused" ? "Resume" : "Start timer"}</button>}
        {phase === "running" && <button type="button" className="journal-confirmation-keep" onClick={() => stop(false)}><Pause aria-hidden="true" />Pause</button>}
        {(phase === "running" || phase === "paused") && <button type="button" className="journal-confirmation-keep" onClick={() => stop(true)}><Square aria-hidden="true" />End timer</button>}
        {phase === "ended" && <button type="button" className="journal-edit-save" onClick={() => dialog.current?.showModal()}>Add entry</button>}
      </div>
      <dialog ref={dialog} className="journal-confirmation journal-edit-dialog focus-timer-dialog" aria-labelledby="focus-entry-title" aria-describedby="focus-entry-description" onCancel={(event) => { if (isSaving) event.preventDefault(); }}>
        <div className="journal-confirmation-header">
          <div>
            <span className="journal-confirmation-mark journal-edit-mark"><Timer aria-hidden="true" /></span>
            <div><h2 id="focus-entry-title">Save your focus session</h2><p id="focus-entry-description">You studied for {clockLabel(elapsed)}. Paused time is excluded.</p></div>
          </div>
          <button type="button" className="journal-confirmation-close" aria-label="Close focus entry" disabled={isSaving} onClick={() => dialog.current?.close()}><X aria-hidden="true" /></button>
        </div>
        <form className="journal-edit-form" aria-busy={isSaving} onSubmit={(event) => {
          event.preventDefault();
          if (isSaving) return;
          const form = event.currentTarget;
          const data = new FormData(form);
          data.set("hours", hours);
          setError("");
          startSaving(async () => {
            try {
              await addStudySession(data);
              form.reset();
              reset();
              setMessage("Focus session saved to your journal.");
            } catch {
              setError("Unable to save your session. Your timer and notes are still here — please try again.");
            }
          });
        }}>
          <div className="journal-form-group journal-edit-field--subject"><label htmlFor="focus-subject">Subject</label><input autoFocus id="focus-subject" name="subject" required maxLength={80} autoComplete="off" placeholder="e.g. ICS 45C" className="journal-input journal-hand" disabled={isSaving} /></div>
          <div className="journal-form-group"><label htmlFor="focus-hours">Hours studied</label><div className="journal-hours-field journal-edit-hours-field"><input id="focus-hours" name="hours" value={hours} readOnly aria-describedby="focus-rounding" className="journal-input journal-hand" /><span aria-hidden="true">hrs</span></div><p id="focus-rounding" className="focus-timer-description">Rounded to 0.01 hours (minimum 0.01).</p></div>
          <div className="journal-form-group"><label htmlFor="focus-date">Date</label><StudySessionDateInput id="focus-date" /></div>
          <div className="journal-form-group journal-edit-field--journal"><label htmlFor="focus-notes">Notes</label><textarea id="focus-notes" name="journal" rows={5} maxLength={10000} placeholder="What did you work on?" className="journal-textarea journal-hand" disabled={isSaving} /></div>
          {error && <p role="alert" className="journal-confirmation-error">{error}</p>}
          <div className="journal-confirmation-actions journal-edit-actions"><button type="button" className="journal-confirmation-keep" disabled={isSaving} onClick={reset}>Discard session</button><button type="submit" className="journal-edit-save" disabled={isSaving}>{isSaving ? "Saving entry…" : "Save Entry"}</button></div>
        </form>
      </dialog>
    </section>
  );
}
