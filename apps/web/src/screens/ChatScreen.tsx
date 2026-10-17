import React, { useState, useEffect, useRef } from 'react';
import { PipCharacter, type CharacterMood } from '../components/PipCharacter.js';
import { speechService } from '../utils/audio.js';
import { apiClient } from '../api/client.js';
import {
  ArrowLeft,
  Send,
  Mic,
  MicOff,
  Volume2,
  Zap
} from 'lucide-react';
import type { Learner, ChatResponse, InteractionMode } from '@chatbot/shared';

interface ChatMessage {
  id: string;
  sender: 'child' | 'companion';
  text: string;
  mode?: InteractionMode;
  timestamp: string;
  latencyMs?: number;
  modelName?: string;
  llmLatencyMs?: number;
  usedFallback?: boolean;
}

interface ChatScreenProps {
  learner: Learner;
  onBack: () => void;
  onUpdateStars?: (stars: number) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  learner,
  onBack,
  onUpdateStars
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([
    "Hello Pip! 👋",
    "What's your favorite animal?",
    "Teach me a word!",
    "I'm feeling happy today! 😊"
  ]);
  const [pipMood, setPipMood] = useState<CharacterMood>('happy');
  const [isListening, setIsListening] = useState(false);
  const [lastLatency, setLastLatency] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initial welcome message from Pip
  useEffect(() => {
    const initialText = `Hi ${learner.nickname}! 🦉 I'm right here with you! Tell me what you're thinking, or tap any question below!`;
    setMessages([
      {
        id: 'msg_init',
        sender: 'companion',
        text: initialText,
        mode: 'CONVERSATION',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    speechService.speak(initialText);

    // Setup Web Speech Recognition if available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [learner]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is supported in Google Chrome, Edge, and Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage('');
    setPipMood('thinking');

    const userMsg: ChatMessage = {
      id: `msg_c_${Date.now()}`,
      sender: 'child',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response: ChatResponse = await apiClient.sendChatMessage(learner.id, text);

      setLastLatency(response.latencyMs);

      // Adjust Pip mood based on mode
      if (response.mode === 'SUPPORT') {
        setPipMood('comforting');
      } else if (response.mode === 'LEARNING' || response.progressUpdate?.levelUp) {
        setPipMood('cheering');
      } else {
        setPipMood('happy');
      }

      if (response.progressUpdate?.starsEarned && onUpdateStars) {
        onUpdateStars(response.progressUpdate.starsEarned);
      }

      const botMsg: ChatMessage = {
        id: `msg_p_${Date.now()}`,
        sender: 'companion',
        text: response.message,
        mode: response.mode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        latencyMs: response.latencyMs,
        modelName: response.metadata?.modelName,
        llmLatencyMs: response.metadata?.llmLatencyMs,
        usedFallback: response.metadata?.usedFallback
      };

      setMessages(prev => [...prev, botMsg]);
      speechService.speak(response.message);

      if (response.quickReplies && response.quickReplies.length > 0) {
        setQuickReplies(response.quickReplies);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'companion',
        text: "I'm always right here! Let's take a cozy deep breath together.",
        mode: 'SUPPORT',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
      setPipMood('comforting');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-3 sm:px-4 h-[calc(100vh-2rem)] flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3 bg-white/80 backdrop-blur-md p-3 px-4 rounded-2xl border border-white shadow-sm flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="kid-button inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <PipCharacter mood={pipMood} size="sm" />
          <div className="text-left">
            <div className="text-sm font-black text-slate-800">Pip the Owl</div>
            <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online & Listening
            </div>
          </div>
        </div>

        {lastLatency !== null && (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
            <Zap className="w-3 h-3 text-emerald-600" />
            <span>{lastLatency} ms</span>
          </div>
        )}
      </div>

      {/* AI Contextual Behavior Demonstration Bar */}
      <div className="mb-3 px-3.5 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          <span>Try AI Intent Contexts:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
          <button
            type="button"
            onClick={() => handleSendMessage("Why do kittens purr when petted?")}
            className="px-2.5 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-xl font-bold transition shadow-xs"
            title="Demonstrates open-ended curious conversation"
          >
            ❓ Inquiry
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage("I am sad because my tower fell down")}
            className="px-2.5 py-1 bg-white hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-xl font-bold transition shadow-xs"
            title="Demonstrates emotional support without lesson pressure"
          >
            💖 Support
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage("Can we practice a color quiz now?")}
            className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl font-bold transition shadow-xs"
            title="Demonstrates educational practice transition"
          >
            📚 Learning
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage("I am bored and tired")}
            className="px-2.5 py-1 bg-white hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-xl font-bold transition shadow-xs"
            title="Demonstrates playful engagement break"
          >
            🎈 Engagement
          </button>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto px-1 space-y-3 pb-3">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.sender === 'child' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'companion' && (
              <div className="w-9 h-9 rounded-full bg-amber-200 border-2 border-amber-300 flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                🦉
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-3xl p-4 shadow-sm relative text-sm sm:text-base leading-relaxed ${
                msg.sender === 'child'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold rounded-br-xs'
                  : 'bg-white/95 text-slate-800 border border-slate-100 font-medium rounded-bl-xs'
              }`}
            >
              <div>{msg.text}</div>

              <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-black/5 text-[10px] text-slate-500">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>{msg.timestamp}</span>
                  {msg.latencyMs !== undefined && (
                    <span className="font-mono text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      ⚡ {msg.latencyMs}ms
                    </span>
                  )}
                  {msg.modelName && (
                    <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded font-semibold hidden sm:inline">
                      {msg.modelName}
                    </span>
                  )}
                </div>

                {msg.sender === 'companion' && (
                  <button
                    type="button"
                    onClick={() => speechService.speak(msg.text)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-600 transition"
                    title="Listen again"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {msg.sender === 'child' && (
              <div className="w-9 h-9 rounded-full bg-sky-200 border-2 border-sky-300 flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                {learner.avatar === 'owl' ? '🦉' : learner.avatar === 'lion' ? '🦁' : learner.avatar === 'bunny' ? '🐰' : learner.avatar === 'bear' ? '🐻' : '🧑‍🚀'}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-9 h-9 rounded-full bg-amber-200 border-2 border-amber-300 flex items-center justify-center text-lg animate-spin">
              🦉
            </div>
            <div className="bg-white/95 rounded-2xl p-3 shadow-sm border border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce delay-100" />
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce delay-200" />
              <span>Pip is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Replies */}
      {quickReplies.length > 0 && !isLoading && (
        <div className="flex gap-2 overflow-x-auto pb-2 flex-shrink-0 scrollbar-none">
          {quickReplies.map((reply, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(reply)}
              className="kid-button whitespace-nowrap px-3.5 py-1.5 rounded-full bg-white/90 border border-amber-300 text-slate-700 hover:bg-amber-100 text-xs sm:text-sm font-bold shadow-xs transition"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Input Bar */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 bg-white/90 backdrop-blur-md p-2 rounded-2xl border-2 border-amber-200 shadow-md flex-shrink-0"
      >
        <button
          type="button"
          onClick={toggleMic}
          className={`p-3 rounded-xl transition ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse'
              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
          }`}
          title={isListening ? 'Stop Listening' : 'Speak with your voice!'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          type="text"
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          placeholder={isListening ? 'Listening to your voice...' : 'Type or tap suggestions...'}
          className="flex-1 bg-transparent border-none text-slate-800 font-semibold text-sm sm:text-base focus:outline-none px-2"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="kid-button p-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition shadow-sm"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
