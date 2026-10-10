const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 20;

function validateEmail(email) {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) return 'auth.validation.emailRequired';
  if (normalizedEmail.length > 254) return 'auth.validation.emailMaxLength';
  if (!EMAIL_PATTERN.test(normalizedEmail)) return 'auth.validation.emailInvalid';
  return undefined;
}

function validatePassword(password) {
  if (!password) return 'auth.validation.passwordRequired';
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return 'auth.validation.passwordLength';
  }
  return undefined;
}

export function validateLogin({ email, password }) {
  return {
    email: validateEmail(email),
    password: validatePassword(password),
  };
}

export function validateRegistration({
  name,
  email,
  avatarColor,
  password,
  passwordConfirmation,
  acceptedTerms,
}) {
  return {
    name: !name.trim() ? 'auth.validation.nameRequired' : name.trim().length > 50 ? 'auth.validation.nameMaxLength' : undefined,
    email: validateEmail(email),
    avatarColor: avatarColor ? undefined : 'auth.validation.avatarColorRequired',
    password: validatePassword(password),
    passwordConfirmation: !passwordConfirmation
      ? 'auth.validation.passwordConfirmationRequired'
      : passwordConfirmation === password
        ? undefined
        : 'auth.validation.passwordMismatch',
    acceptedTerms: acceptedTerms
      ? undefined
      : 'auth.validation.termsRequired',
  };
}

export function validateProfile({ name = '', email = '', avatarColor, password = '', passwordConfirmation = '' }) {
  const passwordError = password ? validatePassword(password) : undefined;
  const passwordConfirmationError = password && !passwordConfirmation
    ? 'auth.validation.newPasswordConfirmationRequired'
    : !password && passwordConfirmation
      ? 'auth.validation.newPasswordRequired'
      : password !== passwordConfirmation
        ? 'auth.validation.passwordMismatch'
        : undefined;

  return {
    name: !name.trim()
      ? 'auth.validation.nameRequired'
      : name.trim().length > 50
        ? 'auth.validation.nameMaxLength'
        : undefined,
    email: validateEmail(email),
    avatarColor: avatarColor ? undefined : 'auth.validation.avatarColorRequired',
    password: passwordError,
    passwordConfirmation: passwordConfirmationError,
  };
}

export function hasValidationErrors(errors) {
  return Object.values(errors).some(Boolean);
}
