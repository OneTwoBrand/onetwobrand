import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createClient } from '@/lib/supabase/server';
import { hasSupabasePublicEnv } from '@/lib/env';

export const runtime = 'nodejs';

const TARGET_W = 800;
const TARGET_H = 1000;

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

    const { imageUrl } = (await request.json()) as { imageUrl: string };

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl é obrigatório.' }, { status: 400 });
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Não foi possível baixar a imagem original.' }, { status: 400 });
    }

    const rawBuffer = Buffer.from(await response.arrayBuffer());
    const webpBuffer = await sharp(rawBuffer)
      .rotate()
      .resize(TARGET_W, TARGET_H, { fit: 'cover', position: 'attention' })
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
