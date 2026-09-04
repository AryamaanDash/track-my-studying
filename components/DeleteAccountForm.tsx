"use client";

import { deleteAccount, type DeleteAccountState } from "@/app/actions";
import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

const initialState: DeleteAccountState = { attempt: 0 };

export default function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(
    deleteAccount,
    initialState
  );

  return (
    <DeleteAccountFields
      key={state.attempt}
      error={state.error}
      formAction={formAction}
      pending={pending}
    />
  );
}

function DeleteAccountFields({
  error,
  formAction,
  pending,
}: {
  error?: string;
  formAction: (payload: FormData) => void;
  pending: boolean;
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const canSubmit =
    password.length > 0 && confirmation === "DELETE" && acknowledged;

  return (
    <form action={formAction} className="delete-account-form">
      <div className="delete-account-warning" role="note">
        <AlertTriangle aria-hidden="true" />
        <div>
          <strong>This cannot be undone.</strong>
          <p>
            Your profile, sign-in, study sessions, and journal entries will be
            permanently erased.
          </p>
        </div>
      </div>

      <div className="delete-account-field">
        <label htmlFor="delete-account-password">Confirm your password</label>
        <input
          autoComplete="current-password"
          id="delete-account-password"
          maxLength={72}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your current password"
          required
          type="password"
          value={password}
        />
      </div>

      <div className="delete-account-field">
        <label htmlFor="delete-account-confirmation">
          Type <strong>DELETE</strong> to confirm
        </label>
        <input
          autoCapitalize="characters"
          autoComplete="off"
          id="delete-account-confirmation"
          maxLength={6}
          name="confirmation"
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder="DELETE"
          required
          spellCheck={false}
          type="text"
          value={confirmation}
        />
      </div>

      <label className="delete-account-acknowledgement">
        <input
          checked={acknowledged}
          name="acknowledgement"
          onChange={(event) => setAcknowledged(event.target.checked)}
          type="checkbox"
          value="understood"
        />
        <span>I understand that all of my journal data will be deleted.</span>
      </label>

      {error ? (
        <p className="delete-account-error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        className="delete-account-submit"
        disabled={!canSubmit || pending}
        type="submit"
      >
        {pending ? (
          <LoaderCircle className="journal-spinner" aria-hidden="true" />
        ) : (
          <Trash2 aria-hidden="true" />
        )}
        {pending ? "Deleting account…" : "Permanently delete my account"}
      </button>
    </form>
  );
}
