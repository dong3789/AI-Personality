import { NextRequest, NextResponse } from 'next/server';
import { getResult } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = getResult(id);

    if (!result) {
      return NextResponse.json(
        { error: '결과를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: '결과 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
