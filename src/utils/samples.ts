import type {
  SampleDataTypes,
  SampleHeaderData,
  TrnSampleParam,
  TrnSampleTypes,
} from "@/types/DataTypes";

// ─── Normalizing ──────────────────────────────────────────────────────────────

/**
 * FOR JSON leaves out columns that are NULL, so any field can be missing.
 * Every sample is filled in here so screens can rely on the types: missing
 * text becomes "", numbers null, flags false and HeaderData [].
 */
const STRING_FIELDS = [
  "Id",
  "CompanyId",
  "SampleId",
  "LocationId",
  "PlantId",
  "UnitId",
  "SubUnitId",
  "Name",
  "Description",
  "SampleFormat",
  "SampleType",
  "SampleFrequency",
  "MaterialCategory",
  "AnalysisCode",
  "CreatedBy",
  "CreatedOn",
  "F_Year",
  "PlantName",
  "PlantCode",
  "UnitName",
  "SubUnitName",
] as const satisfies readonly (keyof SampleDataTypes)[];

const NUMBER_FIELDS = [
  "RetentionPeriod",
  "ReportingTime",
  "Status",
] as const satisfies readonly (keyof SampleDataTypes)[];

const BOOLEAN_FIELDS = [
  "IsAutoReceive",
  "AutoHandover",
  "WeighableOnHandover",
  "IsBionetricOnHandover",
  "IsAutoDispose",
] as const satisfies readonly (keyof SampleDataTypes)[];

const toText = (value: unknown) =>
  typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";

const toNumber = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

// SQL bit columns arrive as true/false or 1/0.
const toBoolean = (value: unknown) => value === true || value === 1 || value === "1" || value === "true";

/**
 * HeaderData can arrive as an array or as a JSON string of one, depending on
 * the API, so accept both and drop anything that isn't a parameter object.
 */
export const parseHeaderData = (raw: unknown): SampleHeaderData[] => {
  let value = raw;
  if (typeof value === "string") {
    if (value.trim() === "") return [];
    try {
      value = JSON.parse(value);
    } catch {
      console.warn("HeaderData is not valid JSON", raw);
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is SampleHeaderData => typeof item === "object" && item !== null
  );
};

const normalizeSample = (raw: Record<string, unknown>): SampleDataTypes => {
  const sample = { ...raw } as Record<string, unknown>;
  for (const key of STRING_FIELDS) sample[key] = toText(raw[key]);
  for (const key of NUMBER_FIELDS) sample[key] = toNumber(raw[key]);
  for (const key of BOOLEAN_FIELDS) sample[key] = toBoolean(raw[key]);
  sample.HeaderData = parseHeaderData(raw.HeaderData);
  return sample as unknown as SampleDataTypes;
};

/** A name to show for a sample, even when Name is empty. */
export const sampleTitle = (sample: SampleDataTypes) =>
  sample.Name || sample.SampleId || "Unnamed sample";

/**
 * SQL Server's FOR JSON returns the JSON as text in a column named
 * "JSON_F52E2B61-18A1-11d1-B105-00805F49916B", e.g.
 *   [{ "JSON_F52E2B61-...": "[{\"Id\":\"A9C9...\", ...}]" }]
 * Long results are split across several rows (about 2,000 characters each),
 * so the pieces must be joined in order before parsing.
 */
const FOR_JSON_COLUMN = /^JSON_[0-9A-F]{8}-/i;

/** The FOR JSON text if `value` is that shape, otherwise null. */
const joinForJsonRows = (value: unknown): string | null => {
  const rows = Array.isArray(value) ? value : [value];
  if (!rows.length) return null;
  let text = "";
  for (const row of rows) {
    if (typeof row !== "object" || row === null) return null;
    const entries = Object.entries(row);
    if (entries.length !== 1) return null;
    const [key, chunk] = entries[0];
    if (!FOR_JSON_COLUMN.test(key) || typeof chunk !== "string") return null;
    text += chunk;
  }
  return text;
};

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

/**
 * The sample methods (SampleAll, TrnSampledata) don't always return a list:
 * it can be empty, an object, a JSON string or SQL Server FOR JSON rows.
 * Returns the list's objects; anything else becomes an empty list.
 */
const parseApiList = (res: unknown, method: string): Record<string, unknown>[] => {
  let value = res;
  // A few rounds cover nesting such as a JSON string holding FOR JSON rows.
  for (let i = 0; i < 3; i++) {
    if (typeof value === "string") {
      // FOR JSON sends an empty string when there are no rows.
      value = value.trim() === "" ? [] : parseJson(value);
      continue;
    }
    const forJson = joinForJsonRows(value);
    if (forJson === null) break;
    value = forJson.trim() === "" ? [] : parseJson(forJson);
  }

  if (!Array.isArray(value)) {
    if (value != null) console.warn(`${method} returned an unexpected response`, res);
    else if (res != null) console.warn(`${method} returned invalid JSON`);
    return [];
  }
  return value.filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null && !Array.isArray(item)
  );
};

