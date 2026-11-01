import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import * as authService from '../services/authService';
import { setNotificationSession } from '../services/notificationService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    authService
      .restoreSession()
      .then((restoredAccount) => {
        if (isMounted) { setNotificationSession(restoredAccount?.id); setAccount(restoredAccount); }
      })
      .catch(() => {
        if (isMounted) { setNotificationSession(null); setAccount(null); }
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
        setNotificationSession(authenticatedAccount.id);
        setAccount(authenticatedAccount);
        return authenticatedAccount;
      },
      register: authService.register,
      completeRegistration: (registeredAccount) => { setNotificationSession(registeredAccount?.id); setAccount(registeredAccount); },
      updateProfile: async (profile) => {
        if (!account?.id) throw new Error('ACCOUNT_NOT_FOUND');
        const updatedAccount = await authService.updateProfile({ ...profile, accountId: account.id });
        setAccount(updatedAccount);
        return updatedAccount;
      },
      logout: async () => {
        await authService.logout();
        setNotificationSession(null);
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

