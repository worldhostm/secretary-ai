import { create } from 'zustand';

export interface Schedule {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  createdAt: Date;
}

export interface VoiceMemo {
  id: string;
  title: string;
  content: string;
  audioUrl?: string;
  createdAt: Date;
}

interface AppState {
  // Speech states
  isListening: boolean;
  currentTranscript: string;
  
  // Data states
  schedules: Schedule[];
  voiceMemos: VoiceMemo[];
  
  // UI states
  isPlayingTTS: boolean;
  lastResponse: string;
  
  // Actions
  setIsListening: (isListening: boolean) => void;
  setCurrentTranscript: (transcript: string) => void;
  setSchedules: (schedules: Schedule[]) => void;
  setVoiceMemos: (memos: VoiceMemo[]) => void;
  setIsPlayingTTS: (isPlaying: boolean) => void;
  setLastResponse: (response: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  isListening: false,
  currentTranscript: '',
  schedules: [],
  voiceMemos: [],
  isPlayingTTS: false,
  lastResponse: '',
  
  // Actions
  setIsListening: (isListening) => set({ isListening }),
  setCurrentTranscript: (currentTranscript) => set({ currentTranscript }),
  setSchedules: (schedules) => set({ schedules }),
  setVoiceMemos: (voiceMemos) => set({ voiceMemos }),
  setIsPlayingTTS: (isPlayingTTS) => set({ isPlayingTTS }),
  setLastResponse: (lastResponse) => set({ lastResponse }),
}));