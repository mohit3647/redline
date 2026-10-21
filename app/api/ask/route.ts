import { handleAsk } from "../../../src/lib/ask/handler";
import { createOpenRouterAskModel } from "../../../src/lib/ask/openrouter";
import { isSupabaseConfigured } from "../../../src/lib/supabase/config";
import { getUser } from "../../../src/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request): Promise<Response> {
  return handleAsk(request, {
    configured: isSupabaseConfigured(),
    getUser,
    model: createOpenRouterAskModel(),
  });
}
