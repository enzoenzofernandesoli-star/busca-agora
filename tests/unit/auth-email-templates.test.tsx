import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";

import { AUTH_TEMPLATES, type AuthTemplateName } from "@/emails/auth";

// supabase/templates/*.html are generated from emails/auth.tsx.
// Regenerate with: UPDATE_TEMPLATES=1 npx vitest run tests/unit/auth-email-templates.test.tsx
const dir = path.resolve(import.meta.dirname, "../../supabase/templates");

describe("Supabase Auth e-mail templates", () => {
  for (const name of Object.keys(AUTH_TEMPLATES) as AuthTemplateName[]) {
    it(`${name}.html matches emails/auth.tsx`, async () => {
      const html = await render(AUTH_TEMPLATES[name].element);
      const file = path.join(dir, `${name}.html`);
      if (process.env.UPDATE_TEMPLATES === "1" || !existsSync(file)) {
        writeFileSync(file, html);
      }
      expect(readFileSync(file, "utf8")).toBe(html);
      expect(html).toContain('href="{{ .ConfirmationURL }}"');
      expect(html).toContain("{{ .SiteURL }}/brand/logo-email.png");
      expect(html).not.toMatch(/undefined|NaN/);
    });
  }
});
