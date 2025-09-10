'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Calendar, FileText, Clock } from 'lucide-react';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { VoiceAssistant } from '@/lib/voiceAssistant';
import { ScheduleService } from '@/lib/scheduleService';
import { MemoService } from '@/lib/memoService';
import { useAppStore } from '@/lib/store';

export default function VoiceAssistantInterface() {
  const { transcript, isListening, error: sttError, startListening, stopListening, supported: sttSupported } = useSpeechToText();
  const { speak, isPlaying, error: ttsError, supported: ttsSupported } = useTextToSpeech();
  
  const { 
    schedules, 
    voiceMemos, 
    lastResponse, 
    currentTranscript,
    setSchedules, 
    setVoiceMemos, 
    setLastResponse 
  } = useAppStore();
  
  const [showTranscript, setShowTranscript] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    setSchedules(ScheduleService.getSchedules());
    setVoiceMemos(MemoService.getMemos());
  }, [setSchedules, setVoiceMemos]);

  // 음성 인식 완료 시 처리
  useEffect(() => {
    if (!isListening && transcript && transcript.trim()) {
      handleVoiceCommand(transcript);
      setShowTranscript(true);
      setTimeout(() => setShowTranscript(false), 5000);
    }
  }, [isListening, transcript]);

  const handleVoiceCommand = async (command: string) => {
    if (!command.trim()) return;
    
    setIsProcessing(true);
    
    try {
      const response = VoiceAssistant.processCommand(command);
      setLastResponse(response);
      
      if (ttsSupported) {
        speak(response);
      }
      
      // 데이터 다시 로드
      setSchedules(ScheduleService.getSchedules());
      setVoiceMemos(MemoService.getMemos());
    } catch (error) {
      console.error('음성 명령 처리 오류:', error);
      const errorMessage = '죄송합니다. 명령 처리 중 오류가 발생했습니다.';
      setLastResponse(errorMessage);
      if (ttsSupported) {
        speak(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleBriefing = () => {
    const briefing = VoiceAssistant.getBriefing();
    setLastResponse(briefing);
    if (ttsSupported) {
      speak(briefing);
    }
  };

  const getTodaySchedules = () => {
    return ScheduleService.getTodaySchedules();
  };

  const getRecentMemos = () => {
    return MemoService.getRecentMemos(3);
  };

  if (!sttSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <MicOff size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">음성 인식 미지원</h2>
          <p className="text-gray-600">
            현재 브라우저에서 음성 인식을 지원하지 않습니다. 
            Chrome, Edge, Safari 등의 최신 브라우저를 사용해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">음성 비서 AI</h1>
          <p className="text-white">음성으로 일정과 메모를 관리하세요</p>
        </div>

        {/* 메인 음성 인터페이스 */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <div className="text-center">
            {/* 마이크 버튼 */}
            <button
              onClick={handleMicClick}
              disabled={isProcessing}
              className={`w-24 h-24 rounded-full border-4 transition-all duration-300 mb-6 ${
                isListening
                  ? 'bg-red-500 border-red-600 shadow-lg scale-110'
                  : 'bg-blue-500 border-blue-600 hover:bg-blue-600 hover:scale-105'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isListening ? (
                <MicOff size={32} className="text-white mx-auto" />
              ) : (
                <Mic size={32} className="text-white mx-auto" />
              )}
            </button>

            {/* 상태 표시 */}
            <div className="mb-4">
              {isListening && (
                <p className="text-red-500 font-medium animate-pulse">
                  🎤 음성을 듣고 있습니다...
                </p>
              )}
              {isProcessing && (
                <p className="text-blue-500 font-medium">
                  🤔 명령을 처리하고 있습니다...
                </p>
              )}
              {isPlaying && (
                <p className="text-green-500 font-medium flex items-center justify-center gap-2">
                  <Volume2 size={16} />
                  음성으로 응답하고 있습니다...
                </p>
              )}
              {!isListening && !isProcessing && !isPlaying && (
                <p className="text-gray-500">마이크 버튼을 클릭하여 음성 명령을 시작하세요</p>
              )}
            </div>

            {/* 실시간 음성 인식 결과 */}
            {(showTranscript || isListening) && currentTranscript && (
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">인식된 음성:</p>
                <p className="text-gray-800 font-medium">{currentTranscript}</p>
              </div>
            )}

            {/* 마지막 응답 */}
            {lastResponse && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-600 mb-1">비서 응답:</p>
                <p className="text-blue-800">{lastResponse}</p>
              </div>
            )}

            {/* 오류 메시지 */}
            {(sttError || ttsError) && (
              <div className="bg-red-50 rounded-lg p-4 mb-4">
                <p className="text-red-600 text-sm">
                  {sttError || ttsError}
                </p>
              </div>
            )}

            {/* 빠른 액션 버튼들 */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleBriefing}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Clock size={16} />
                오늘 브리핑
              </button>
            </div>
          </div>
        </div>

        {/* 정보 대시보드 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 오늘의 일정 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-blue-500" />
              오늘의 일정
            </h3>
            <div className="space-y-3">
              {getTodaySchedules().length > 0 ? (
                getTodaySchedules().map((schedule) => (
                  <div key={schedule.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="font-medium text-gray-800">{schedule.title}</p>
                    <p className="text-sm text-gray-600">{schedule.time}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-center py-4">오늘은 일정이 없습니다</p>
              )}
            </div>
          </div>

          {/* 최근 메모 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-green-500" />
              최근 메모
            </h3>
            <div className="space-y-3">
              {getRecentMemos().length > 0 ? (
                getRecentMemos().map((memo) => (
                  <div key={memo.id} className="border-l-4 border-green-500 pl-4 py-2">
                    <p className="font-medium text-gray-800">{memo.title}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{memo.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-center py-4">저장된 메모가 없습니다</p>
              )}
            </div>
          </div>
        </div>

        {/* 사용법 가이드 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">사용법 가이드</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">일정 관리</h4>
              <ul className="space-y-1">
                <li>• "오늘 일정 알려줘"</li>
                <li>• "내일 10시에 회의 등록해줘"</li>
                <li>• "다음 일정 알려줘"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">메모 관리</h4>
              <ul className="space-y-1">
                <li>• "메모해줘 우체국 들르기"</li>
                <li>• "기록해줘 프로젝트 아이디어"</li>
                <li>• "최근 메모 알려줘"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}