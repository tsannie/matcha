import bcrypt from 'bcrypt';

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return 'Invalid email address.';
  }

  return null;
};

const validatePasswordComplexity = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  if (!passwordRegex.test(password)) {
    return 'Password must be at least 8 characters long, contain one uppercase, one lowercase, one number and one special character.';
  }

  return null;
};

export const validateRegistration = (email, username, password, firstname, lastname) => {
  if (!email || !username || !password || !firstname || !lastname) {
    return 'All fields are required.';
  }
  const invalidPassword = validatePasswordComplexity(password);
  const invalidEmail = validateEmail(email);
  if (invalidPassword) return invalidPassword;
  if (invalidEmail) return invalidEmail;

  return null;
};

export const validateResetPassword = (newPassword) => {
  if (!newPassword) {
    return 'Password is required.';
  }

  const invalidPassword = validatePasswordComplexity(newPassword);
  if (invalidPassword) return invalidPassword;

  return null;
};

export const hashPassword = async (plainPassword) => {
  const saltRounds = 10;
  return await bcrypt.hash(plainPassword, saltRounds);
};
