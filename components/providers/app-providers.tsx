"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";

import { DEFAULT_PREFERENCES } from "@/lib/constants";
import { safeJsonParse } from "@/lib/utils";
import type { PreferenceState, SavedWordSnapshot } from "@/types";

const SETTINGS_KEY = "altlab-vocabulary-explorer-settings";
const SAVED_WORDS_KEY = "altlab-vocabulary-explorer-saved-words";

type AppContextValue = {
  hydrated: boolean;
  preferences: PreferenceState;
  setPreferences: (updater: Partial<PreferenceState>) => void;
  savedWords: SavedWordSnapshot[];
  toggleSavedWord: (word: Omit<SavedWordSnapshot, "savedAt">) => void;
  removeSavedWord: (wordId: string) => void;
  clearSavedWords: () => void;
  isWordSaved: (wordId: string) => boolean;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProviders({ children }: PropsWithChildren) {
  const [hydrated, setHydrated] = useState(false);
  const [preferences, setPreferencesState] = useState<PreferenceState>(DEFAULT_PREFERENCES);
  const [savedWords, setSavedWords] = useState<SavedWordSnapshot[]>([]);

  useEffect(() => {
    const storedPreferences = safeJsonParse<PreferenceState | null>(
      window.localStorage.getItem(SETTINGS_KEY) ?? "",
      null
    );
    const storedSavedWords = safeJsonParse<SavedWordSnapshot[] | null>(
      window.localStorage.getItem(SAVED_WORDS_KEY) ?? "",
      null
    );

    if (storedPreferences) {
      setPreferencesState({
        ...DEFAULT_PREFERENCES,
        ...storedPreferences
      });
    }

    if (storedSavedWords) {
      setSavedWords(storedSavedWords);
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences));
    document.documentElement.dataset.fontSize = preferences.fontSize;
  }, [hydrated, preferences]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(savedWords));
  }, [hydrated, savedWords]);

  const value = useMemo<AppContextValue>(
    () => ({
      hydrated,
      preferences,
      setPreferences: (updater) =>
        setPreferencesState((current) => ({
          ...current,
          ...updater
        })),
      savedWords,
      toggleSavedWord: (word) => {
        setSavedWords((current) => {
          const exists = current.some((item) => item.id === word.id);
          if (exists) {
            return current.filter((item) => item.id !== word.id);
          }

          return [
            {
              ...word,
              savedAt: new Date().toISOString()
            },
            ...current
          ];
        });
      },
      removeSavedWord: (wordId) => {
        setSavedWords((current) => current.filter((item) => item.id !== wordId));
      },
      clearSavedWords: () => {
        setSavedWords([]);
      },
      isWordSaved: (wordId) => savedWords.some((item) => item.id === wordId)
    }),
    [hydrated, preferences, savedWords]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppState must be used inside AppProviders.");
  }

  return context;
}
