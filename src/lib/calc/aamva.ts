/**
 * AAMVA DL/ID Card Design Standard - PDF417 data file builder.
 *
 * Builds the plain-text AAMVA barcode subfile (Annex D structure) that is then
 * encoded into a PDF417 symbol by a real encoding library (bwip-js).
 *
 * Structure (per AAMVA Annex D / benhovinga reference parser):
 *   [21-byte header][10-byte subfile designator][elements, each LF-terminated][CR]
 *   Header = @ + LF(0x0A) + RS(0x1E) + CR(0x0D) + "ANSI " + IIN(6) +
 *            version(2) + jurisdictionVersion(2) + numberOfEntries(2)
 *
 * Confirmed element codes: DAQ license number, DCS family name, DAC first name,
 * DAD middle names, DCU suffix, DBB date of birth (US: MMDDCCYY), DBC sex
 * (1=M, 2=F, 9=X), DBA expiry date, DBD issue date, DCF document discriminator,
 * DCG country (USA), DCA vehicle class, DCB restrictions, DCD endorsements,
 * DAG street, DAH street2, DAI city, DAJ state, DAK postal, DAU height,
 * DAY eye color, DDA compliance type (M/F/N).
 *
 * NOTE: This produces SYNTHETIC TEST DATA formatted to the AAMVA structure. It
 * is not a genuine government-issued credential and is not REAL ID authenticated.
 */

const LF = "\n";
const CR = "\r";
const RS = "\x1e";

export type AamvaDocType = "DL" | "ID";
export type AamvaVersion = "10" | "11" | "12";
export type AamvaSex = "M" | "F" | "X";
export type AamvaCompliance = "M" | "F" | "N";

export interface AamvaInput {
  documentType: AamvaDocType;
  jurisdiction: string;
  iin: string; // 6 digits
  aamvaVersion: AamvaVersion;
  jurisdictionVersion: string; // 2 digits
  licenseNumber: string; // DAQ
  familyName: string; // DCS
  firstName: string; // DAC
  middleName: string; // DAD
  nameSuffix: string; // DCU
  dateOfBirth: string; // YYYY-MM-DD
  sex: AamvaSex;
  eyeColor: string; // DAY
  height: string; // DAU
  street: string; // DAG
  street2: string; // DAH
  city: string; // DAI
  state: string; // DAJ
  postalCode: string; // DAK
  expirationDate: string; // YYYY-MM-DD
  issueDate: string; // YYYY-MM-DD
  documentDiscriminator: string; // DCF
  country: string; // DCG
  complianceType: AamvaCompliance; // DDA
  vehicleClass: string; // DCA
  restrictions: string; // DCB
  endorsements: string; // DCD
}

export interface AamvaField {
  code: string;
  label: string;
  value: string;
}

export interface AamvaOutput {
  raw: string; // the AAMVA text file content
  pdf417Text: string; // same as raw (what gets encoded)
  fields: AamvaField[];
  header: string;
  valid: boolean;
  errors: string[];
}

function sexCode(sex: AamvaSex): string {
  return { M: "1", F: "2", X: "9" }[sex];
}

// YYYY-MM-DD -> MMDDCCYY (US AAMVA date format)
function usDate(iso: string | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  return m[2] + m[3] + m[1]; // MMDDCCYY
}

function el(code: string, value: string): string {
  return code + value;
}

export function buildAamva(input: AamvaInput): AamvaOutput {
  const errors: string[] = [];

  const iin = (input.iin || "636000").slice(0, 6).padEnd(6, "0");
  const version = input.aamvaVersion || "11";
  const jurVer = (input.jurisdictionVersion || "01").slice(0, 2).padEnd(2, "0");
  const entries = "01";
  const docType = input.documentType || "DL";

  // 21-byte header
  const header =
    "@" + LF + RS + CR + "ANSI " + iin + version + jurVer + entries;
  if (header.length !== 21) errors.push("Header must be exactly 21 bytes");

  // Subfile designator (10 bytes): document type padded.
  const designator = (docType + "          ").slice(0, 10);

  const fields: AamvaField[] = [
    { code: "DAQ", label: "License / ID number", value: input.licenseNumber },
    { code: "DCS", label: "Family name", value: input.familyName },
    { code: "DAC", label: "First name", value: input.firstName },
    { code: "DAD", label: "Middle name(s)", value: input.middleName },
    { code: "DCU", label: "Name suffix", value: input.nameSuffix },
    { code: "DBB", label: "Date of birth", value: usDate(input.dateOfBirth) },
    { code: "DBC", label: "Sex", value: sexCode(input.sex) },
    { code: "DAY", label: "Eye color", value: input.eyeColor },
    { code: "DAU", label: "Height", value: input.height },
    { code: "DAG", label: "Street address 1", value: input.street },
    { code: "DAH", label: "Street address 2", value: input.street2 },
    { code: "DAI", label: "City", value: input.city },
    { code: "DAJ", label: "State / jurisdiction", value: input.state },
    { code: "DAK", label: "Postal code", value: input.postalCode },
    { code: "DBA", label: "Expiration date", value: usDate(input.expirationDate) },
    { code: "DBD", label: "Issue date", value: usDate(input.issueDate) },
    { code: "DCF", label: "Document discriminator", value: input.documentDiscriminator },
    { code: "DCG", label: "Country", value: input.country || "USA" },
    { code: "DDA", label: "Compliance type", value: input.complianceType },
    { code: "DCA", label: "Vehicle class", value: input.vehicleClass },
    { code: "DCB", label: "Restrictions", value: input.restrictions },
    { code: "DCD", label: "Endorsements", value: input.endorsements },
  ];

  const elementLines = fields.map((f) => el(f.code, f.value)).join(LF);
  const raw = header + designator + elementLines + LF + CR;

  return {
    raw,
    pdf417Text: raw,
    fields,
    header,
    valid: errors.length === 0,
    errors,
  };
}
