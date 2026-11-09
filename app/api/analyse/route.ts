import { handleAnalyse } from "../../../src/lib/analyse/handler";
import { createOpenRouterModel } from "../../../src/lib/model/openrouter";
import { getUser } from "../../../src/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  return handleAnalyse(request, {
    getUser,
    model: createOpenRouterModel(),
  });
}
