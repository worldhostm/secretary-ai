import { ScheduleService } from './scheduleService';
import { MemoService } from './memoService';

export class VoiceAssistant {
  static processCommand(transcript: string): string {
    const lowerTranscript = transcript.toLowerCase().trim();
    
    // 일정 관련 명령어
    if (this.isScheduleCommand(lowerTranscript)) {
      return this.handleScheduleCommand(lowerTranscript, transcript);
    }
    
    // 메모 관련 명령어
    if (this.isMemoCommand(lowerTranscript)) {
      return this.handleMemoCommand(lowerTranscript, transcript);
    }
    
    // 일반 질문 및 인사
    if (this.isGreeting(lowerTranscript)) {
      return this.handleGreeting();
    }
    
    // 시간 관련 질문
    if (this.isTimeQuery(lowerTranscript)) {
      return this.handleTimeQuery(lowerTranscript);
    }
    
    // 기본 응답
    return this.getDefaultResponse(transcript);
  }

  private static isScheduleCommand(text: string): boolean {
    const scheduleKeywords = [
      '일정', '스케줄', '약속', '미팅', '회의', '만남',
      '등록', '추가', '저장', '알려줘', '확인', '조회'
    ];
    return scheduleKeywords.some(keyword => text.includes(keyword));
  }

  private static isMemoCommand(text: string): boolean {
    const memoKeywords = [
      '메모', '기록', '저장해줘', '적어줘', '기억해줘',
      '노트', '메모해줘', '기록해줘'
    ];
    return memoKeywords.some(keyword => text.includes(keyword));
  }

  private static isGreeting(text: string): boolean {
    const greetings = [
      '안녕', '하이', '헬로', '좋은', '반가워', '처음', '시작'
    ];
    return greetings.some(greeting => text.includes(greeting));
  }

  private static isTimeQuery(text: string): boolean {
    const timeKeywords = [
      '시간', '몇시', '언제', '지금', '현재', '오늘', '날짜'
    ];
    return timeKeywords.some(keyword => text.includes(keyword));
  }

  private static handleScheduleCommand(lowerText: string, originalText: string): string {
    // 오늘 일정 조회
    if (lowerText.includes('오늘') && (lowerText.includes('일정') || lowerText.includes('스케줄'))) {
      const todaySchedules = ScheduleService.getTodaySchedules();
      
      if (todaySchedules.length === 0) {
        return '오늘은 등록된 일정이 없습니다.';
      }
      
      const scheduleText = todaySchedules.map(schedule => 
        `${schedule.time}에 ${schedule.title}`
      ).join(', ');
      
      return `오늘 일정은 ${scheduleText}입니다.`;
    }
    
    // 일정 등록
    if (lowerText.includes('등록') || lowerText.includes('추가') || lowerText.includes('저장')) {
      const scheduleData = ScheduleService.parseNaturalLanguageSchedule(originalText);
      
      if (scheduleData) {
        const newSchedule = ScheduleService.addSchedule({
          title: scheduleData.title || '새 일정',
          description: scheduleData.description || '',
          date: scheduleData.date || new Date().toISOString().split('T')[0],
          time: scheduleData.time || '09:00'
        });
        
        return `${scheduleData.date} ${scheduleData.time}에 "${scheduleData.title}" 일정을 등록했습니다.`;
      }
    }
    
    // 다음 일정 확인
    if (lowerText.includes('다음') || lowerText.includes('다가오는')) {
      const upcomingSchedules = ScheduleService.getUpcomingSchedules(7);
      
      if (upcomingSchedules.length === 0) {
        return '다가오는 일정이 없습니다.';
      }
      
      const nextSchedule = upcomingSchedules[0];
      const scheduleDate = new Date(nextSchedule.date);
      const dateStr = scheduleDate.toLocaleDateString('ko-KR');
      
      return `다음 일정은 ${dateStr} ${nextSchedule.time}에 ${nextSchedule.title}입니다.`;
    }
    
    return '일정 관련 명령을 인식했지만 구체적인 내용을 파악하지 못했습니다. 다시 말씀해 주세요.';
  }

