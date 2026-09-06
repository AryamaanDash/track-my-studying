"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Pause, Play, Square, Timer, X } from "lucide-react";
import { addStudySession } from "@/app/actions";
import { MAX_DURATION, elapsedTime, restoreSession, stopSession, type FocusSession } from "@/lib/focus-timer";

function clockLabel(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

export default function FocusTimer({ userId }: { userId: string }) {
  const [session, setSession] = useState<FocusSession | null>(null);
  const current = useRef<FocusSession | null>(null);
  const [ready, setReady] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [storageWarning, setStorageWarning] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const storageKey = `focus-timer:v1:${userId}`;
  const phase = session?.phase ?? "idle";
  const hours = Math.max(0.01, Math.round(elapsed / 36000) / 100).toFixed(2);

  // Persist transitions immediately, before navigation can unmount the timer.
  function commit(next: FocusSession | null) {
    current.current = next;
    setSession(next);
    setElapsed(next ? elapsedTime(next, Date.now()) : 0);
    try {
      if (next) window.sessionStorage.setItem(storageKey, JSON.stringify(next));
      else window.sessionStorage.removeItem(storageKey);
      setStorageWarning("");
    } catch {
      setStorageWarning("Browser storage is unavailable. Keep this page open to retain your timer.");
    }
  }

  useEffect(() => {
    // Run after hydration; controls stay disabled until restoration finishes.
    const restore = window.setTimeout(() => {
      try {
        const restored = restoreSession(window.sessionStorage.getItem(storageKey), Date.now());
        current.current = restored;
        setSession(restored);
        setElapsed(restored ? elapsedTime(restored, Date.now()) : 0);
        if (restored) window.sessionStorage.setItem(storageKey, JSON.stringify(restored));
        else window.sessionStorage.removeItem(storageKey);
      } catch {
        setStorageWarning("Browser storage is unavailable. Keep this page open to retain your timer.");
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, [storageKey]);

  useEffect(() => {
    if (phase !== "running") return;
    const tick = () => {
      const active = current.current;
      if (!active || active.phase !== "running") return;
      const duration = elapsedTime(active, Date.now());
      setElapsed(duration);
      if (duration >= MAX_DURATION) {
        const ended = stopSession(active, Date.now(), true);
        current.current = ended;
        setSession(ended);
        try {
          window.sessionStorage.setItem(storageKey, JSON.stringify(ended));
        } catch {
          setStorageWarning("Browser storage is unavailable. Keep this page open to retain your timer.");
        }
        dialog.current?.showModal();
      }
    };
    const interval = window.setInterval(tick, 250);
    window.addEventListener("pageshow", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pageshow", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [phase, storageKey]);

  function start() {
    const now = new Date();
    commit({ ...(current.current ?? {
      version: 1, accumulated: 0, subject: "", journal: "",
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    }), phase: "running", startedAt: now.getTime() });
    setMessage("");
  }

  function stop(end: boolean) {
    if (!current.current) return;
    const next = stopSession(current.current, Date.now(), end);
    commit(next);
    if (next.phase === "ended") dialog.current?.showModal();
  }

  function updateDraft(field: "subject" | "journal" | "date", value: string) {
    if (current.current) commit({ ...current.current, [field]: value });
  }

  function reset() {
    commit(null);
    setError("");
    dialog.current?.close();
  }

  return (
    <section className="focus-timer" aria-labelledby="focus-timer-heading">
      <div className="journal-section-heading">
        <h2 id="focus-timer-heading"><Timer aria-hidden="true" /> Focus timer</h2>
        <span className="journal-hand">One session at a time</span>
      </div>
      <p className="focus-timer-description">Your timer is kept in this tab through refreshes and navigation. Pause whenever you need a break.</p>
      <div className="focus-timer-controls">
        <div className="focus-timer-clock" role="timer" aria-label="Active study time">{clockLabel(elapsed)}</div>
        <div className="journal-confirmation-actions focus-timer-actions">
          {(phase === "idle" || phase === "paused") && <button type="button" className="journal-edit-save" disabled={!ready} onClick={start}><Play aria-hidden="true" />{phase === "paused" ? "Resume" : "Start timer"}</button>}
          {phase === "running" && <button type="button" className="journal-confirmation-keep" onClick={() => stop(false)}><Pause aria-hidden="true" />Pause</button>}
          {(phase === "running" || phase === "paused") && <button type="button" className="journal-confirmation-keep" onClick={() => stop(true)}><Square aria-hidden="true" />End timer</button>}
          {phase === "ended" && <button type="button" className="journal-edit-save" onClick={() => dialog.current?.showModal()}>Add entry</button>}
        </div>
      </div>
      <p className="focus-timer-status" role="status">
        {!ready ? "Restoring timer…" : message || ({ idle: "Ready when you are", running: "Focusing…", paused: "Paused — take your time", ended: "Session complete — ready to save" }[phase])}
      </p>
      {storageWarning && <p role="alert" className="focus-timer-description">{storageWarning}</p>}
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
              reset();
              setMessage("Focus session saved to your journal.");
            } catch {
              setError("Unable to save your session. Your timer and notes are still here — please try again.");
            }
          });
        }}>
          <div className="journal-form-group journal-edit-field--subject"><label htmlFor="focus-subject">Subject</label><input autoFocus id="focus-subject" name="subject" value={session?.subject ?? ""} onChange={(event) => updateDraft("subject", event.target.value)} required maxLength={80} autoComplete="off" placeholder="e.g. ICS 45C" className="journal-input journal-hand" disabled={isSaving} /></div>
          <div className="journal-form-group"><label htmlFor="focus-hours">Hours studied</label><div className="journal-hours-field journal-edit-hours-field"><input id="focus-hours" name="hours" value={hours} readOnly aria-describedby="focus-rounding" className="journal-input journal-hand" /><span aria-hidden="true">hrs</span></div><p id="focus-rounding" className="focus-timer-description">Rounded to 0.01 hours (minimum 0.01).</p></div>
          <div className="journal-form-group"><label htmlFor="focus-date">Date</label><input id="focus-date" name="date" type="date" required value={session?.date ?? ""} onChange={(event) => updateDraft("date", event.target.value)} disabled={isSaving} className="journal-input journal-date-input journal-hand [color-scheme:var(--input-color-scheme)]" /></div>
          <div className="journal-form-group journal-edit-field--journal"><label htmlFor="focus-notes">Notes</label><textarea id="focus-notes" name="journal" value={session?.journal ?? ""} onChange={(event) => updateDraft("journal", event.target.value)} rows={5} maxLength={10000} placeholder="What did you work on?" className="journal-textarea journal-hand" disabled={isSaving} /></div>
          {error && <p role="alert" className="journal-confirmation-error">{error}</p>}
          <div className="journal-confirmation-actions journal-edit-actions"><button type="button" className="journal-confirmation-keep" disabled={isSaving} onClick={reset}>Discard session</button><button type="submit" className="journal-edit-save" disabled={isSaving}>{isSaving ? "Saving entry…" : "Save Entry"}</button></div>
        </form>
      </dialog>
    </section>
  );
}
