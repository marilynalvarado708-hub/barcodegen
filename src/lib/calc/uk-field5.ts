/**
 * UK Great Britain DVLA photocard driving licence - Field 5 (driver number)
 * calculation service.
 *
 * Documented format (16 characters), per DVLA / published references:
 *   1-5   First five letters of surname, padded with "9" if shorter
 *   6     Decade digit of birth year (1964 => 6)
 *   7-8   Birth month (men 01-12, women 51-62 i.e. +50 for women)
 *   9-10  Day of month of birth
 *   11    Final digit of birth year (1964 => 4)
 *   12-13 First letters of first and middle names ("9" if no middle name)
 *   14    Arbitrary digit, almost always "9"
 *   15-16 Computer check characters (DVLA checksum algorithm is NOT published)
 *
 * Surname normalisation: uppercase; Mac/Mc => MC; apostrophes and hyphens dropped.
 *
 * NOTE: Positions 15-16 cannot be reproduced because the DVLA does not publish
 * the check-character algorithm. They are shown as placeholders. This tool
 * produces a format example only - it is NOT a genuine DVLA licence number and
 * is NOT proof of a valid licence.
 */

export interface UkField5Input {
  surname: string;
  firstName: string;
  middleName?: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: "M" | "F";
}

export interface UkField5Field {
  label: string;
  positions: string;
  value: string;
  description: string;
}

export interface UkField5Output {
  field5: string; // 16 chars, positions 15-16 are placeholders
  calculatedPart: string; // positions 1-14
  breakdown: UkField5Field[];
  valid: boolean;
  errors: string[];
}

function normalizeSurname(s: string): string {
  let t = s.toUpperCase().replace(/['-]/g, "");
  t = t.replace(/\bMAC\b/g, "MC").replace(/\bMC\b/g, "MC");
  // Handle "Mac" / "Mc" prefixes followed by a letter: MacDonald -> MCDONALD
  t = t.replace(/^MAC(?=[A-Z])/g, "MC").replace(/^MC(?=[A-Z])/g, "MC");
  return t.replace(/[^A-Z]/g, "");
}

function twoDigits(n: number): string {
  return String(n).padStart(2, "0");
}

export function calculateUkField5(input: UkField5Input): UkField5Output {
  const errors: string[] = [];

  if (!input.surname.trim()) errors.push("Surname is required");
  if (!input.firstName.trim()) errors.push("First name is required");
  if (!input.dateOfBirth) errors.push("Date of birth is required");

  const dobM = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.dateOfBirth);
  if (!dobM) errors.push("Date of birth must be YYYY-MM-DD");

  const surname = normalizeSurname(input.surname);
  const part1 = (surname.slice(0, 5) + "99999").slice(0, 5);

  const year = dobM ? dobM[1] : "0000";
  const month = dobM ? parseInt(dobM[2], 10) : 0;
  const day = dobM ? parseInt(dobM[3], 10) : 0;

  const decadeDigit = year[2] ?? "0";
  const monthField = twoDigits(input.gender === "F" ? month + 50 : month);
  const dayField = twoDigits(day);
  const finalYearDigit = year[3] ?? "0";

  const firstInitial = input.firstName.trim() ? input.firstName.trim()[0].toUpperCase() : "9";
  const middleInitial = input.middleName?.trim() ? input.middleName.trim()[0].toUpperCase() : "9";
  const initials = firstInitial + middleInitial;
  const arbitrary = "9";

  const calculatedPart = part1 + decadeDigit + monthField + dayField + finalYearDigit + initials + arbitrary; // 14 chars
  // Positions 15-16 are the DVLA's unpublished check characters -> placeholders.
  const checkPlaceholders = "<<";
  const field5 = calculatedPart + checkPlaceholders; // 16 chars

  const breakdown: UkField5Field[] = [
    { label: "Surname (first 5, padded with 9)", positions: "1-5", value: part1, description: "Normalised surname, max 5 letters, short names padded with 9" },
    { label: "Decade digit of birth year", positions: "6", value: decadeDigit, description: "Third digit of the 4-digit birth year" },
    { label: "Birth month (+50 if female)", positions: "7-8", value: monthField, description: "Men 01-12; women add 50 (51-62)" },
    { label: "Day of month", positions: "9-10", value: dayField, description: "Zero-padded day of birth" },
    { label: "Final digit of birth year", positions: "11", value: finalYearDigit, description: "Fourth digit of the 4-digit birth year" },
    { label: "First and middle initials", positions: "12-13", value: initials, description: "First letters of first and middle names; 9 if none" },
    { label: "Arbitrary digit", positions: "14", value: arbitrary, description: "Almost always 9" },
    { label: "Check characters (unpublished)", positions: "15-16", value: checkPlaceholders, description: "DVLA check-character algorithm is not publicly published" },
  ];

  return {
    field5,
    calculatedPart,
    breakdown,
    valid: errors.length === 0,
    errors,
  };
}