  private static handleMemoCommand(lowerText: string, originalText: string): string {
    // 메모 저장
    if (lowerText.includes('메모') || lowerText.includes('기록') || lowerText.includes('저장')) {
      // "메모해줘" 뒤의 내용 추출
      const memoContent = originalText
        .replace(/(메모해줘|기록해줘|저장해줘|적어줘|기억해줘)/gi, '')
        .trim();
      
      if (memoContent) {
        const title = MemoService.generateMemoTitle(memoContent);
        const newMemo = MemoService.addMemo({
          title,
          content: memoContent
        });
        
        return `"${title}" 메모를 저장했습니다.`;
      } else {
        return '메모할 내용을 말씀해 주세요.';
      }
    }
    
    // 최근 메모 조회
    if (lowerText.includes('최근') || lowerText.includes('마지막')) {
      const recentMemos = MemoService.getRecentMemos(3);
      
      if (recentMemos.length === 0) {
        return '저장된 메모가 없습니다.';
      }
      
      const memoText = recentMemos.map(memo => memo.title).join(', ');
      return `최근 메모는 ${memoText}입니다.`;
    }
    
    return '메모 관련 명령을 인식했지만 구체적인 내용을 파악하지 못했습니다.';
  }

  private static handleGreeting(): string {
    const greetings = [
      '안녕하세요! 무엇을 도와드릴까요?',
      '안녕하세요! 일정 등록이나 메모 작성을 도와드릴 수 있어요.',
      '반갑습니다! 오늘 하루도 잘 도와드릴게요.',
      '안녕하세요! 음성으로 편리하게 이용해보세요.'
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  private static handleTimeQuery(lowerText: string): string {
    const now = new Date();
    
    if (lowerText.includes('시간') || lowerText.includes('몇시')) {
      const timeStr = now.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
      return `현재 시간은 ${timeStr}입니다.`;
    }
    
    if (lowerText.includes('날짜') || lowerText.includes('오늘')) {
      const dateStr = now.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
      return `오늘은 ${dateStr}입니다.`;
    }
    
    return '시간이나 날짜에 대한 질문이신가요? 구체적으로 말씀해 주세요.';
  }

  private static getDefaultResponse(transcript: string): string {
    const responses = [
      '죄송합니다. 명령을 이해하지 못했습니다. 일정 등록이나 메모 작성을 도와드릴 수 있어요.',
      '잘 이해하지 못했어요. "오늘 일정 알려줘" 또는 "메모해줘"와 같이 말씀해 주세요.',
      '명령을 인식하지 못했습니다. 일정 관리나 메모 기능을 이용해 보세요.',
      '다시 한 번 말씀해 주세요. 일정이나 메모 관련 도움이 필요하시면 언제든 말씀하세요.'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  static getBriefing(): string {
    const now = new Date();
    const todaySchedules = ScheduleService.getTodaySchedules();
    const upcomingSchedules = ScheduleService.getUpcomingSchedules(1);
    
    let briefing = `좋은 아침입니다! 오늘은 ${now.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })}입니다. `;
    
    if (todaySchedules.length > 0) {
      const scheduleText = todaySchedules.map(schedule => 
        `${schedule.time}에 ${schedule.title}`
      ).join(', ');
      briefing += `오늘 일정은 ${scheduleText}입니다. `;
    } else {
      briefing += '오늘은 등록된 일정이 없습니다. ';
    }
    
    if (upcomingSchedules.length > todaySchedules.length) {
      const tomorrowSchedules = upcomingSchedules.filter(schedule => {
        const scheduleDate = new Date(schedule.date);
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        return scheduleDate.toDateString() === tomorrow.toDateString();
      });
      
      if (tomorrowSchedules.length > 0) {
        briefing += `내일은 ${tomorrowSchedules.length}개의 일정이 있습니다. `;
      }
    }
    
    briefing += '좋은 하루 되세요!';
    
    return briefing;
  }
}