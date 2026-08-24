import { ICON_BASE64 } from '../icons-base64';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const slug = resolvedParams?.slug;

    if (!slug || !ICON_BASE64[slug]) {
      return new Response('Icon not found', { status: 404 });
    }

    const base64 = ICON_BASE64[slug];
    const buffer = Buffer.from(base64, 'base64');
    const contentType = slug.endsWith('.ico')
      ? 'image/x-icon'
      : slug.endsWith('.svg')
      ? 'image/svg+xml'
      : 'image/png';

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response('Internal error: ' + err?.message, { status: 500 });
  }
}
