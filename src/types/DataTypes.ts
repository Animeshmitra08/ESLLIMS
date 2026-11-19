export interface LocationData {
  TelNO: string;
  Email: string;
  Website: string;
  Address: string;
  status: string;
  SampleReassessmentPeriod: string;
}

export interface LocationTypes {
  CompanyId: string;
  CreatedBy: string;
  CreatedOn: string;
  Data: LocationData;
  Description: string;
  ID: string;
  NABL_LOGO: string;
  Name: string;
  Prefix: string;
  ULR_NO: string;
}

// Only the fields used so far; add the rest from the PlantAct response.
export interface PlantTypes {
  ID: string;
  LocationId: string;
  Name: string;
  Description: string;
  PlantCode: string;
  ProductionCategory: string;
  CreatedOn: string;
  CreatedBy: string;
}

// Only the fields used so far; add the rest from the SBUMasterACT response.
export interface SBUTypes {
  Id: string;
  PlantId: string;
  Name: string;
  Description: string;
  CreatedOn: string;
  CreatedBy: string;
}

export interface SubSbuTypes {
  Id: string;
  DeptId: string;
  Name: string;
  Description: string;
  CreatedOn: string;
  CreatedBy: string;
  Status: number;
}





// ─── TrnSampledata ────────────────────────────────────────────────────────────
// A registered sample (one per sample code), as returned by TrnSampledata.
// Records go through toTrnSampleList (utils/samples), which fills in fields
// the API leaves out and parses Data/HeaderData, so these types always hold.

/** One parameter reading in a sample's Data. */
export interface TrnSampleParam {
  Param: string;
  Tag: string;
  /** null until entered (Manual) or calculated (Calculated). */
  Value: number | string | null;
  Uom: string;
  Min: number | null;
  Max: number | null;
  Seq: number | string | null;
  /** "Manual" or "Calculated". */
  Source?: string;
  Precision?: number | null;
  DataType?: string;
  /** e.g. "IsVisible", "IsCritical", "IsExternalExpose". */
  Attributes?: string[];
  PublishedBy?: string;
  PublishedOn?: string;
}

export interface TrnSampleTypes {
  Id: string;
  /** Human-readable code, e.g. "CLB2BG20261119002". */
  SampleCode: string;
  /** The sample master record this was registered from. */
  Sample_Id: string;
  Company: string;
  Location_Id: string;
  Plant_Id: string;
  /** The lab (SBU) Id. */
  Dept_Id: string;
  /** The sub-SBU (form) Id. */
  Sub_deptId: string;

  F_Year: string;
  Shift: string;
  Status: number | null;

  Doc_Date: string;
  DateTime: string;
  SampleCollectionDate: string;
  RegisteredBy: string;
  RegisteredOn: string;
  ReceivedBy: string;
  ReceivedOn: string;
  AssignedTo: string;
  AssignedOn: string;
  AssignedTo2: string;
  AssignedOn2: string;
  AnalystBy: string;
  AnalystOn: string;
  PublishedBy: string;
  PublishedOn: string;

  IsPrinted: boolean;
  PrintCount: number | null;

  /** Parameter readings, parsed from the JSON string the API sends. */
  Data: TrnSampleParam[];
  HeaderData: TrnSampleParam[];
}

// SampleData Types (SampleAll). Samples go through toSampleList (utils/samples), which
// fills in fields the API leaves out, so these types hold for every sample.
export interface SampleHeaderData {
  Param: string;
  Tag: string;
  Sap: string | null;
  Value: string;
  Uom: string;
  Min: number | null;
  Max: number | null;
  Seq: string;
  Precision: number | null;
  DataType: string;
  SpecialAttributes: string[];
  ReportAttributes: string[];
  PublishedBy: string;
  PublishedOn: string;
}

export interface SampleDataTypes {
  Id: string;
  CompanyId: string;
  SampleId: string;
  LocationId: string;
  PlantId: string;
  UnitId: string;
  SubUnitId: string;

  Name: string;
  Description: string;
  SampleFormat: string;
  SampleType: string;
  SampleFrequency: string;
  MaterialCategory: string;

  HeaderData: SampleHeaderData[];

  AnalysisCode: string;

  IsAutoReceive: boolean;
  AutoHandover: boolean;
  WeighableOnHandover: boolean;
  IsBionetricOnHandover: boolean;

  // null when the API leaves them out (FOR JSON drops NULL columns).
  RetentionPeriod: number | null;
  ReportingTime: number | null;

  CreatedBy: string;
  CreatedOn: string;
  Status: number | null;

  F_Year: string;

  IsAutoDispose: boolean;

  PlantName: string;
  PlantCode: string;
  UnitName: string;
  SubUnitName: string;
}