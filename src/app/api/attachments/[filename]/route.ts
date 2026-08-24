import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // 1. Verify user session
    const session = await getSession();
    if (!session) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    const { filename } = await params;

    // 2. Prevent Directory Traversal attacks (validate filename format)
    const safeFilenameRegex = /^[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+$/;
    if (!safeFilenameRegex.test(filename)) {
      return new NextResponse('Nombre de archivo no válido', { status: 400 });
    }

    // 3. Resolve the path inside the container folder
    const syncDir = '/app/dentalink_sync';
    const filePath = path.join(syncDir, filename);

    // Make sure the resolved path is indeed within the sync folder (additional safety check)
    if (!filePath.startsWith(syncDir)) {
      return new NextResponse('Acceso denegado', { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse('Archivo no encontrado', { status: 404 });
    }

    // 4. Determine appropriate content-type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.bmp') contentType = 'image/bmp';
    else if (ext === '.tiff' || ext === '.tif') contentType = 'image/tiff';

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[Attachment API Error]:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}
