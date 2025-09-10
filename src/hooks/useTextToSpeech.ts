'use client';

import { useState, useRef } from 'react';
import { useAppStore } from '@/lib/store';

export const useTextToSpeech = () => {
  const { isPlayingTTS, setIsPlayingTTS } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = (text: string, options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
  }) => {
    if (!window.speechSynthesis) {
      setError('브라우저에서 음성 합성을 지원하지 않습니다.');
      return;
    }

    // 이전 음성 재생 중단
    if (isPlayingTTS) {
      stop();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // 기본 설정
    utterance.lang = 'ko-KR';
    utterance.rate = options?.rate || 1;
    utterance.pitch = options?.pitch || 1;
    utterance.volume = options?.volume || 1;

    if (options?.voice) {
      utterance.voice = options.voice;
    } else {
      // 한국어 음성 찾기
      const voices = speechSynthesis.getVoices();
      const koreanVoice = voices.find(voice => 
        voice.lang.startsWith('ko') || 
        voice.name.includes('Korean') ||
        voice.name.includes('한국어')
      );
      if (koreanVoice) {
        utterance.voice = koreanVoice;
      }
    }

    utterance.onstart = () => {
      setIsPlayingTTS(true);
      setError(null);
    };

    utterance.onend = () => {
      setIsPlayingTTS(false);
      utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      setError(`음성 합성 오류: ${event.error}`);
      setIsPlayingTTS(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsPlayingTTS(false);
      utteranceRef.current = null;
    }
  };

  const pause = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
    }
  };

  const resume = () => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  };

  const getVoices = (): SpeechSynthesisVoice[] => {
    return speechSynthesis.getVoices();
  };

  const getKoreanVoices = (): SpeechSynthesisVoice[] => {
    const voices = getVoices();
    return voices.filter(voice => 
      voice.lang.startsWith('ko') || 
      voice.name.includes('Korean') ||
      voice.name.includes('한국어')
    );
  };

  return {
    speak,
    stop,
    pause,
    resume,
    isPlaying: isPlayingTTS,
    error,
    getVoices,
    getKoreanVoices,
    supported: typeof window !== 'undefined' && !! window.speechSynthesis,
  };
};