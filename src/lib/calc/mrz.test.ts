import { describe, expect, it } from "vitest";
import { checkDigit, generateMRZ } from "./mrz";

describe("checkDigit", () => {
  it("computes ICAO check digits with 7-3-1 weights", () => {
    expect(checkDigit("0")).toBe(0);
    expect(checkDigit("9")).toBe(3); // 9 * 7 = 63 -> 3
    expect(checkDigit("12345")).toBe(9); // (7+6+3+28+15) % 10 = 59 % 10 = 9
  });
});

describe("generateMRZ", () => {
  it("produces fixed-length TD3 lines with check digits", () => {
    const out = generateMRZ({
      format: "TD3",
      issuingState: "USA",
      surname: "ERIKSSON",
      givenNames: "ANNA MARIA",
      documentNumber: "C12345678",
      nationality: "SWE",
      dateOfBirth: "1964-03-15",
      sex: "F",
      expiryDate: "2024-08-15",
      personalNumber: "12345678901234",
    });
    expect(out.valid).toBe(true);
    expect(out.line1.length).toBe(44);
    expect(out.line2.length).toBe(44);
    expect(out.line3).toBeNull();
  });

  it("produces TD1 with 3 lines of 30 chars", () => {
    const out = generateMRZ({
      format: "TD1",
      issuingState: "USA",
      surname: "DOE",
      givenNames: "JANE",
      documentNumber: "A1234567",
      nationality: "USA",
      dateOfBirth: "1980-01-02",
      sex: "F",
      expiryDate: "2030-01-01",
      optional2: "",
    });
    expect(out.valid).toBe(true);
    expect(out.line1.length).toBe(30);
    expect(out.line2.length).toBe(30);
    expect(out.line3?.length).toBe(30);
  });

  it("rejects invalid dates", () => {
    const out = generateMRZ({
      format: "TD3",
      issuingState: "USA",
      surname: "DOE",
      givenNames: "JANE",
      documentNumber: "A1234567",
      nationality: "USA",
      dateOfBirth: "not-a-date",
      sex: "M",
      expiryDate: "2030-01-01",
    });
    expect(out.valid).toBe(false);
  });
});
