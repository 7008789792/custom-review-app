import { authenticate } from '../shopify.server'

export const GET_PRODUCTS_QUERY = `
  query getProducts($first: Int, $last: Int, $query: String, $after: String, $before: String) {
    products(first: $first, last: $last, query: $query, after: $after, before: $before) {
      edges {
        node {
          id
          title
          description
          descriptionHtml
          status
          featuredImage {
            url
            altText
          }
          variants(first: 1) {
            edges {
              node {
                id
                price
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`


export async function getProducts(request, searchQuery = '', { after = null, before = null } = {}) {
  const { admin } = await authenticate.admin(request)

  const variables = {
    first: before ? undefined : 10,
    last: before ? 10 : undefined,
    query: searchQuery ? `title:*${searchQuery}*` : undefined,
    after: before ? undefined : after,
    before: before || undefined,
  }

  const response = await admin.graphql(GET_PRODUCTS_QUERY, { variables })
  const json = await response.json()

  const edges = json?.data?.products?.edges || []
  const products = edges.map((edge) => edge.node)

  const pageInfo = json?.data?.products?.pageInfo

  return {
    products,
    hasNextPage: pageInfo?.hasNextPage,
    hasPreviousPage: pageInfo?.hasPreviousPage,
    startCursor: pageInfo?.startCursor,
    endCursor: pageInfo?.endCursor,
  }
}



export const CREATE_PRODUCT_MUTATION = `
  mutation createProduct($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        title
      }
      userErrors {
        field
        message
      }
    }
  }
`



export const PRODUCT_UPDATE_MUTATION = `
  mutation updateProduct($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        title
        descriptionHtml
      }
      userErrors {
        field
        message
      }
    }
  }
`

export const PRODUCT_UPDATE_PRICE_MUTATION = `
  mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      product {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`
