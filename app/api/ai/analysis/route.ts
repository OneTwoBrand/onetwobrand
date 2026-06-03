import { NextResponse } from 'next/server';
import { createAssistantPlaceholderResponse } from '@/lib/ai/server';

export async function POST() {
  return NextResponse.json(createAssistantPlaceholderResponse('analysis'), { status: 501 });
}
