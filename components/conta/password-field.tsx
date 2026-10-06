"use client";

import { useState } from "react";
import type { FieldProps } from "@/components/conta/field";
import { useFieldErrors } from "@/components/conta/auth-form";

export function PasswordField({
  id,
  name,
  label,
  errors,
  hint,
  showStrength = false,
  defaultValue = "",
  ...props
}: Omit<FieldProps, "type"> & { showStrength?: boolean }) {
  const [isVisible, setIsVisible] = useState(false);
  const [password, setPassword] = useState(defaultValue);
  const contextErrors = useFieldErrors(name);
  const messages = errors ?? contextErrors;
  const hasErrors = !!messages?.length;
  const score = [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9\s]/.test(password),
  ].filter(Boolean).length;
  // Nothing typed yet: no verdict.
  const level = password ? Math.max(1, score) : 0;
  const strengthLabel = level
    ? ["Fraca", "Média", "Boa", "Forte"][level - 1]
    : "";
  const strengthColor = level
    ? ["bg-rosa-ink", "bg-[#B7791F]", "bg-ultramar", "bg-estoque"][level - 1]
    : "";
  const describedBy =
    [
      hasErrors ? `${id}-erro` : "",
      hint ? `${id}-dica` : "",
      showStrength ? `${id}-forca` : "",
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className="flex min-w-0 flex-col gap-2 font-sans">
      <label htmlFor={id} className="text-[15px] font-bold text-noite">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={id}
          name={name}
          type={isVisible ? "text" : "password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={hasErrors || undefined}
          aria-describedby={describedBy}
          className={`h-12 w-full rounded-[14px] border-[1.5px] bg-white pr-14 pl-4 text-base text-noite placeholder:text-texto-3 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar ${hasErrors ? "border-rosa-ink" : "border-borda-forte"}`}
        />
        <button
          type="button"
          onClick={() => setIsVisible((value) => !value)}
          aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={isVisible}
          aria-controls={id}
          className="absolute top-0.5 right-0.5 flex size-11 items-center justify-center rounded-[12px] text-texto-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {isVisible ? (
              <>
                <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.9 10.9 0 0 1 12 5c7 0 10 7 10 7a16.4 16.4 0 0 1-3.2 4.2M6.2 6.2C3.4 8.2 2 12 2 12s3 7 10 7a11 11 0 0 0 5.8-1.6" />
              </>
            ) : (
              <>
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      </div>
      {hasErrors && (
        <p id={`${id}-erro`} className="text-sm text-rosa-ink">
          {messages.join(" ")}
        </p>
      )}
      {hint && (
        <p id={`${id}-dica`} className="text-sm text-texto-2">
          {hint}
        </p>
      )}
      {showStrength && (
        <div className="space-y-2">
          <div aria-hidden="true" className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((segment) => (
              <span
                key={segment}
                className={`h-1.5 rounded-full ${segment <= level ? strengthColor : "bg-borda"}`}
              />
            ))}
          </div>
          <p
            id={`${id}-forca`}
            aria-live="polite"
            className="text-sm text-texto-2"
          >
            {strengthLabel}
          </p>
        </div>
      )}
    </div>
  );
}
