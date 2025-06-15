import {
  useLoaderData,
  useFetcher,
  useSearchParams,
  Form,
} from '@remix-run/react'
import {
  Page,
  Layout,
  Modal,
  TextField,
  Button,
  BlockStack,
  Toast,
  Frame,
  Text,
  InlineStack,
  Box
} from '@shopify/polaris'
import { useState, useEffect } from 'react'
import { getProducts } from '../utils/shopifyQueries'
import { authenticate } from '../shopify.server'
import {
  PRODUCT_UPDATE_PRICE_MUTATION,
} from '../utils/shopifyQueries'
import { ProductCard } from '../components/ProductCard'
import db from '../db.server'

export const loader = async ({ request }) => {
  const url = new URL(request.url)
  const searchQuery = url.searchParams.get('q') || ''
  const after = url.searchParams.get('after') || null
  const productsData = await getProducts(request, searchQuery, after)
  const review = await db.reviewSnippet.findMany();
  return Response.json({ ...productsData, searchQuery, reviewSnippets: review })
}

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request)
  let formData = await request.formData()
  const actionType = formData.get('actionType')
  formData = Object.fromEntries(formData)

  if (actionType === 'updatePrice') {
    const variantId = formData.variantId
    const price = formData.price
    const productId = formData.productId
    const snippet = formData.reviewSnippet

    if (
      typeof variantId !== 'string' ||
      typeof price !== 'string' ||
      typeof productId !== 'string'
    ) {
      return Response.json(
        { success: false, errors: [{ message: 'Invalid input' }] },
        { status: 400 }
      )
    }

    // Update Shopify product price
    const response = await admin.graphql(PRODUCT_UPDATE_PRICE_MUTATION, {
      variables: {
        productId,
        variants: [
          {
            id: variantId,
            price,
          },
        ],
      },
    })

    const data = await response.json()
    const errors = data?.data?.productVariantsBulkUpdate?.userErrors || []
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`

    if (snippet && typeof snippet === 'string') {
      await fetch(`${baseUrl}/api/updateReview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: request.headers.get('Cookie'),
        },
        body: new URLSearchParams({ productId, snippet }),
      })
    }


    return Response.json({ success: errors.length === 0, errors })
  }

  return Response.json({ success: false, errors: [{ message: 'Unknown action' }] })
}

export default function ProductsPage() {
  const { products, hasNextPage, endCursor, reviewSnippets } = useLoaderData()
  const fetcher = useFetcher()
  const [searchParams, setSearchParams] = useSearchParams()

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [variantId, setVariantId] = useState('')
  const [price, setPrice] = useState('')
  const [toastActive, setToastActive] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [reviewSnippet, setReviewSnippet] = useState('')

  const isUpdating = fetcher.state === 'submitting'

  const openEditModal = (product) => {
    const variant = product.variants?.edges?.[0]?.node
    if (!variant) return

    // Find the latest snippet for the selected product
    const matchedSnippet = reviewSnippets
      .filter(snippet => snippet.productId === product.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]

    setSelectedProduct(product)
    setVariantId(variant.id)
    setPrice(variant.price)
    setReviewSnippet(matchedSnippet?.snippet || '') // Set found snippet or fallback to empty
    setModalOpen(true)
  }

  const handleUpdate = () => {
    fetcher.submit(
      {
        actionType: 'updatePrice',
        variantId,
        price,
        productId: selectedProduct.id,
        reviewSnippet,
      },
      { method: 'post' }
    )
    setModalOpen(false)
  }

  const loadMore = () => {
    const params = Object.fromEntries(searchParams.entries())
    params.after = endCursor
    setSearchParams(params)
  }

  useEffect(() => {
    if (fetcher.data?.success) {
      setToastMessage('Operation successful')
      setToastActive(true)
    } else if (fetcher.data?.errors?.length > 0) {
      setToastMessage('Operation failed')
      setToastActive(true)
    }
  }, [fetcher.data])

  return (
    <Frame>
      <Page
        title="All Products"
      >

        <Box paddingBlockStart="400">
          <Layout>
            {products.map(product => (
              <Layout.Section key={product.id}>
                <ProductCard
                  product={product}
                  onEdit={() => openEditModal(product)}
                  reviewSnippet={reviewSnippets?.find(snippet => snippet.productId === product.id)}
                />
              </Layout.Section>
            ))}
          </Layout>
        </Box>

        {hasNextPage && (
          <Box paddingBlockStart="400" paddingInlineStart="400">
            <Button onClick={loadMore}>Load More</Button>
          </Box>
        )}

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Edit Product Price"
          primaryAction={{
            content: isUpdating ? 'Saving…' : 'Save',
            onAction: handleUpdate,
            loading: isUpdating,
          }}
          secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <TextField
                label="Price"
                type="number"
                value={price}
                onChange={setPrice}
                autoComplete="off"
              />
              <TextField
                label="Review Snippet"
                multiline
                value={reviewSnippet}
                onChange={setReviewSnippet}
                autoComplete="off"
              />
            </BlockStack>
          </Modal.Section>
        </Modal>

        {toastActive && <Toast content={toastMessage} onDismiss={() => setToastActive(false)} />}
      </Page>
    </Frame>
  )
}
