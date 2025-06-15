import db from '../db.server';

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const rawProductId = url.searchParams.get('productId');

  if (!rawProductId) {
    return Response.json({ snippet: null, error: 'Missing productId' }, { status: 400 });
  }

  const productId = rawProductId.startsWith('gid://')
    ? rawProductId
    : `gid://shopify/Product/${rawProductId}`;

  try {
    
    const review = await db.reviewSnippet.findFirst({
      where: { productId },
    });

    return Response.json({ snippet: review?.snippet ?? null });
  } catch (error) {
    console.error("Proxy route error:", error);
    return Response.json({ snippet: null, error: 'Internal Server Error' }, { status: 500 });
  }
};
