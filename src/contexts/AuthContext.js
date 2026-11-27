import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';

import * as authService from '../services/authService';
import {setNotificationSession} from '../services/notificationService';
import SessionRestoreError from './SessionRestoreError';

const AuthContext = createContext(null);

export function AuthProvider({children}) {
    const [account, setAccount] = useState(null);
    const [isRestoringSession, setIsRestoringSession] = useState(true);
    const [sessionRestoreError, setSessionRestoreError] = useState(false);
    const [restoreAttempt, setRestoreAttempt] = useState(0);

    useEffect(() => {
        let isMounted = true;

        authService
            .restoreSession()
            .then((restoredAccount) => {
                if (isMounted) {
                    setNotificationSession(restoredAccount?.id);
                    setAccount(restoredAccount);
                    setSessionRestoreError(false);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setSessionRestoreError(true);
                }
            })
            .finally(() => {
                if (isMounted) setIsRestoringSession(false);
            });

        return () => {
            isMounted = false;
        };
    }, [restoreAttempt]);

    const retrySessionRestore = useCallback(() => {
        setSessionRestoreError(false);
        setIsRestoringSession(true);
        setRestoreAttempt((attempt) => attempt + 1);
    }, []);

    const value = useMemo(() => ({
        account, isRestoringSession, retrySessionRestore, sessionRestoreError, login: async (credentials) => {
            const authenticatedAccount = await authService.login(credentials);
            setNotificationSession(authenticatedAccount.id);
            setAccount(authenticatedAccount);
            return authenticatedAccount;
        }, register: authService.register, completeRegistration: (registeredAccount) => {
            setNotificationSession(registeredAccount?.id);
            setAccount(registeredAccount);
        }, updateProfile: async (profile) => {
            if (!account?.id) throw new Error('ACCOUNT_NOT_FOUND');
            const updatedAccount = await authService.updateProfile({...profile, accountId: account.id});
            setAccount(updatedAccount);
            return updatedAccount;
        }, logout: async () => {
            await authService.logout();
            setNotificationSession(null);
            setAccount(null);
        },
    }), [account, isRestoringSession, retrySessionRestore, sessionRestoreError],);

    return (<AuthContext.Provider value={value}>
        {sessionRestoreError && !isRestoringSession ?
            <SessionRestoreError onRetry={retrySessionRestore}/> : children}
    </AuthContext.Provider>);
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth deve ser usado dentro de AuthProvider.');
    }

    return context;
}

