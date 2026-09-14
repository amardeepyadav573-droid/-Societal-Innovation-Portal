import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import authService from "../services/authService";

export const AuthContext =
  createContext(null);

const USER_KEY =
  "user";

const TOKEN_KEY =
  "token";

export function AuthProvider({
  children
}) {
  const [
    user,
    setUser
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    initialized,
    setInitialized
  ] = useState(false);

  const clearSession =
    useCallback(() => {
      localStorage.removeItem(
        USER_KEY
      );

      localStorage.removeItem(
        TOKEN_KEY
      );

      setUser(null);
    }, []);

  useEffect(() => {
    let mounted = true;

    const restoreSession =
      async () => {
        const token =
          localStorage.getItem(
            TOKEN_KEY
          );

        const storedUser =
          localStorage.getItem(
            USER_KEY
          );

        if (!token) {
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }

          return;
        }

        /*
         * Immediately restore the cached user.
         * This prevents unnecessary dashboard flicker.
         */
        if (storedUser) {
          try {
            const parsed =
              JSON.parse(
                storedUser
              );

            if (mounted) {
              setUser(parsed);
            }
          } catch {
            localStorage.removeItem(
              USER_KEY
            );
          }
        }

        /*
         * Ask backend for the latest user data.
         */
        try {
          const response =
            await authService.getProfile();

          const freshUser =
            response?.data?.user ||
            response?.user ||
            null;

          if (
            freshUser &&
            mounted
          ) {
            setUser(
              freshUser
            );

            localStorage.setItem(
              USER_KEY,
              JSON.stringify(
                freshUser
              )
            );
          }
        } catch {
          /*
           * If token is invalid,
           * the API interceptor may already
           * remove the session.
           */
          const stillHasToken =
            localStorage.getItem(
              TOKEN_KEY
            );

          if (
            !stillHasToken &&
            mounted
          ) {
            setUser(null);
          }
        } finally {
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
        }
      };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(
    async (credentials) => {
      const response =
        await authService.login(
          credentials
        );

      const loggedInUser =
        response?.data?.user ||
        response?.user;

      const token =
        response?.data?.token ||
        response?.token;

      if (
        !loggedInUser ||
        !token
      ) {
        throw new Error(
          "Invalid login response from server."
        );
      }

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(
          loggedInUser
        )
      );

      localStorage.setItem(
        TOKEN_KEY,
        token
      );

      setUser(
        loggedInUser
      );

      return {
        user: loggedInUser,
        token,
        data: response?.data
      };
    },
    []
  );

  const register =
    useCallback(
      async (data) => {
        return authService.register(
          {
            ...data,

            role: String(
              data.role ||
                "CITIZEN"
            ).toUpperCase()
          }
        );
      },
      []
    );

  const refreshUser =
    useCallback(
      async () => {
        const response =
          await authService.getProfile();

        const freshUser =
          response?.data?.user ||
          response?.user;

        if (freshUser) {
          setUser(
            freshUser
          );

          localStorage.setItem(
            USER_KEY,
            JSON.stringify(
              freshUser
            )
          );
        }

        return freshUser;
      },
      []
    );

  const updateUser =
    useCallback(
      (updatedUser) => {
        if (!updatedUser) {
          return;
        }

        setUser(
          updatedUser
        );

        localStorage.setItem(
          USER_KEY,
          JSON.stringify(
            updatedUser
          )
        );
      },
      []
    );

  const logout =
    useCallback(
      async () => {
        try {
          await authService.logout();
        } catch {
          /*
           * Local session must still be
           * removed if API logout fails.
           */
        } finally {
          clearSession();
        }
      },
      [
        clearSession
      ]
    );

  const role =
    String(
      user?.role || ""
    ).toUpperCase();

  const isAuthenticated =
    Boolean(
      user &&
        localStorage.getItem(
          TOKEN_KEY
        )
    );

  const value =
    useMemo(
      () => ({
        user,
        role,
        loading,
        initialized,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
        clearSession,
        isAuthenticated
      }),
      [
        user,
        role,
        loading,
        initialized,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
        clearSession,
        isAuthenticated
      ]
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}

export default useAuth;
