export const passwordRules = {
  minLength: 8,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special:
    /[!@#$%^&*(),.?":{}|<>_\-\\[\]/;'`~+=]/,
};

export const validatePassword =
  (password) => {
    const errors = [];

    if (
      password.length <
      passwordRules.minLength
    ) {
      errors.push(
        "At least 8 characters"
      );
    }

    if (
      !passwordRules.uppercase.test(
        password
      )
    ) {
      errors.push(
        "One uppercase letter"
      );
    }

    if (
      !passwordRules.lowercase.test(
        password
      )
    ) {
      errors.push(
        "One lowercase letter"
      );
    }

    if (
      !passwordRules.number.test(
        password
      )
    ) {
      errors.push(
        "One number"
      );
    }

    if (
      !passwordRules.special.test(
        password
      )
    ) {
      errors.push(
        "One special character"
      );
    }

    return errors;
  };

export const isValidEmail =
  (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );