import {
  useLoaderData,
  useFetcher,
  useSearchParams,
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
  const after = url.searchParams.get('after')
  const before = url.searchParams.get('before')

  const productsData = await getProducts(request, searchQuery, { after, before })

  const review = await db.reviewSnippet.findMany()

  return Response.json({
    ...productsData,
    searchQuery,
    reviewSnippets: review,
  })
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
  const { products, hasNextPage, hasPreviousPage, endCursor, startCursor, reviewSnippets } = useLoaderData()
  const fetcher = useFetcher()
  const [searchParams, setSearchParams] = useSearchParams()

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [variantId, setVariantId] = useState('')
  const [price, setPrice] = useState('')
  const [toastActive, setToastActive] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [reviewSnippet, setReviewSnippet] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

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
    setReviewSnippet(matchedSnippet?.snippet || '')
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

  const loadNext = () => {
    const params = Object.fromEntries(searchParams.entries())
    params.after = endCursor
    delete params.before
    setSearchParams(params)
    setCurrentPage(prev => prev + 1)
  }

  const loadPrevious = () => {
    const params = Object.fromEntries(searchParams.entries())
    params.before = startCursor
    delete params.after
    setSearchParams(params)
    setCurrentPage(prev => Math.max(1, prev - 1))
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

<div
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(48%, 1fr))',
    gap: '1.5rem',
    paddingInline: '1rem',
  }}
>
  {products.map(product => (
    <ProductCard
      key={product.id}
      product={product}
      onEdit={() => openEditModal(product)}
      reviewSnippet={reviewSnippets?.find(snippet => snippet.productId === product.id)}
    />
  ))}
</div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '1rem',
            marginBottom: '1rem',
            gap: '1rem',
          }}
        >
          <Button
            onClick={loadPrevious}
            variant="secondary"
            disabled={!hasPreviousPage || isUpdating}
          >
            Previous
          </Button>

          <span style={{ minWidth: '60px', textAlign: 'center' }}>Page {currentPage}</span>

          <Button
            onClick={loadNext}
            disabled={!hasNextPage || isUpdating}
          >
            Next
          </Button>
        </div>

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
