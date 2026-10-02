import sbuForms from "../../jsondata/SbuMobile.json";

type SbuFormRecord = {
  topic: string;
  formid: string;
  Icon: string;
  status: number;
};

export type LabForm = {
  formId: string;
  topic: string;
};

// SbuMobile.json has no lab field, so every lab shows the same forms.
const FORMS: LabForm[] = (sbuForms as SbuFormRecord[]).map((f) => ({
  formId: f.formid,
  topic: f.topic.trim(),
}));

export const getForms = () => FORMS;

export const findForm = (formId: string | undefined) =>
  FORMS.find((f) => f.formId === formId);
