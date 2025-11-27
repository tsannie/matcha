import bcrypt from 'bcrypt';
import zxcvbn from 'zxcvbn';

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return 'Invalid email address.';
  }

  return null;
};

export const validatePasswordComplexity = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return 'Password must be at least 8 characters long, contain one uppercase, one lowercase, one number and one special character.';
  }

  const evaluation = zxcvbn(password);

  if (evaluation.score < 3) {
    const feedback = evaluation.feedback.warning || 'Password is too common or easy to guess.';
    return `Weak password: ${feedback}`;
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
