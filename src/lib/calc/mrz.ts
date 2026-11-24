/**
 * ICAO Doc 9303 Machine Readable Zone (MRZ) generation service.
 *
 * Formats: TD1 (3x30), TD2 (2x36), TD3 (2x44), MRV-A (2x44), MRV-B (2x36).
 *
 * Check-digit algorithm (ICAO 9303):
 *   char value: 0-9 => 0-9, A-Z => 10-35, < => 0
 *   weights repeat 7, 3, 1
 *   check digit = sum(value[i] * weight[i % 3]) mod 10
 *
 * NOTE: A structurally valid MRZ is a format calculation only. It is NOT proof
 * that a passport, visa or identity document is genuine or officially issued.
 */

const WEIGHTS = [7, 3, 1];

const CHAR_VALUE: Record<string, number> = {};
for (let d = 0; d <= 9; d++) CHAR_VALUE[String(d)] = d;
for (let i = 0; i < 26; i++) CHAR_VALUE[String.fromCharCode(65 + i)] = 10 + i;
CHAR_VALUE["<"] = 0;

export function normalizeMrzChar(ch: string): string {
  const c = ch.toUpperCase();
  if (c >= "A" && c <= "Z") return c;
  if (c >= "0" && c <= "9") return c;
  if (c === "<") return "<";
  return "<";
}

function mrzValue(ch: string): number {
  return CHAR_VALUE[ch] ?? 0;
}

export function checkDigit(field: string): number {
  let total = 0;
  for (let i = 0; i < field.length; i++) {
    total += mrzValue(field[i]) * WEIGHTS[i % 3];
  }
  return total % 10;
}

function pad(s: string, len: number): string {
  let t = "";
  for (let i = 0; i < len && i < s.length; i++) t += normalizeMrzChar(s[i]);
  while (t.length < len) t += "<";
  return t;
}

function nameField(surname: string, given: string, maxLen: number): string {
  const norm = (s: string) =>
    s
      .toUpperCase()
      .replace(/[^A-Z0-9<]/g, "<")
      .replace(/<{2,}/g, "<<");
  const combined = norm(surname) + "<<" + norm(given);
  return pad(combined, maxLen);
}

export function dateToMrz(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return m[1].slice(2) + m[2] + m[3];
}

export type MrzFormat = "TD1" | "TD2" | "TD3" | "MRVA" | "MRVB";

export interface MrzInput {
  format: MrzFormat;
  issuingState: string;
  surname: string;
  givenNames: string;
  documentNumber: string;
  nationality: string;
  dateOfBirth: string;
  sex: "M" | "F" | "X" | "<";
  expiryDate: string;
  personalNumber?: string;
  optional?: string;
  optional2?: string;
}

export interface MrzOutput {
  format: MrzFormat;
  line1: string;
  line2: string;
  line3: string | null;
  fieldLengths: { line1: number; line2: number; line3: number };
  valid: boolean;
  errors: string[];
}

const DOC_CODE: Record<MrzFormat, string> = {
  TD1: "I<",
  TD2: "I<",
  TD3: "P<",
  MRVA: "V<",
  MRVB: "V<",
};

const LINE_LEN: Record<MrzFormat, number> = { TD1: 30, TD2: 36, TD3: 44, MRVA: 44, MRVB: 36 };

export function generateMRZ(input: MrzInput): MrzOutput {
  const errors: string[] = [];
  const fmt = input.format;
  const L = LINE_LEN[fmt];

  const state = pad(input.issuingState, 3).slice(0, 3);
  const nationality = pad(input.nationality, 3).slice(0, 3);
  const sex = input.sex === "F" ? "F" : input.sex === "M" ? "M" : "<";
  const dob = dateToMrz(input.dateOfBirth);
  const exp = dateToMrz(input.expiryDate);
  if (!dob) errors.push("Invalid date of birth (use YYYY-MM-DD)");
  if (!exp) errors.push("Invalid expiry date (use YYYY-MM-DD)");

  let line1 = "";
  let line2 = "";
  let line3: string | null = null;

  if (fmt === "TD3" || fmt === "MRVA" || fmt === "MRVB") {
    const nameLen = L - 5;
    line1 = DOC_CODE[fmt] + state + nameField(input.surname, input.givenNames, nameLen);

    const docNum = pad(input.documentNumber, 9).slice(0, 9);
    const docNumCd = checkDigit(docNum);
    const dobS = dob ?? "000000";
    const dobCd = checkDigit(dobS);
    const expS = exp ?? "000000";
    const expCd = checkDigit(expS);

    if (fmt === "MRVB") {
      const optional = pad(input.optional ?? "", 8);
      line2 =
        docNum +
        docNumCd +
        nationality +
        dobS +
        dobCd +
        sex +
        expS +
        expCd +
        optional;
    } else {
      const personalNumber = pad(input.personalNumber ?? "", 14);
      const pnCd = checkDigit(personalNumber);
      const body =
        docNum +
        docNumCd +
        nationality +
        dobS +
        dobCd +
        sex +
        expS +
        expCd +
        personalNumber +
        pnCd;
      if (fmt === "TD3") {
        const compositeInput = body.slice(0, 10) + body.slice(13, 20) + body.slice(21, 43);
        line2 = body + String(checkDigit(compositeInput));
      } else {
        line2 = body;
      }
    }
  } else if (fmt === "TD2") {
    line1 = DOC_CODE[fmt] + state + nameField(input.surname, input.givenNames, 31);
    const docNum = pad(input.documentNumber, 9).slice(0, 9);
    const docNumCd = checkDigit(docNum);
    const dobS = dob ?? "000000";
    const dobCd = checkDigit(dobS);
    const expS = exp ?? "000000";
    const expCd = checkDigit(expS);
    const optional = pad(input.optional ?? "", 7);
    const body =
      docNum +
      docNumCd +
      nationality +
      dobS +
      dobCd +
      sex +
      expS +
      expCd +
      optional;
    const compositeInput = body.slice(0, 10) + body.slice(13, 20) + body.slice(21, 35);
    line2 = body + String(checkDigit(compositeInput));
  } else if (fmt === "TD1") {
    const docNum = pad(input.documentNumber, 9).slice(0, 9);
    const docNumCd = checkDigit(docNum);
    const optional1 = pad(input.optional ?? "", 15);
    line1 = DOC_CODE[fmt] + state + docNum + docNumCd + optional1;
    const dobS = dob ?? "000000";
    const dobCd = checkDigit(dobS);
    const expS = exp ?? "000000";
    const expCd = checkDigit(expS);
    const optional2 = pad(input.optional2 ?? "", 11);
    const body2 = dobS + dobCd + sex + expS + expCd + nationality + optional2;
    const compositeInput =
      line1.slice(5, 30) + body2.slice(0, 7) + body2.slice(8, 15) + body2.slice(18, 29);
    line2 = body2 + String(checkDigit(compositeInput));
    line3 = nameField(input.surname, input.givenNames, 30);
  }

  line1 = pad(line1, L);
  line2 = pad(line2, L);
  if (line3) line3 = pad(line3, L);

  return {
    format: fmt,
    line1,
    line2,
    line3,
    fieldLengths: { line1: line1.length, line2: line2.length, line3: line3 ? line3.length : 0 },
    valid: errors.length === 0,
    errors,
  };
}

