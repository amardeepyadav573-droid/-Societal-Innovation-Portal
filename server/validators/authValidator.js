import validator from "validator";

export const validatePassword = (password) => {
  if (
    typeof password !== "string" ||
    password.length < 8
  ) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain an uppercase letter.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain a lowercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must contain a number.";
  }

  if (!/[!@#$%^&*(),.?":{}|<>_\-\\[\]/;'`~+=]/.test(password)) {
    return "Password must contain a special character.";
  }

  return null;
};

export const validateEmail = (email) => {
  if (!email || !validator.isEmail(email)) {
    return "Valid email is required.";
  }

  return null;
};

export const validateOtp = (otp) => {
  if (
    typeof otp !== "string" ||
    !/^\d{6}$/.test(otp)
  ) {
    return "OTP must be 6 digits.";
  }

  return null;
};