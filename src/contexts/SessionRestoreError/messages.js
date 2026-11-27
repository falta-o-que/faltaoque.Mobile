const messages = {
    'pt-BR': {
        title: 'Não foi possível restaurar sua sessão',
        description: 'Verifique sua conexão e tente novamente. Seus dados de sessão foram mantidos.',
    }, en: {
        title: 'Could not restore your session',
        description: 'Check your connection and try again. Your session data was kept.',
    }, es: {
        title: 'No se pudo restaurar tu sesión',
        description: 'Comprueba tu conexión e inténtalo de nuevo. Los datos de tu sesión se conservaron.',
    },
};

export function getSessionRestoreMessages(language) {
    return messages[language] ?? messages['pt-BR'];
}
