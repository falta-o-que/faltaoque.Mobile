const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 20;

function validateEmail(email) {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) return 'Informe o e-mail.';
  if (!EMAIL_PATTERN.test(normalizedEmail)) return 'Informe um e-mail válido.';
  return undefined;
}

function validatePassword(password) {
  if (!password) return 'Informe a senha.';
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return 'A senha deve ter entre 8 e 20 caracteres.';
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
    name: name.trim() ? undefined : 'Informe o nome.',
    email: validateEmail(email),
    avatarColor: avatarColor ? undefined : 'Escolha uma cor para o avatar.',
    password: validatePassword(password),
    passwordConfirmation: !passwordConfirmation
      ? 'Confirme a senha.'
      : passwordConfirmation === password
        ? undefined
        : 'As senhas não coincidem.',
    acceptedTerms: acceptedTerms
      ? undefined
      : 'Aceite os Termos de Uso e a Política de Privacidade.',
  };
}

export function hasValidationErrors(errors) {
  return Object.values(errors).some(Boolean);
}
