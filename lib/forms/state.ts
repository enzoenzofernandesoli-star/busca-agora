export type FormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  /**
   * What the customer typed, echoed back on error: React 19 resets the form
   * after an action, so without this the fields would come back empty.
   * Never includes passwords.
   */
  values?: Record<string, string>;
};

export const initialFormState: FormState = { ok: false };

const NEVER_ECHO = /senha|password|confirmacao/i;

/** Text fields of the submitted form, minus passwords and hidden "$" keys. */
export function echoValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (
      typeof value === "string" &&
      !key.startsWith("$") &&
      !NEVER_ECHO.test(key)
    ) {
      values[key] = value.slice(0, 500);
    }
  }
  return values;
}
