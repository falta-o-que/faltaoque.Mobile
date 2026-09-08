import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    authService
      .restoreSession()
      .then((restoredAccount) => {
        if (isMounted) setAccount(restoredAccount);
      })
      .catch(() => {
        if (isMounted) setAccount(null);
      })
      .finally(() => {
        if (isMounted) setIsRestoringSession(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      account,
      isRestoringSession,
      login: async (credentials) => {
        const authenticatedAccount = await authService.login(credentials);
        setAccount(authenticatedAccount);
        return authenticatedAccount;
      },
      register: authService.register,
      completeRegistration: setAccount,
      logout: async () => {
        await authService.logout();
        setAccount(null);
      },
    }),
    [account, isRestoringSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}

