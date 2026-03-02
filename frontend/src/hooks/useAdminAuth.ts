import { useState, useEffect } from 'react';

const ADMIN_CODE = '7898';

interface AdminAuthState {
  isUnlocked: boolean;
  error: string | null;
  isLoading: boolean;
}

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    isUnlocked: false,
    error: null,
    isLoading: false,
  });

  // Restore admin state from localStorage on mount
  useEffect(() => {
    const storedCode = localStorage.getItem('adminCode');
    const storedIsAdmin = localStorage.getItem('isAdmin');
    if (storedCode === ADMIN_CODE && storedIsAdmin === 'true') {
      setState(prev => ({ ...prev, isUnlocked: true }));
    }
  }, []);

  const unlock = async (code: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    if (code === ADMIN_CODE) {
      localStorage.setItem('adminCode', ADMIN_CODE);
      localStorage.setItem('isAdmin', 'true');
      setState({ isUnlocked: true, error: null, isLoading: false });
      return true;
    } else {
      setState({ isUnlocked: false, error: 'Invalid admin code. Please try again.', isLoading: false });
      return false;
    }
  };

  const lockAdmin = () => {
    localStorage.removeItem('adminCode');
    localStorage.removeItem('isAdmin');
    setState({ isUnlocked: false, error: null, isLoading: false });
  };

  return {
    isUnlocked: state.isUnlocked,
    error: state.error,
    isLoading: state.isLoading,
    unlock,
    lockAdmin,
  };
}
