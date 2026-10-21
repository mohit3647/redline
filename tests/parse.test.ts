import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyse } from "../src/lib/analyse";
import { MIN_USABLE_CHARS, assessText, parseFile } from "../src/lib/parse";
import { makeDocx, makePdf } from "./helpers/make-docx";
import { loadFixture, stubModel } from "./helpers/stub-model";

const FIX = join(__dirname, "fixtures");
const asFile = (data: string | Uint8Array, name: string) => new File([typeof data === "string" ? data : new Uint8Array(data)], name);

describe("usable-text rule", () => {
  it("refuses empty and whitespace-only text", () => {
    expect(assessText("").ok).toBe(false);
    expect(assessText(" \n\t ".repeat(100)).ok).toBe(false);
  });
  it("counts non-whitespace characters against the threshold", () => {
    expect(assessText("a".repeat(MIN_USABLE_CHARS - 1)).ok).toBe(false);
    expect(assessText("a".repeat(MIN_USABLE_CHARS)).ok).toBe(true);
    expect(assessText(("a ".repeat(MIN_USABLE_CHARS - 1)).trim()).ok).toBe(false);
  });
  it("refuses text that cannot be stored exactly", () => {
    const r = assessText("a".repeat(100) + "\u0000");
    expect(r.ok).toBe(false);
  });
  it("explains the refusal and mentions there is no OCR", () => {
    const r = assessText("");
    expect(!r.ok && r.message).toMatch(/no OCR/);
  });
});

describe("parseFile", () => {
  for (const name of ["adhesion-contract", "clean-contract"]) {
    it(`round-trips ${name}.txt byte for byte`, async () => {
      const bytes = readFileSync(join(FIX, `${name}.txt`));
      const r = await parseFile(asFile(bytes, `${name}.txt`));
      expect(r.ok && r.text).toBe(bytes.toString("utf8"));
      expect(r.ok && Buffer.from(r.text, "utf8").equals(bytes)).toBe(true);
    });
  }

  it("keeps CRLF and non-ASCII characters in .txt", async () => {
    const text = "Fee: €1,000 — due “net 30”.\r\n".repeat(5);
    const r = await parseFile(asFile(text, "a.txt"));
    expect(r.ok && r.text).toBe(text);
  });

  it("extracts exact text from a real .docx", async () => {
    const paras = [
      "1. Services. Contractor will deliver the Services described in Schedule A to the Client.",
      "2. Fee. Client will pay Contractor a fixed fee of $24,000 & expenses <approved>.",
    ];
    const r = await parseFile(asFile(makeDocx(paras), "agreement.docx"));
    // mammoth separates paragraphs with a blank line and ends the text with one.
    expect(r.ok && r.text).toBe(paras.join("\n\n") + "\n\n");
    expect(r.ok && r.format).toBe("docx");
  });

  it("refuses a .docx with no usable text", async () => {
    const r = await parseFile(asFile(makeDocx(["   "]), "scan.docx"));
    expect(r.ok).toBe(false);
  });

  it("extracts the text layer of a real .pdf", async () => {
    const line = "Client will pay Contractor a fixed fee of 24000 dollars within thirty days.";
    const r = await parseFile(asFile(makePdf(line), "agreement.pdf"));
    expect(r.ok && r.format).toBe("pdf");
    expect(r.ok && r.text.replace(/\s+/g, " ").trim()).toBe(line);
  });

  it("refuses a .pdf with no text layer (an image-only page), with no OCR", async () => {
    const r = await parseFile(asFile(makePdf(null), "scan.pdf"));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.message).toMatch(/no OCR/);
  });

  it("refuses a damaged .pdf with a plain message", async () => {
    const r = await parseFile(asFile("%PDF-1.4\n%%EOF", "broken.pdf"));
    expect(r.ok).toBe(false);
  });

  it("rejects unsupported formats", async () => {
    const r = await parseFile(asFile("x".repeat(200), "a.doc"));
    expect(r.ok).toBe(false);
  });
});

describe("parsed text feeds the exactness check", () => {
  it("every sidecar quote is a substring of the parsed fixture and survives analyse", async () => {
    const fx = loadFixture("adhesion-contract");
    const r = await parseFile(asFile(readFileSync(join(FIX, "adhesion-contract.txt")), "adhesion-contract.txt"));
    if (!r.ok) throw new Error("parse failed");
    for (const f of fx.sidecar.flags) expect(r.text.includes(f.sourceSentence)).toBe(true);
    const analysis = await analyse(r.text, [], stubModel("adhesion-contract"), undefined, { logger: () => {} });
    expect(analysis.dropped).toEqual([]);
    expect(analysis.flags.length).toBe(fx.sidecar.flags.length);
  });
});
