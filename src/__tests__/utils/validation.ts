import { useValidation, ValidationReturnValue } from "@/utils/validation";

describe('Validation hook', () => {
  let password: ValidationReturnValue;

  beforeEach(() => {
    password = useValidation({
      initialValue: '',
      rules: [
        {
          check: (val) => val.length === 0,
          message: "Password should not be empty"
        },
        {
          check: (val) => val.length < 8,
          message: "Password must be atleast 8 characters long"
        },
        {
          check: (val) => !(/[a-zA-Z]/.test(val) && /[0-9]/.test(val)),
          message: "Password should be 8 or more characters and contain at least one number"
        }
      ]
    });
  })

  test('Check if error are thrown', () => {
    expect(password.value.value).toBe("");
    expect(password.error.value).toBe(false);
    expect(password.errorMessage.value).toBe("");

    password.validate();

    expect(password.value.value).toBe("");
    expect(password.error.value).toBe(true);
    expect(password.errorMessage.value).toBe("Password should not be empty");

    password.value.value = "test"

    password.validate();

    expect(password.value.value).toBe("test");
    expect(password.error.value).toBe(true);
    expect(password.errorMessage.value).toBe("Password must be atleast 8 characters long");

    password.value.value = "testtest"

    password.validate();

    expect(password.value.value).toBe("testtest");
    expect(password.error.value).toBe(true);
    expect(password.errorMessage.value).toBe("Password should be 8 or more characters and contain at least one number");
  });

  test('Check if password is correct', () => {
    expect(password.value.value).toBe("");
    expect(password.error.value).toBe(false);
    expect(password.errorMessage.value).toBe("");

    password.value.value = "test1234"

    password.validate();

    expect(password.value.value).toBe("test1234");
    expect(password.error.value).toBe(false);
    expect(password.errorMessage.value).toBe("No errors");
  });

  test('Check if isValid works', () => {
    expect(password.value.value).toBe("");
    expect(password.error.value).toBe(false);
    expect(password.errorMessage.value).toBe("");

    password.value.value = "test"

    expect(password.isValid.value).toBe(false);

    expect(password.value.value).toBe("test");
    expect(password.error.value).toBe(false);
    expect(password.errorMessage.value).toBe("");

    password.value.value = "test1234"

    expect(password.isValid.value).toBe(true);

    expect(password.value.value).toBe("test1234");
    expect(password.error.value).toBe(false);
    expect(password.errorMessage.value).toBe("");
  });

  test('Without rules', () => {
    password = useValidation({
      initialValue: 'hello',
      rules: []
    });

    expect(password.isValid.value).toBe(true);
    expect(password.value.value).toBe("hello");
  })
});