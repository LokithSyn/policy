export interface StepError {
  field: string;
  message: string;
  code?: string;
}

export interface StepWarning {
  field: string;
  message: string;
}

export interface StepResult {
  passed: boolean;
  errors: StepError[];
  warnings: StepWarning[];
  data?: Record<string, unknown>;
}
