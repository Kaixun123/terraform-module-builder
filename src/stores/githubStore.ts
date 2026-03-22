import { create } from 'zustand';

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
}

interface GitHubStore {
  token: string | null;
  user: GitHubUser | null;
  isAuthenticating: boolean;
  setToken: (token: string) => void;
  setUser: (user: GitHubUser) => void;
  setAuthenticating: (value: boolean) => void;
  signOut: () => void;
}

export const useGitHubStore = create<GitHubStore>((set) => ({
  token: null,
  user: null,
  isAuthenticating: false,
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  setAuthenticating: (value) => set({ isAuthenticating: value }),
  signOut: () => set({ token: null, user: null }),
}));
