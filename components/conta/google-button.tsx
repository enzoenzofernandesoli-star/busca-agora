import { signInWithGoogle } from "@/lib/auth/actions";

// Server Action form: works without JavaScript.
export function GoogleButton({ volta }: { volta: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="volta" value={volta} />
      <button
        type="submit"
        className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-3 rounded-[14px] border-[1.5px] border-borda-forte bg-white font-display text-base font-bold text-noite hover:border-ultramar focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.7-4.9h-4v3.1A12 12 0 0 0 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.3 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.9l4-3.1z"
          />
          <path
            fill="#EA4335"
            d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c1-2.8 3.6-4.9 6.7-4.9z"
          />
        </svg>
        Continuar com Google
      </button>
    </form>
  );
}
