import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify user session or API token
    const session = await getSession();
    const apiTokenHeader = request.headers.get('x-api-token');
    const secureToken = process.env.INTERNAL_API_TOKEN || 'tabancura-default-secure-token-12345';
    
    const isAuthorized = session || (apiTokenHeader && apiTokenHeader === secureToken);
    
    if (!isAuthorized) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    // 2. Read contents of the sync directory
    const syncDir = '/app/dentalink_sync';
    if (!fs.existsSync(syncDir)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(syncDir);
    
    // Filter only valid radiography/document files (exclude directories if any)
    const validFiles = files.filter(file => {
      const filePath = path.join(syncDir, file);
      const isFile = fs.statSync(filePath).isFile();
      // Ensure it is not a hidden file
      return isFile && !file.startsWith('.');
    });

    return NextResponse.json(validFiles);
  } catch (error) {
    console.error('[Attachments List API Error]:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}
