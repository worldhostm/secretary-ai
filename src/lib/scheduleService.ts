import { Schedule } from './store';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'secretary_schedules';

export class ScheduleService {
  static getSchedules(): Schedule[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const schedules = JSON.parse(stored);
      return schedules.map((schedule: any) => ({
        ...schedule,
        createdAt: new Date(schedule.createdAt)
      }));
    } catch (error) {
      console.error('일정 로딩 실패:', error);
      return [];
    }
  }

  static saveSchedules(schedules: Schedule[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
    } catch (error) {
      console.error('일정 저장 실패:', error);
    }
  }

  static addSchedule(scheduleData: Omit<Schedule, 'id' | 'createdAt'>): Schedule {
    const newSchedule: Schedule = {
      ...scheduleData,
      id: uuidv4(),
      createdAt: new Date(),
    };

    const schedules = this.getSchedules();
    const updatedSchedules = [...schedules, newSchedule];
    this.saveSchedules(updatedSchedules);

    return newSchedule;
  }

  static updateSchedule(id: string, updates: Partial<Omit<Schedule, 'id' | 'createdAt'>>): Schedule | null {
    const schedules = this.getSchedules();
    const index = schedules.findIndex(schedule => schedule.id === id);
    
    if (index === -1) return null;

    const updatedSchedule = { ...schedules[index], ...updates };
    schedules[index] = updatedSchedule;
    this.saveSchedules(schedules);

    return updatedSchedule;
  }

  static deleteSchedule(id: string): boolean {
    const schedules = this.getSchedules();
    const filteredSchedules = schedules.filter(schedule => schedule.id !== id);
    
    if (filteredSchedules.length === schedules.length) return false;

    this.saveSchedules(filteredSchedules);
    return true;
  }

  static getTodaySchedules(): Schedule[] {
    const schedules = this.getSchedules();
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    return schedules.filter(schedule => schedule.date === todayString);
  }

  static getUpcomingSchedules(days: number = 7): Schedule[] {
    const schedules = this.getSchedules();
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate >= today && scheduleDate <= futureDate;
    }).sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  }

  static parseNaturalLanguageSchedule(text: string): Partial<Schedule> | null {
    const lowerText = text.toLowerCase();
    
    // 시간 패턴 매칭
    const timePatterns = [
      /(\d{1,2})시(?:\s*(\d{1,2})분)?/,
      /(\d{1,2}):(\d{2})/,
      /오전\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/,
      /오후\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/,
    ];

    // 날짜 패턴 매칭
    const datePatterns = [
      /오늘/,
      /내일/,
      /모레/,
      /(\d{1,2})월\s*(\d{1,2})일/,
      /(\d{1,2})\/(\d{1,2})/,
      /(월|화|수|목|금|토|일)요일/,
    ];

    let time = '';
    let date = '';
    let title = text;

    // 시간 추출
    for (const pattern of timePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (pattern.source.includes('오후')) {
          const hour = parseInt(match[1]) + (parseInt(match[1]) === 12 ? 0 : 12);
          const minute = match[2] ? parseInt(match[2]) : 0;
          time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        } else if (pattern.source.includes('오전')) {
          const hour = parseInt(match[1]) === 12 ? 0 : parseInt(match[1]);
          const minute = match[2] ? parseInt(match[2]) : 0;
          time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        } else {
          const hour = parseInt(match[1]);
          const minute = match[2] ? parseInt(match[2]) : 0;
          time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        }
        title = title.replace(match[0], '').trim();
        break;
      }
    }

    // 날짜 추출
    const today = new Date();
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const targetDate = new Date(today);
        
        if (match[0] === '오늘') {
          date = targetDate.toISOString().split('T')[0];
        } else if (match[0] === '내일') {
          targetDate.setDate(today.getDate() + 1);
          date = targetDate.toISOString().split('T')[0];
        } else if (match[0] === '모레') {
          targetDate.setDate(today.getDate() + 2);
          date = targetDate.toISOString().split('T')[0];
        } else if (match[1] && match[2]) { // 월/일 형식
          const month = parseInt(match[1]);
          const day = parseInt(match[2]);
          targetDate.setMonth(month - 1, day);
          if (targetDate < today) {
            targetDate.setFullYear(today.getFullYear() + 1);
          }
          date = targetDate.toISOString().split('T')[0];
        } else if (match[0].includes('요일')) {
          const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
          const targetDay = dayNames.indexOf(match[1]);
          const currentDay = today.getDay();
          let daysToAdd = targetDay - currentDay;
          if (daysToAdd <= 0) daysToAdd += 7;
          
          targetDate.setDate(today.getDate() + daysToAdd);
          date = targetDate.toISOString().split('T')[0];
        }
        
        title = title.replace(match[0], '').trim();
        break;
      }
    }

    // 기본값 설정
    if (!date) {
      date = today.toISOString().split('T')[0];
    }
    if (!time) {
      time = '09:00';
    }

    // 제목 정리
    title = title.replace(/\s+/g, ' ').trim();
    if (!title) {
      title = '새 일정';
    }

    return {
      title,
      description: '',
      date,
      time,
    };
  }
}