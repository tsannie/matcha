export const validateRegistration = (email, username, password, firstname, lastname) => {
  if (!email || !username || !password || !firstname || !lastname) {
    return 'All fields are required.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email address.';
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return 'Password must be at least 8 characters long, contain one uppercase, one lowercase, one number and one special character.';
  }

  return null;
};
