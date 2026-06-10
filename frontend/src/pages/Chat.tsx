import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { llmApi, type ChatMessage } from '../api/client';
import { clsx } from 'clsx';

interface DisplayMessage extends ChatMessage {
  id: string;
  actions?: { tool: string; args: Record<string, unknown>; result: unknown }[];
}

const SUGGESTIONS = [
  'כמה מתפללים רשומים במערכת?',
  'מי לא שילם השנה?',
  'הראה לי את המושבים הפנויים',
  'מה האזכרות הקרובות?',
];

export function Chat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'שלום! אני גבאי, העוזר החכם שלך לניהול בית הכנסת. במה אוכל לעזור לך היום?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const historyForApi = (): ChatMessage[] =>
    messages
      .filter(m => m.id !== 'welcome')
      .map(({ role, content }) => ({ role, content }));

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: DisplayMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await llmApi.chat(trimmed, historyForApi());
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: res.reply,
          actions: res.actions,
        },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `שגיאה: ${err instanceof Error ? err.message : 'אירעה שגיאה בלתי צפויה'}`,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 px-6 py-4 flex items-center gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 leading-tight">עוזר גבאי</h1>
          <p className="text-xs text-blue-500">מופעל על ידי AI · עברית טבעית</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {loading && <TypingIndicator />}

        {/* Suggestions – show only when just the welcome message exists */}
        {messages.length === 1 && !loading && (
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                className="bg-white border border-blue-200 text-blue-700 text-sm px-4 py-2 rounded-full hover:bg-blue-50 transition-colors shadow-sm"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-blue-100 px-4 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="הקלד הודעה… (Enter לשליחה, Shift+Enter לשורה חדשה)"
            rows={1}
            disabled={loading}
            className={clsx(
              'flex-1 resize-none rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3',
              'text-sm text-gray-800 placeholder-gray-400 outline-none',
              'focus:ring-2 focus:ring-blue-400 focus:border-transparent transition',
              'disabled:opacity-50',
              'max-h-36 overflow-y-auto',
            )}
            style={{ direction: 'rtl' }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 144) + 'px';
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className={clsx(
              'w-11 h-11 rounded-2xl flex items-center justify-center transition-colors shadow-sm',
              input.trim() && !loading
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-100 text-blue-300 cursor-not-allowed',
            )}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" style={{ transform: 'scaleX(-1)' }} />
            )}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          העוזר עלול לטעות. בדוק מידע חשוב לפני שימוש.
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: DisplayMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={clsx('flex items-end gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={clsx(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm',
          isUser ? 'bg-blue-600' : 'bg-white border border-blue-100',
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-blue-600" />
        )}
      </div>

      <div className={clsx('flex flex-col gap-1 max-w-[75%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={clsx(
            'px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm',
            isUser
              ? 'bg-blue-600 text-white rounded-bl-sm'
              : 'bg-white text-gray-800 border border-blue-100 rounded-br-sm',
          )}
          style={{ direction: 'rtl', textAlign: 'right' }}
        >
          {msg.content}
        </div>

        {/* Actions taken by the assistant */}
        {msg.actions && msg.actions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {msg.actions.map((a, i) => (
              <span
                key={i}
                className="text-xs bg-blue-50 border border-blue-200 text-blue-600 px-2 py-0.5 rounded-full"
              >
                🔧 {a.tool}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 rounded-full bg-white border border-blue-100 flex items-center justify-center shadow-sm">
        <Bot className="w-4 h-4 text-blue-600" />
      </div>
      <div className="bg-white border border-blue-100 rounded-2xl rounded-br-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
