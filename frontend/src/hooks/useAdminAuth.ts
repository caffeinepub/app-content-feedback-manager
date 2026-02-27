import { useState, useEffect } from 'react';

const ADMIN_CODE = '7898';
const STORAGE_KEY = 'adminUnlocked';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY) === 'true';
    setIsAdmin(stored);
  }, []);

  const unlock = (code: string): boolean => {
    if (code === ADMIN_CODE) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setIsAdmin(true);
      setError('');
      return true;
    } else {
      setError('Incorrect code, try again');
      return false;
    }
  };

  const lock = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setIsAdmin(false);
    setError('');
  };

  return { isAdmin, unlock, lock, error, setError };
}
