import { describe, expect, it } from "vitest";
import {
  acknowledgeDisclosure,
  answerCounterparty,
  initialIntake,
  intakeStage,
  isPickerUsable,
} from "../src/lib/parse";

describe("intake gate", () => {
  it("starts with the picker unusable and the disclosure showing", () => {
    expect(isPickerUsable(initialIntake)).toBe(false);
    expect(intakeStage(initialIntake)).toBe("disclosure");
  });

  it("ignores a counterparty answer given before the disclosure is acknowledged", () => {
    const s = answerCounterparty(initialIntake, "yes");
    expect(s).toEqual(initialIntake);
    expect(isPickerUsable(s)).toBe(false);
  });

  it("keeps the picker unusable after the disclosure until the question is answered", () => {
    const s = acknowledgeDisclosure(initialIntake);
    expect(intakeStage(s)).toBe("counterparty");
    expect(isPickerUsable(s)).toBe(false);
  });

  it("opens the picker only after disclosure and a yes", () => {
    const s = answerCounterparty(acknowledgeDisclosure(initialIntake), "yes");
    expect(intakeStage(s)).toBe("ready");
    expect(isPickerUsable(s)).toBe(true);
  });

  it("refuses on no, and the picker never opens", () => {
    const s = answerCounterparty(acknowledgeDisclosure(initialIntake), "no");
    expect(intakeStage(s)).toBe("refused");
    expect(isPickerUsable(s)).toBe(false);
  });
});
