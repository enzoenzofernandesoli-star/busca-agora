import { FieldInput } from "@/components/conta/auth-form";

export type FieldProps = {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  maxLength?: number;
  errors?: string[];
  hint?: string;
};

// The server wrapper delegates context access to a client boundary.
export function Field(props: FieldProps) {
  return <FieldInput {...props} />;
}
