import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { getOpenAIKey } from '@/lib/platform-config';
import { buildOperationalContext } from '@/lib/ai/context';
import { checkServerRateLimit } from '@/lib/server-rate-limit';

export const maxDuration = 60;

const SYSTEM_PROMPT = `Você é o OneTwo Assistant, o concierge digital da ONE TWO — crafted pieces, uma marca de moda autoral slow fashion.

Sua função é ajudar as gestoras da plataforma com consultas operacionais: ordens de produção, estoque, bordagem, vendas e financeiro.

REGRAS OBRIGATÓRIAS:
1. Nunca invente dados. Use SOMENTE os dados fornecidos no contexto.
2. Seja conciso — respostas de voz devem ter no máximo 3 frases curtas.
3. Responda sempre em português brasileiro, em linguagem natural e acolhedora.
4. Se não tiver dados suficientes, diga claramente em uma frase.`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (!await checkServerRateLimit('ai-voice', user.id, 10, 600)) {
    return NextResponse.json({ error: 'Limite de uso atingido. Aguarde alguns minutos.' }, { status: 429 });
  }

  const apiKey = await getOpenAIKey();
  if (!apiKey) {
    return NextResponse.json({
      error: 'A integração com IA não está configurada. Solicite ao administrador que configure a chave OpenAI em Configurações.',
    }, { status: 503 });
  }

  const formData = await request.formData();
  const audioFile = formData.get('audio') as File | null;
  if (!audioFile) {
    return NextResponse.json({ error: 'Arquivo de áudio não recebido.' }, { status: 400 });
  }
  const allowedAudioTypes = new Set([
    'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/wav',
    'audio/webm', 'audio/ogg', 'video/webm',
  ]);
  if (!allowedAudioTypes.has(audioFile.type) || audioFile.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Áudio inválido. Limite de 10 MB.' }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey });

  // 1. Transcrição via Whisper
  let transcript: string;
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'pt',
    });
    transcript = transcription.text.trim();
  } catch {
    return NextResponse.json({ error: 'Erro ao transcrever o áudio.' }, { status: 500 });
  }

  if (!transcript) {
    return NextResponse.json({ error: 'Não foi possível entender o áudio. Tente novamente.' }, { status: 422 });
  }

  // 2. Resposta via GPT-4o-mini com contexto operacional
  const context = await buildOperationalContext();
  let reply: string;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPT}\n\n${context}` },
        { role: 'user', content: transcript },
      ],
    });
    reply = completion.choices[0]?.message?.content ?? 'Sem resposta.';

    // Log usage (best-effort)
    supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      feature: 'voice',
      calls: 1,
      input_tokens: completion.usage?.prompt_tokens,
      output_tokens: completion.usage?.completion_tokens,
      result: 'success',
      operation_summary: transcript.slice(0, 120),
    }).then(() => {});
  } catch {
    return NextResponse.json({ error: 'Erro ao gerar resposta.' }, { status: 500 });
  }

  // 3. Síntese de voz via TTS
  let audioBuffer: ArrayBuffer;
  try {
    const ttsResponse = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: reply,
      response_format: 'mp3',
    });
    audioBuffer = await ttsResponse.arrayBuffer();
  } catch {
    // TTS falhou — retorna texto sem áudio
    return NextResponse.json({ transcript, reply, audioUrl: null });
  }

  // Retorna o áudio MP3 como base64 + texto para exibir no chat
  const base64Audio = Buffer.from(audioBuffer).toString('base64');
  return NextResponse.json({
    transcript,
    reply,
    audioBase64: base64Audio,
  });
}
