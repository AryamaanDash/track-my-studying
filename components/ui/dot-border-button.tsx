"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import styles from "./dot-border-button.module.css";

type DotBorderButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  children: ReactNode;
  pendingLabel?: string;
  wrapperClassName?: string;
};

const decorations = [
  [styles.line, styles.lineTop],
  [styles.line, styles.lineRight],
  [styles.line, styles.lineBottom],
  [styles.line, styles.lineLeft],
  [styles.dot, styles.dotTopLeft],
  [styles.dot, styles.dotTopRight],
  [styles.dot, styles.dotBottomRight],
  [styles.dot, styles.dotBottomLeft],
] as const;

export default function DotBorderButton({
  children,
  pendingLabel = "Working…",
  wrapperClassName,
  className,
  disabled,
  type = "button",
  ...props
}: DotBorderButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <span
      className={`${styles.wrapper}${wrapperClassName ? ` ${wrapperClassName}` : ""}`}
      data-disabled={isDisabled ? "" : undefined}
    >
      {decorations.map(([baseClass, positionClass]) => (
        <span
          key={positionClass}
          className={`${baseClass} ${positionClass}`}
          aria-hidden="true"
        />
      ))}

      <button
        {...props}
        type={type}
        className={`${styles.button}${className ? ` ${className}` : ""}`}
        disabled={isDisabled}
        aria-busy={pending || undefined}
      >
        <span className={styles.content} aria-live="polite">
          {pending ? <span className={styles.spinner} aria-hidden="true" /> : null}
          {pending ? pendingLabel : children}
        </span>
      </button>
    </span>
  );
}
