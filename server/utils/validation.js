import bcrypt from 'bcrypt';
import zxcvbn from 'zxcvbn';

/* --- HELPERS --- */

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

export const hashPassword = async (plainPassword) => {
  const saltRounds = 10;
  return await bcrypt.hash(plainPassword, saltRounds);
};

const validateBirthdate = (birthdate, required = false) => {
  if (!birthdate) return required ? 'Date of birth is required.' : null;

  const date = new Date(birthdate);
  if (isNaN(date.getTime())) {
    return 'Invalid birthdate format.';
  }

  const today = new Date();
  const age = Math.floor((today - date) / (365.25 * 24 * 60 * 60 * 1000));

  if (age < 18) {
    return 'You must be at least 18 years old.';
  }
  if (age > 120) {
    return 'Invalid birthdate.';
  }

  return null;
};

/* --- AUTH VALIDATION --- */

export const validateRegistration = (email, username, password, firstname, lastname, birthdate) => {
  if (!email || !username || !password || !firstname || !lastname || !birthdate) {
    return 'All fields are required.';
  }
  const invalidPassword = validatePasswordComplexity(password);
  const invalidEmail = validateEmail(email);
  const invalidBirthdate = validateBirthdate(birthdate, true);
  if (invalidPassword) return invalidPassword;
  if (invalidEmail) return invalidEmail;
  if (invalidBirthdate) return invalidBirthdate;

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

/* --- PROFILE VALIDATION --- */

export const validateProfileUpdate = (data) => {
  const { gender, sexual_preference, birthdate, biography, latitude, longitude } = data;

  const validGenders = ['male', 'female'];
  if (gender && !validGenders.includes(gender)) {
    return `Invalid gender. Allowed values: ${validGenders.join(', ')}`;
  }

  const validPreferences = ['heterosexual', 'homosexual', 'bisexual'];
  if (sexual_preference && !validPreferences.includes(sexual_preference)) {
    return `Invalid sexual preference. Allowed values: ${validPreferences.join(', ')}`;
  }

  const birthdateError = validateBirthdate(birthdate);
  if (birthdateError) return birthdateError;

  if (biography && biography.length > 500) {
    return 'Biography is too long (max 500 characters).';
  }

  if (latitude !== undefined && latitude !== null) {
    const lat = parseFloat(latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return 'Invalid latitude. Must be between -90 and 90.';
    }
  }

  if (longitude !== undefined && longitude !== null) {
    const lon = parseFloat(longitude);
    if (isNaN(lon) || lon < -180 || lon > 180) {
      return 'Invalid longitude. Must be between -180 and 180.';
    }
  }

  return null;
};

export const validateTag = (tag) => {
  const tagTrimmed = tag.trim();
  if (typeof tag !== 'string' || tagTrimmed === '') {
    return 'Tag must be a non-empty string.';
  }
  if (tagTrimmed.length > 20) {
    return 'Tag is too long (max 20 characters).';
  }
  if (tagTrimmed.length < 2) {
    return 'Tag is too short (min 2 characters).';
  }
  return null;
};

export const validateTags = (tags) => {
  if (!Array.isArray(tags)) {
    return 'Tags must be an array.';
  }
  for (const tag of tags) {
    const error = validateTag(tag);
    if (error) return error;
  }
  return null;
};
