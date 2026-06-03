import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { getOpenAIKey } from '@/lib/platform-config';
import { buildOperationalContext } from '@/lib/ai/context';

export const maxDuration = 60;

const SYSTEM_PROMPT = `Você é o OneTwo Assistant, o concierge digital da ONE TWO — crafted pieces, uma marca de moda autoral slow fashion.

Sua função é ajudar as gestoras da plataforma com:
- Consultas operacionais: ordens de produção, estoque, bordagem, vendas e financeiro
- Resumos executivos dos módulos
- Sugestões de prioridades e alertas
- Respostas em linguagem natural sobre os dados do atelier

REGRAS OBRIGATÓRIAS:
1. Nunca invente dados. Use SOMENTE os dados fornecidos no contexto.
2. Nunca sugira alterar registros diretamente — oriente a usar os módulos da plataforma.
3. Seja conciso, preciso e use linguagem profissional mas acolhedora.
4. Responda sempre em português brasileiro.
5. Se não tiver dados suficientes para responder, diga claramente.
6. Não exponha IDs internos, UUIDs ou detalhes técnicos de banco.`;

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  // Get API key
  const apiKey = await getOpenAIKey();
  if (!apiKey) {
    return NextResponse.json({
      error: 'A integração com IA ainda não foi configurada. Solicite ao administrador de TI que configure a chave OpenAI em Configurações.',
    }, { status: 503 });
  }

  const { messages } = await request.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[];
  };

  if (!messages?.length) {
    return NextResponse.json({ error: 'Mensagem não fornecida.' }, { status: 400 });
  }

  // Build real-time context
  const context = await buildOperationalContext();

  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n${context}` },
      ...messages,
    ],
  });

  const reply = completion.choices[0]?.message?.content ?? 'Sem resposta.';

  // Log usage (best-effort, non-blocking)
  supabase.from('ai_usage_logs').insert({
    user_id: user.id,
    feature: 'chat',
    calls: 1,
    input_tokens: completion.usage?.prompt_tokens,
    output_tokens: completion.usage?.completion_tokens,
    result: 'success',
    operation_summary: messages[messages.length - 1]?.content?.slice(0, 120),
  }).then(() => {});

  return NextResponse.json({ reply });
}
