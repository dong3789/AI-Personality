import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = getJob(id);

    if (!job) {
      return NextResponse.json(
        { error: 'Job을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Job 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
