import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';
import sharp from 'sharp';
import { createClient } from '@/lib/supabase/server';
import { getSupabasePublicEnv, hasSupabasePublicEnv } from '@/lib/env';
import { getOpenAIKey } from '@/lib/platform-config';
import { checkServerRateLimit } from '@/lib/server-rate-limit';

export const runtime = 'nodejs';

const TARGET_W = 800;
const TARGET_H = 1000;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

function isAllowedSource(rawUrl: string): boolean {
  try {
    const source = new URL(rawUrl);
    const storage = new URL(getSupabasePublicEnv().url);
    return source.protocol === 'https:'
      && source.hostname === storage.hostname
      && source.pathname.startsWith('/storage/v1/object/public/product-images/');
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!hasSupabasePublicEnv()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 500 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Faça login para refinar imagens.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!profile || !['admin', 'atelier'].includes(profile.role)) {
      return NextResponse.json({ error: 'Acesso restrito à equipe de produção.' }, { status: 403 });
    }
    if (!await checkServerRateLimit('ai-image', user.id, 10, 600)) {
      return NextResponse.json({ error: 'Limite de uso atingido. Aguarde alguns minutos.' }, { status: 429 });
    }

    const { imageUrl, productName, color } = (await request.json()) as {
      imageUrl: string;
      productName?: string;
      color?: string;
    };

    if (!imageUrl || !isAllowedSource(imageUrl)) {
      return NextResponse.json({ error: 'Origem de imagem não permitida.' }, { status: 400 });
    }

    const response = await fetch(imageUrl, { redirect: 'error', signal: AbortSignal.timeout(15_000) });
    if (!response.ok) {
      return NextResponse.json({ error: 'Não foi possível baixar a imagem original.' }, { status: 400 });
    }

    const contentType = response.headers.get('content-type') ?? '';
    const contentLength = Number(response.headers.get('content-length') ?? 0);
    if (!contentType.startsWith('image/') || contentLength > MAX_SOURCE_BYTES) {
      return NextResponse.json({ error: 'Arquivo de imagem inválido ou muito grande.' }, { status: 400 });
    }
    const rawBuffer = Buffer.from(await response.arrayBuffer());
    if (rawBuffer.length > MAX_SOURCE_BYTES) {
      return NextResponse.json({ error: 'Arquivo de imagem muito grande.' }, { status: 400 });
    }
    const apiKey = await getOpenAIKey();
    if (!apiKey) {
      return NextResponse.json({
        error: 'A integração com IA não está configurada. Solicite ao administrador que configure a chave OpenAI em Configurações.',
      }, { status: 503 });
    }

    const promptParts = [
      'Regenerate this ONE TWO product image preserving the same garment, silhouette, fabric texture, embroidery details, proportions, and color.',
      'Keep it as a clean fashion product photograph for an online store, centered, natural light, neutral background, premium handcrafted look.',
      'Do not invent a different product. Do not add text, logos, labels, mannequins, people, hands, watermarks, or extra objects.',
      productName ? `Product name/context: ${productName}.` : '',
      color ? `Dominant color to preserve: ${color}.` : '',
    ].filter(Boolean).join(' ');

    let generatedBuffer: Buffer | null = null;

    try {
      const openai = new OpenAI({ apiKey });
      const imageFile = await toFile(rawBuffer, 'onetwo-product.webp', { type: 'image/webp' });
      const result = await openai.images.edit({
        model: 'gpt-image-1',
        image: imageFile,
        prompt: promptParts,
        input_fidelity: 'high',
        output_format: 'webp',
        quality: 'medium',
        size: '1024x1536',
      });

      const first = result.data?.[0];
      if (first?.b64_json) {
        generatedBuffer = Buffer.from(first.b64_json, 'base64');
      } else if (first?.url) {
        const generatedResponse = await fetch(first.url);
        if (generatedResponse.ok) {
          generatedBuffer = Buffer.from(await generatedResponse.arrayBuffer());
        }
      }
    } catch {
      generatedBuffer = null;
    }

    const sourceBuffer = generatedBuffer ?? rawBuffer;
    const webpBuffer = await sharp(sourceBuffer)
      .rotate()
      .resize(TARGET_W, TARGET_H, { fit: 'cover', position: 'center' })
      .modulate({ brightness: 1.03, saturation: 0.98 })
      .sharpen({ sigma: 0.8 })
      .webp({ quality: 88 })
      .toBuffer();

    const filename = `refined-${Date.now()}-${crypto.randomUUID()}.webp`;
    const path = `products/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, webpBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('product-images').getPublicUrl(path);

    return NextResponse.json({ url: publicUrl, path });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao refinar imagem.' },
      { status: 500 }
    );
  }
}
