import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: number;
    username: string;
    role: 'admin' | 'teacher' | 'student';
    firstName: string;
    lastName: string;
    fullName: string;
    className?: string;
    balance?: number;
    isActive: boolean;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            setUser: (user) => set({
                user,
                isAuthenticated: !!user,
                error: null,
            }),

            setLoading: (isLoading) => set({ isLoading }),

            setError: (error) => set({ error, isLoading: false }),

            logout: () => set({
                user: null,
                isAuthenticated: false,
                error: null,
            }),
        }),
        {
            name: 'dibby-auth',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);

// Selector hooks for common use cases
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsAdmin = () => useAuthStore((state) => state.user?.role === 'admin');
export const useIsTeacher = () => useAuthStore((state) =>
    state.user?.role === 'teacher' || state.user?.role === 'admin'
);
export const useIsStudent = () => useAuthStore((state) => state.user?.role === 'student');
