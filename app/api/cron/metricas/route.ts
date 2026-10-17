import { z } from "zod";

import { authorizedCron } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/db/admin";

// POST/GET /api/cron/metricas?de=YYYY-MM-DD&ate=YYYY-MM-DD
// Recalculates product_metrics_daily for a period (Authorization: Bearer
// CRON_SECRET). The hourly refresh runs inside the database (pg_cron); this
// route is for recalculating any period by hand.
const day = z.iso.date();
const query = z.object({ de: day, ate: day });

async function handle(request: Request) {
  if (!authorizedCron(request))
    return new Response("unauthorized", { status: 401 });
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = query.safeParse(params);
  if (!parsed.success)
    return Response.json({ erro: "periodo_invalido" }, { status: 400 });
  const { data, error } = await createAdminClient().rpc(
    "refresh_product_metrics",
    {
      p_de: parsed.data.de,
      p_ate: parsed.data.ate,
    },
  );
  if (error) {
    return Response.json(
      {
        erro:
          error.message === "invalid_period" ? "periodo_invalido" : "falhou",
      },
      { status: error.message === "invalid_period" ? 400 : 500 },
    );
  }
  return Response.json({ linhas: data });
}

export const GET = handle;
export const POST = handle;
