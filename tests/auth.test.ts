import { describe, expect, it } from "vitest";
import { decideRoute, isSupabaseSessionCookie, sanitizeNextPath } from "../src/lib/auth/routing";
import { getSupabaseConfig, isSupabaseConfigured } from "../src/lib/supabase/config";

const URL_VAR = "NEXT_PUBLIC_SUPABASE_URL";
const KEY_VAR = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

describe("isSupabaseConfigured", () => {
  it("is true with both variables set", () => {
    expect(isSupabaseConfigured({ [URL_VAR]: "http://127.0.0.1:54321", [KEY_VAR]: "anon" })).toBe(true);
  });
  it("is false when either or both are absent", () => {
    expect(isSupabaseConfigured({})).toBe(false);
    expect(isSupabaseConfigured({ [URL_VAR]: "http://127.0.0.1:54321" })).toBe(false);
    expect(isSupabaseConfigured({ [KEY_VAR]: "anon" })).toBe(false);
  });
  it("treats blank values and a non-http URL as unconfigured", () => {
    expect(isSupabaseConfigured({ [URL_VAR]: "  ", [KEY_VAR]: "anon" })).toBe(false);
    expect(isSupabaseConfigured({ [URL_VAR]: "http://x", [KEY_VAR]: " " })).toBe(false);
    expect(isSupabaseConfigured({ [URL_VAR]: "not a url", [KEY_VAR]: "anon" })).toBe(false);
    expect(isSupabaseConfigured({ [URL_VAR]: "javascript:alert(1)", [KEY_VAR]: "anon" })).toBe(false);
  });
  it("returns trimmed values", () => {
    expect(getSupabaseConfig({ [URL_VAR]: " https://a.supabase.co ", [KEY_VAR]: " k " })).toEqual({
      url: "https://a.supabase.co",
      anonKey: "k",
    });
  });
});

describe("decideRoute", () => {
  const go = (pathname: string, configured: boolean, signedIn: boolean) =>
    decideRoute({ pathname, configured, signedIn });

  it("sends a signed-in signer from / and /sign-in to /app", () => {
    expect(go("/", true, true)).toEqual({ kind: "redirect", to: "/app" });
    expect(go("/sign-in", true, true)).toEqual({ kind: "redirect", to: "/app" });
  });
  it("lets a signed-in signer through to the app", () => {
    expect(go("/app", true, true)).toEqual({ kind: "continue" });
    expect(go("/app/documents", true, true)).toEqual({ kind: "continue" });
  });
  it("shows a signed-out visitor the landing page and sign-in", () => {
    expect(go("/", true, false)).toEqual({ kind: "continue" });
    expect(go("/sign-in", true, false)).toEqual({ kind: "continue" });
  });
  it("sends a signed-out visitor from the app to /sign-in", () => {
    expect(go("/app", true, false)).toEqual({ kind: "redirect", to: "/sign-in" });
    expect(go("/app/anything", true, false)).toEqual({ kind: "redirect", to: "/sign-in" });
  });
  it("does not treat lookalike paths as the app", () => {
    expect(go("/application", true, false)).toEqual({ kind: "continue" });
    expect(go("/apple", true, false)).toEqual({ kind: "continue" });
  });
  it("never redirects when unconfigured, so the pages can show the setup state", () => {
    for (const p of ["/", "/sign-in", "/app", "/app/x"]) {
      expect(go(p, false, false)).toEqual({ kind: "continue" });
      expect(go(p, false, true)).toEqual({ kind: "continue" });
    }
  });
});

describe("sanitizeNextPath", () => {
  it("keeps same-site paths, with query and hash", () => {
    expect(sanitizeNextPath("/app")).toBe("/app");
    expect(sanitizeNextPath("/app/doc?id=3#top")).toBe("/app/doc?id=3#top");
  });
  it("falls back to /app when missing or empty", () => {
    expect(sanitizeNextPath(null)).toBe("/app");
    expect(sanitizeNextPath(undefined)).toBe("/app");
    expect(sanitizeNextPath("")).toBe("/app");
  });
  it("rejects absolute and protocol-relative URLs", () => {
    expect(sanitizeNextPath("https://evil.example/app")).toBe("/app");
    expect(sanitizeNextPath("//evil.example")).toBe("/app");
    expect(sanitizeNextPath("//evil.example/app")).toBe("/app");
    expect(sanitizeNextPath("javascript:alert(1)")).toBe("/app");
  });
  it("rejects backslash and control-character tricks", () => {
    expect(sanitizeNextPath("/\\evil.example")).toBe("/app");
    expect(sanitizeNextPath("/\t/evil.example")).toBe("/app");
    expect(sanitizeNextPath("/\n/evil.example")).toBe("/app");
    expect(sanitizeNextPath("relative/path")).toBe("/app");
  });
  it("honours a caller-supplied fallback", () => {
    expect(sanitizeNextPath("//x", "/sign-in")).toBe("/sign-in");
  });
});

describe("isSupabaseSessionCookie", () => {
  it("matches the session cookie and its chunks, not the PKCE verifier or others", () => {
    expect(isSupabaseSessionCookie("sb-127-auth-token")).toBe(true);
    expect(isSupabaseSessionCookie("sb-abcd-auth-token.0")).toBe(true);
    expect(isSupabaseSessionCookie("sb-abcd-auth-token-code-verifier")).toBe(false);
    expect(isSupabaseSessionCookie("theme")).toBe(false);
  });
});
