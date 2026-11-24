import { describe, expect, it } from "vitest";
import { calculateUkField5 } from "./uk-field5";

describe("calculateUkField5", () => {
  it("calculates a male Field 5 value", () => {
    const out = calculateUkField5({
      surname: "SMITH",
      firstName: "JOHN",
      dateOfBirth: "1964-03-15",
      gender: "M",
    });
    expect(out.valid).toBe(true);
    expect(out.calculatedPart).toBe("SMITH603154J99");
    expect(out.field5).toBe("SMITH603154J99<<");
    expect(out.field5.length).toBe(16);
  });

  it("adds 50 to the birth month for females", () => {
    const out = calculateUkField5({
      surname: "SMITH",
      firstName: "JANE",
      dateOfBirth: "1980-11-25",
      gender: "F",
    });
    expect(out.valid).toBe(true);
    expect(out.field5).toBe("SMITH861250J99<<");
  });

  it("pads short surnames with 9", () => {
    const out = calculateUkField5({
      surname: "Li",
      firstName: "A",
      dateOfBirth: "1990-01-02",
      gender: "M",
    });
    expect(out.valid).toBe(true);
    expect(out.calculatedPart.startsWith("LI999")).toBe(true);
  });

  it("rejects missing input", () => {
    const out = calculateUkField5({
      surname: "",
      firstName: "",
      dateOfBirth: "",
      gender: "M",
    });
    expect(out.valid).toBe(false);
    expect(out.errors.length).toBeGreaterThan(0);
  });
});
