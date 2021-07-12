import { ref, computed, Ref, ComputedRef } from "vue";

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

interface ValidationProps {
  initialValue: any;
  rules: ValidationRule[];
}

export interface ValidationReturnValue {
  value: Ref<string>;
  error: Ref<boolean>;
  errorMessage: Ref<string>;
  validate: () => void;
  isValid: ComputedRef<boolean>
}

export function useValidation({
  initialValue = "",
  rules = [],
}: ValidationProps): ValidationReturnValue {
  const value = ref(initialValue);
  const error = ref(false);
  const errorMessage = ref("");
  const valRules = ref(rules);

  const validate = () => {
    const rule = checkValidation(valRules.value, value.value);
    error.value = rule.error;
    errorMessage.value = rule.message;
  };

  return {
    value,
    error,
    errorMessage,
    validate,
    isValid: computed(() => isValid(valRules.value, value.value)),
  };
}
