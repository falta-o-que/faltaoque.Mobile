import shared from './catalogs/shared';
import auth from './catalogs/auth';
import pantry from './catalogs/pantry';
import shopping from './catalogs/shopping';
import notifications from './catalogs/notifications';

const catalogues = [shared, auth, pantry, shopping, notifications];
const languages = ['pt-BR', 'en', 'es'];
const messages = Object.fromEntries(languages.map((language) => [
  language,
  Object.assign({}, ...catalogues.map((catalogue) => catalogue[language] ?? {})),
]));

export function translate(language, key, values = {}) {
  const template = messages[language]?.[key] ?? messages['pt-BR']?.[key] ?? key;
  return Object.entries(values).reduce(
    (result, [name, value]) => result.replaceAll(`{{${name}}}`, String(value)),
    template,
  );
}

export { languages };
