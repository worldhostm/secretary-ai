// /types/web-speech.d.ts
// Web Speech API (minimal) ambient types

declare global {
  interface ISpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }
  
  interface ISpeechRecognitionResult {
    readonly isFinal: boolean;
    length: number;
    [index: number]: ISpeechRecognitionAlternative;
  }
  
  interface ISpeechRecognitionResultList {
    length: number;
    [index: number]: ISpeechRecognitionResult;
  }
  
  interface ISpeechRecognitionEvent extends Event {
    results: ISpeechRecognitionResultList;
    resultIndex: number;
  }
  
  interface ISpeechRecognitionErrorEvent extends Event {
    error: string;
    message?: string;
  }
  
  interface ISpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
  
    onstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
    onresult: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => any) | null;
    onerror: ((this: ISpeechRecognition, ev: ISpeechRecognitionErrorEvent) => any) | null;
    onend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  }
  
  type SpeechRecognitionConstructor = new () => ISpeechRecognition;

  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export {};
  