import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "../app/page";

const html = renderToStaticMarkup(Home());
const text = html.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " ");

describe("landing page copy (ticket 13)", () => {
  it("discloses that the text goes to a third-party provider via OpenRouter on zero-data-retention routes", () => {
    expect(text).toContain("sent to a third-party model provider");
    expect(text).toContain("OpenRouter on zero-data-retention routes");
    expect(text).toContain("It leaves your browser");
  });
  it("says it is not legal advice", () => {
    expect(text).toMatch(/isn't legal advice|Not legal advice/);
  });
  it("labels the sample and says the flags are an illustration, not captured output", () => {
    expect(text).toMatch(/Sample/);
    expect(text).toContain("written for this page");
    expect(text).toContain("have not yet been captured from Redline's analysis");
    // every place the stand-in analysis appears carries the label
    expect((text.match(/not yet (?:been )?captured from Redline's analysis|not output from Redline's analysis/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });
  it("makes no claim the evidence cannot support and no comparison", () => {
    for (const w of ["testimonial", "customer", "accura", "benchmark", "free chatbot", "ChatGPT", "waitlist", "pricing", "price", "compare", "comparison", "subscribe", "newsletter", "renter", "landlord", "trusted by", "users"]) {
      expect(text.toLowerCase(), w).not.toContain(w.toLowerCase());
    }
    const pct = text.match(/\d+\s?%/g) ?? [];
    expect(pct).toEqual(["25%"]); // the sample counter-offer's kill fee only
  });
  it("offers sign-in as the only action and has no form or email field", () => {
    expect(html).not.toMatch(/<form|<input|type="email"|mailto:/);
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).filter((h) => !h.startsWith("#"));
    expect(new Set(hrefs)).toEqual(new Set(["/", "/sign-in"]));
  });
  it("does not advertise documents outside scope as ones it reads", () => {
    const reads = html.split("Doesn&#x27;t read")[0].split("<h3>Reads</h3>")[1];
    expect(reads).not.toMatch(/terms of service|rent|lease|signed/i);
  });
  it("has one h1 and no skipped heading levels", () => {
    const levels = [...html.matchAll(/<h([1-6])/g)].map((m) => Number(m[1]));
    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    levels.forEach((l, i) => { if (i) expect(l - levels[i - 1]).toBeLessThanOrEqual(1); });
  });
});
