export interface ValidationRule {
  check: (val: string) => boolean;
  message: string;
}

export interface ValidationResult {
  error: boolean;
  message: string;
}

export function isValid(rules: ValidationRule[], value: any): boolean {
  return !checkValidation(rules, value).error;
}

export function checkRule(rule: ValidationRule, value: any): boolean {
  return rule.check(value);
}

export function checkValidation(
  rules: ValidationRule[],
  value: any
): ValidationResult {
  const ruleResult = rules.find((rule) => checkRule(rule, value));
  return ruleResult
    ? { message: ruleResult.message, error: true }
    : { message: "No errors", error: false };
}
