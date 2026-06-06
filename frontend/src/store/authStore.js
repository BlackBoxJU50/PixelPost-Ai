import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, logout } from '../firebase';
import api from '../lib/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: true,
      initialized: false,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),

      fetchProfile: async () => {
        try {
          const data = await api.get('/user/me');
          set({ profile: data });
          return data;
        } catch (err) {
          console.error('Profile fetch failed:', err);
        }
      },

      logout: async () => {
        await logout();
        set({ user: null, profile: null });
      },

      updatePreferences: async (prefs) => {
        const data = await api.patch('/user/preferences', prefs);
        set((s) => ({ profile: { ...s.profile, preferences: data.preferences } }));
        return data;
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);

export default useAuthStore;
