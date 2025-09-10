import { VoiceMemo } from './store';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'secretary_voice_memos';

export class MemoService {
  static getMemos(): VoiceMemo[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const memos = JSON.parse(stored);
      return memos.map((memo: any) => ({
        ...memo,
        createdAt: new Date(memo.createdAt)
      }));
    } catch (error) {
      console.error('메모 로딩 실패:', error);
      return [];
    }
  }

  static saveMemos(memos: VoiceMemo[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
    } catch (error) {
      console.error('메모 저장 실패:', error);
    }
  }

  static addMemo(memoData: Omit<VoiceMemo, 'id' | 'createdAt'>): VoiceMemo {
    const newMemo: VoiceMemo = {
      ...memoData,
      id: uuidv4(),
      createdAt: new Date(),
    };

    const memos = this.getMemos();
    const updatedMemos = [...memos, newMemo];
    this.saveMemos(updatedMemos);

    return newMemo;
  }

  static updateMemo(id: string, updates: Partial<Omit<VoiceMemo, 'id' | 'createdAt'>>): VoiceMemo | null {
    const memos = this.getMemos();
    const index = memos.findIndex(memo => memo.id === id);
    
    if (index === -1) return null;

    const updatedMemo = { ...memos[index], ...updates };
    memos[index] = updatedMemo;
    this.saveMemos(memos);

    return updatedMemo;
  }

  static deleteMemo(id: string): boolean {
    const memos = this.getMemos();
    const filteredMemos = memos.filter(memo => memo.id !== id);
    
    if (filteredMemos.length === memos.length) return false;

    this.saveMemos(filteredMemos);
    return true;
  }

  static searchMemos(query: string): VoiceMemo[] {
    const memos = this.getMemos();
    const lowerQuery = query.toLowerCase();

    return memos.filter(memo => 
      memo.title.toLowerCase().includes(lowerQuery) ||
      memo.content.toLowerCase().includes(lowerQuery)
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  static getRecentMemos(count: number = 10): VoiceMemo[] {
    const memos = this.getMemos();
    return memos
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, count);
  }

  static generateMemoTitle(content: string): string {
    const words = content.trim().split(/\s+/).slice(0, 5);
    let title = words.join(' ');
    
    if (title.length > 30) {
      title = title.substring(0, 27) + '...';
    }
    
    if (!title) {
      const now = new Date();
      title = `메모 ${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
    
    return title;
  }

  static async saveAudioBlob(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const audioDataUrl = reader.result as string;
          resolve(audioDataUrl);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(audioBlob);
    });
  }

  static createAudioFromDataUrl(dataUrl: string): HTMLAudioElement | null {
    try {
      const audio = new Audio(dataUrl);
      return audio;
    } catch (error) {
      console.error('오디오 생성 실패:', error);
      return null;
    }
  }
}