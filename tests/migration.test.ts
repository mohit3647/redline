import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Supplementary only. This reads the SQL text; it does not run Postgres, so row-level
// security behaviour itself is unverified until the migration is applied to a Supabase database.
const dir = join(__dirname, "..", "supabase", "migrations");
const file = readdirSync(dir).find((f) => f.endsWith("_documents.sql"));
const sql = file ? readFileSync(join(dir, file), "utf8") : "";

describe("documents migration (static check)", () => {
  it("exists and creates the table with the specified columns", () => {
    expect(file).toBeDefined();
    expect(sql).toMatch(/create table public\.documents/);
    expect(sql).toMatch(/user_id uuid not null references auth\.users on delete cascade default auth\.uid\(\)/);
  });
  it("enables RLS and scopes select and insert to auth.uid()", () => {
    expect(sql).toMatch(/alter table public\.documents enable row level security/);
    expect(sql).toMatch(/for select[\s\S]*?using \(user_id = \(select auth\.uid\(\)\)\)/);
    expect(sql).toMatch(/for insert[\s\S]*?with check \(user_id = \(select auth\.uid\(\)\)\)/);
  });
  it("defines no update or delete policy", () => {
    expect(sql).not.toMatch(/for (update|delete|all)/);
  });
});
