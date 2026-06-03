'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Bot, Send, User, Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Message = { role: 'user' | 'assistant'; content: string; isVoice?: boolean };
type VoiceState = 'idle' | 'recording' | 'processing';

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
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  async function startRecording() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setVoiceState('processing');

        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
        const file = new File([blob], `voice.${ext}`, { type: mimeType });

        const fd = new FormData();
        fd.append('audio', file);

        try {
          const res = await fetch('/api/ai/voice', { method: 'POST', body: fd });
          const data = await res.json();

          if (!res.ok) {
            setError(data.error ?? 'Erro ao processar o áudio.');
            setVoiceState('idle');
            return;
          }

          const next: Message[] = [
            ...messages,
            { role: 'user', content: data.transcript, isVoice: true },
            { role: 'assistant', content: data.reply, isVoice: true },
          ];
          setMessages(next);

          // Reproduce áudio TTS se disponível
          if (data.audioBase64) {
            const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
            audioRef.current = audio;
            audio.play().catch(() => {});
          }
        } catch {
          setError('Falha de conexão. Tente novamente.');
        } finally {
          setVoiceState('idle');
        }
      };

      recorder.start();
      setVoiceState('recording');
    } catch {
      setError('Permissão de microfone negada ou indisponível.');
      setVoiceState('idle');
    }
  }

  function handleVoiceButton() {
    if (voiceState === 'recording') {
      stopRecording();
    } else if (voiceState === 'idle') {
      startRecording();
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
              <p className="mt-1 text-[12px] text-ink-soft">
                Pergunte por texto ou use o microfone para falar.
              </p>
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
              {msg.isVoice && msg.role === 'user' && (
                <span className="mb-1 flex items-center gap-1 text-[10px] opacity-70">
                  <Mic size={10} /> voz
                </span>
              )}
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/[0.08] text-ink">
                <User size={15} strokeWidth={1.5} />
              </div>
            )}
          </div>
        ))}

        {(loading || voiceState === 'processing') && (
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

      {/* Recording indicator */}
      {voiceState === 'recording' && (
        <div className="mb-3 flex items-center justify-center gap-2 rounded-[12px] border border-danger bg-danger-soft px-4 py-2.5">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-danger" />
          <span className="text-[12px] font-medium text-danger">Gravando… toque novamente para enviar</span>
        </div>
      )}

      {voiceState === 'processing' && (
        <div className="mb-3 flex items-center justify-center gap-2 rounded-[12px] border border-line bg-surface px-4 py-2.5">
          <Loader2 size={14} className="animate-spin text-ink-soft" />
          <span className="text-[12px] text-ink-soft">Processando áudio…</span>
        </div>
      )}

      {/* Input */}
      <div className="mt-4 flex gap-2">
        {/* Voice button */}
        <button
          type="button"
          onClick={handleVoiceButton}
          disabled={voiceState === 'processing' || loading}
          title={voiceState === 'recording' ? 'Parar gravação' : 'Falar com o assistente'}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border transition-colors disabled:opacity-40 ${
            voiceState === 'recording'
              ? 'border-danger bg-danger text-paper animate-pulse'
              : 'border-line bg-paper text-ink-soft hover:border-primary hover:text-primary'
          }`}
        >
          {voiceState === 'recording' ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {/* Text input */}
        <div className="flex flex-1 items-center gap-3 rounded-[14px] border border-line bg-paper px-4 focus-within:border-primary focus-within:shadow-[0_0_0_4px_var(--ot-primary-soft)]">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Pergunte algo sobre o atelier…"
            disabled={loading || voiceState !== 'idle'}
            className="flex-1 bg-transparent py-3 text-[13px] text-ink placeholder:text-ink-mute outline-none"
          />
        </div>

        {/* Send button */}
        <Button
          type="button"
          onClick={() => send()}
          disabled={!input.trim() || loading || voiceState !== 'idle'}
          icon={<Send size={15} />}
          size="md"
        >
          Enviar
        </Button>
      </div>
    </div>
  );
}
