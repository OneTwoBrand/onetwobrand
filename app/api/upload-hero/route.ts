import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createClient } from '@/lib/supabase/server';
import { hasSupabasePublicEnv } from '@/lib/env';

export const runtime = 'nodejs';

// Hero spec: 16:9, 1920×1080px, WebP quality 90
const TARGET_W = 1920;
const TARGET_H = 1080;

export async function POST(request: NextRequest) {
  try {
    if (!hasSupabasePublicEnv()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Faça login para enviar imagens.' }, { status: 401 });
    }

    // Admin-only
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 });
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

    if (file.size > 30 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Limite: 30 MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const webpBuffer = await sharp(buffer)
      .rotate()
      .resize(TARGET_W, TARGET_H, { fit: 'cover', position: 'attention' })
      .webp({ quality: 90 })
      .toBuffer();

    const filename = `hero-${Date.now()}.webp`;
    const path = `hero/${filename}`;

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

    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);

    return NextResponse.json({ url: publicUrl, path });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar imagem.' },
      { status: 500 }
    );
  }
}
