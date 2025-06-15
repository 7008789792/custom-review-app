import { authenticate } from '../shopify.server'

export const GET_PRODUCTS_QUERY = `
  query getProducts($first: Int!, $query: String, $after: String) {
    products(first: $first, query: $query, after: $after) {
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
        endCursor
      }
    }
  }
`

export async function getProducts(request, searchQuery = '', after = null) {
  const { admin } = await authenticate.admin(request)

  const variables = {
    first: 10,
    query: searchQuery ? `title:*${searchQuery}*` : undefined,
    after: after || undefined,
  }

  const response = await admin.graphql(GET_PRODUCTS_QUERY, { variables })
  const json = await response.json()

  const edges = json?.data?.products?.edges || []
  const products = edges.map((edge) => edge.node)

  return {
    products,
    hasNextPage: json?.data?.products?.pageInfo?.hasNextPage,
    endCursor: json?.data?.products?.pageInfo?.endCursor,
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
