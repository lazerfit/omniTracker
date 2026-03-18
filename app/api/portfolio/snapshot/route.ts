import { takeSnapshot } from '@/lib/snapshot';
import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  try {
    await takeSnapshot();
    return NextResponse.json({ message: 'Snapshot taken' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
