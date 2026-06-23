import { NextResponse } from 'next/server';
import { syncAllActiveCasesAction } from '@/app/actions/caseActions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[Bulk Sync API] Starting case status synchronization...');
    const result = await syncAllActiveCasesAction();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Bulk Sync API] Error running bulk sync:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
