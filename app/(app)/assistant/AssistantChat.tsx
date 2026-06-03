'use client';

import { useRef, useState, useEffect } from 'react';
import { Bot, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Message = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'Quais OPs estão atrasadas?',
  'Como está o estoque crítico?',
  'Resumo financeiro do mês',
  'Quais peças mais venderam?',
];

export function AssistantChat({ configured }: { configured: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    setError('');

    const next: Message[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Erro ao contatar o assistente.');
      } else {
        setMessages([...next, { role: 'assistant', content: data.reply }]);
      }
    } catch {
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (!configured) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-[18px] border border-line bg-paper px-8 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Bot size={26} strokeWidth={1.5} />
        </div>
        <h2 className="font-serif text-[22px] text-ink">Assistente não configurado</h2>
        <p className="max-w-sm text-[13px] leading-relaxed text-ink-soft">
          O OneTwo Assistant ainda não está ativo. Solicite ao administrador de TI que configure a chave OpenAI em <strong>Mais → Integração IA</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-paper">
              <Bot size={26} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-serif text-[22px] text-ink">OneTwo Assistant</h2>
              <p className="mt-1 text-[12px] text-ink-soft">Pergunte sobre produção, estoque, vendas ou financeiro.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-line bg-paper px-4 py-2 text-[12px] text-ink-soft transition-colors hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-paper">
                <Bot size={15} strokeWidth={1.5} />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-[16px] px-4 py-3 text-[13px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-paper rounded-tr-[4px]'
                  : 'bg-paper border border-line text-ink rounded-tl-[4px]'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/[0.08] text-ink">
                <User size={15} strokeWidth={1.5} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-paper">
              <Bot size={15} strokeWidth={1.5} />
            </div>
            <div className="flex items-center gap-1.5 rounded-[16px] rounded-tl-[4px] border border-line bg-paper px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-ink-soft [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-ink-soft [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-ink-soft [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {error && (
          <p className="text-center text-[12px] text-danger">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <div className="flex flex-1 items-center gap-3 rounded-[14px] border border-line bg-paper px-4 focus-within:border-primary focus-within:shadow-[0_0_0_4px_var(--ot-primary-soft)]">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Pergunte algo sobre o atelier…"
            disabled={loading}
            className="flex-1 bg-transparent py-3 text-[13px] text-ink placeholder:text-ink-mute outline-none"
          />
        </div>
        <Button
          type="button"
          onClick={() => send()}
          disabled={!input.trim() || loading}
          icon={<Send size={15} />}
          size="md"
        >
          Enviar
        </Button>
      </div>
    </div>
  );
}