/** Sample master records (SampleAll). */
export const toSampleList = (res: unknown, method = "SampleAll"): SampleDataTypes[] =>
  parseApiList(res, method).map(normalizeSample);

// ─── TrnSampledata ────────────────────────────────────────────────────────────

const TRN_STRING_FIELDS = [
  "Id",
  "SampleCode",
  "Sample_Id",
  "Company",
  "Location_Id",
  "Plant_Id",
  "Dept_Id",
  "Sub_deptId",
  "F_Year",
  "Shift",
  "Doc_Date",
  "DateTime",
  "SampleCollectionDate",
  "RegisteredBy",
  "RegisteredOn",
  "ReceivedBy",
  "ReceivedOn",
  "AssignedTo",
  "AssignedOn",
  "AssignedTo2",
  "AssignedOn2",
  "AnalystBy",
  "AnalystOn",
  "PublishedBy",
  "PublishedOn",
] as const satisfies readonly (keyof TrnSampleTypes)[];

/** Parameter list from an array or a JSON string of one (Data, HeaderData). */
const parseParams = (raw: unknown): TrnSampleParam[] =>
  parseHeaderData(raw) as unknown as TrnSampleParam[];

const normalizeTrnSample = (raw: Record<string, unknown>): TrnSampleTypes => {
  const sample = { ...raw } as Record<string, unknown>;
  for (const key of TRN_STRING_FIELDS) sample[key] = toText(raw[key]);
  sample.Status = toNumber(raw.Status);
  sample.PrintCount = toNumber(raw.PrintCount);
  sample.IsPrinted = toBoolean(raw.IsPrinted);
  sample.Data = parseParams(raw.Data);
  sample.HeaderData = parseParams(raw.HeaderData);
  return sample as unknown as TrnSampleTypes;
};

/** Registered samples (TrnSampledata). */
export const toTrnSampleList = (res: unknown, method = "TrnSampledata"): TrnSampleTypes[] =>
  parseApiList(res, method).map(normalizeTrnSample);

/** When the sample was registered; used for sorting and display. */
export const trnSampleDate = (sample: TrnSampleTypes) =>
  sample.RegisteredOn || sample.DateTime || sample.SampleCollectionDate || sample.Doc_Date;

export type TrnSampleStage = "Registered" | "Received" | "Assigned" | "Analysed" | "Published";

/**
 * How far the sample has got, from the furthest step that has a time.
 * (Status is a numeric code whose meanings aren't known to the app yet.)
 */
export const trnSampleStage = (sample: TrnSampleTypes): TrnSampleStage => {
  if (sample.PublishedOn) return "Published";
  if (sample.AnalystOn) return "Analysed";
  if (sample.AssignedOn || sample.AssignedOn2) return "Assigned";
  if (sample.ReceivedOn) return "Received";
  return "Registered";
};

/**
 * Parameters to show: those marked IsVisible (when Attributes are sent),
 * ordered by Seq.
 */
export const visibleParams = (params: TrnSampleParam[]) =>
  params
    .filter((p) => !Array.isArray(p.Attributes) || p.Attributes.includes("IsVisible"))
    .sort((a, b) =>
      String(a.Seq ?? "").localeCompare(String(b.Seq ?? ""), undefined, { numeric: true })
    );
