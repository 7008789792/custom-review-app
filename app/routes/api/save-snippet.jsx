import { prisma } from '../../db.server'
import { authenticate } from '../../shopify.server'

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request)
  const formData = await request.formData()

  const productId = formData.get('productId')
  const snippet = formData.get('snippet')

  if (!productId || !snippet) {
    return Response.json({ error: 'Missing data' }, { status: 400 })
  }

  const saved = await prisma.reviewSnippet.upsert({
    where: { productId },
    update: { snippet },
    create: { productId, snippet },
  })

  return Response.json({ success: true, data: saved })
}
