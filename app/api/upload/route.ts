import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createClient } from '@/lib/supabase/server';
import { hasSupabasePublicEnv } from '@/lib/env';

export const runtime = 'nodejs';

// Product image spec: 4:5 ratio, 800×1000px, WebP quality 85
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
      return NextResponse.json({ error: 'Faça login para enviar imagens.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
      return NextResponse.json({ error: 'Formato não suportado. Use JPG, PNG, HEIC ou WebP.' }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Limite: 20 MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const webpBuffer = await sharp(buffer)
      .rotate()
      .resize(TARGET_W, TARGET_H, {
        fit: 'cover',
        position: 'attention',
      })
      .webp({ quality: 85 })
      .toBuffer();

    const filename = `${Date.now()}-${crypto.randomUUID()}.webp`;
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
      { error: error instanceof Error ? error.message : 'Erro ao processar imagem.' },
      { status: 500 }
    );
  }
}
