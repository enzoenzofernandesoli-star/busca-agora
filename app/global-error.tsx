"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Loaded on demand: keeps the SDK out of every page's first load.
    void import("@sentry/nextjs").then((Sentry) =>
      Sentry.captureException(error),
    );
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          background: "#3324F5",
          color: "#FFFFFF",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 32 }}>Algo deu errado.</h1>
        <p style={{ margin: 0, color: "#DCDFFF" }}>
          Já fomos avisados. Tente de novo em instantes.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            minHeight: 48,
            padding: "0 24px",
            borderRadius: 14,
            border: 0,
            background: "#C6FF3D",
            color: "#0A0F3D",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
