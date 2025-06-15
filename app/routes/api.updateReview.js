
import db from '../db.server'

export const action = async ({ request }) => {

    const formData = await request.formData()
    const productId = formData.get('productId')
    const snippet = formData.get('snippet')

    if (typeof productId !== 'string' || typeof snippet !== 'string') {
        return Response.json({ success: false, message: 'Invalid input' }, { status: 400 })
    }

    try {
        const existingSnippet = await db.reviewSnippet.findFirst({
            where: { productId },
        })

        if (existingSnippet) {
            console.log('Updating snippet...')
            await db.reviewSnippet.update({
                where: { id: existingSnippet.id },
                data: { snippet },
            })
        } else {
            console.log('Creating snippet...')
            await db.reviewSnippet.create({
                data: {
                    productId,
                    snippet,
                },
            })
        }

        return Response.json({ success: true })
    } catch (error) {
        console.error('Error updating snippet:', error)
        return Response.json({ success: false, message: 'Internal error' }, { status: 500 })
    }
}
