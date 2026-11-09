import { handleAsk } from "../../../src/lib/ask/handler";
import { createOpenRouterAskModel } from "../../../src/lib/ask/openrouter";
import { getUser } from "../../../src/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request): Promise<Response> {
  return handleAsk(request, {
    getUser,
    model: createOpenRouterAskModel(),
  });
}
