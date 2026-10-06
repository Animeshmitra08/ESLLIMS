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





// SampleData Types
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

  RetentionPeriod: number;
  ReportingTime: number;

  CreatedBy: string;
  CreatedOn: string;
  Status: number;

  F_Year: string;

  IsAutoDispose: boolean;

  PlantName: string;
  PlantCode: string;
  UnitName: string;
  SubUnitName: string;
}