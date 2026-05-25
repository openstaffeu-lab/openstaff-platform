"use client";

import { useState } from "react";
import type { KeyboardEventHandler } from "react";

type PasswordFieldProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  className?: string;
  inputClassName?: string;
};

export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  onKeyDown,
  className,
  inputClassName,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label className={`block ${className ?? ""}`} htmlFor={inputId}>
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      <span className="relative block">
        <input
          id={inputId}
          className={
            inputClassName ??
            "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-700 outline-none"
          }
          placeholder={placeholder}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-navy"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {visible ? null : (
              <path
                d="M4 20 20 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </span>
    </label>
  );
}
