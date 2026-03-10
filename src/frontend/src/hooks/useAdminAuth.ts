import { useCallback, useState } from "react";

const ADMIN_CODE = "7898";

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

  const recheck = useCallback(() => {
    // no-op — unlock state is managed entirely in this hook instance
  }, []);

  const unlock = async (code: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    if (code === ADMIN_CODE) {
      // Store so AdminUnlock can check it on mount
      localStorage.setItem("adminCode", ADMIN_CODE);
      localStorage.setItem("isAdmin", "true");
      setState({ isUnlocked: true, error: null, isLoading: false });
      return true;
    }
    setState({
      isUnlocked: false,
      error: "Invalid admin code. Please try again.",
      isLoading: false,
    });
    return false;
  };

  const lockAdmin = () => {
    localStorage.removeItem("adminCode");
    localStorage.removeItem("isAdmin");
    setState({ isUnlocked: false, error: null, isLoading: false });
  };

  return {
    isUnlocked: state.isUnlocked,
    error: state.error,
    isLoading: state.isLoading,
    unlock,
    lockAdmin,
    recheck,
  };
}
