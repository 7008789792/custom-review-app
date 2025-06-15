import {
    Card,
    Thumbnail,
    BlockStack,
    Text,
    Button,
    InlineStack,
    Badge,
    Box,
  } from '@shopify/polaris'
  
  export function ProductCard({ product, onEdit, reviewSnippet }) {
    const image = product.featuredImage
    const statusTone = product.status === 'ACTIVE' ? 'success' : 'attention'
  
    return (
      <Card padding="400">
        <BlockStack gap="300">
          <InlineStack align="space-between">
            <InlineStack gap="200" align="center">
              <Text as="h2" variant="headingSm">
                {product.title}
              </Text>
            </InlineStack>
            <InlineStack gap="200">
              <Button size="slim" onClick={onEdit}>Edit</Button>
            </InlineStack>
          </InlineStack>
  
          <div style={{ maxWidth: '200px' }}>
            <Badge tone={statusTone}>
              {product.status === 'ACTIVE' ? 'Active' : 'Draft'}
            </Badge>
          </div>
  
          {image && (
            <Box paddingBlock="300">
              <Thumbnail
                source={image.url}
                alt={image.altText || product.title}
                size="large"
              />
            </Box>
          )}
  
          <Text as="p" variant="bodyMd">
            {product.description || 'No description provided'}
          </Text>
  
          <Text as="p" variant="bodyMd">
            <strong>Price:</strong> ${product.variants.edges[0].node.price}
          </Text>
          {reviewSnippet?.snippet && (
          <Text as="p" variant="bodyMd">
            <strong>Review:</strong> {reviewSnippet.snippet}
          </Text>
        )}
        </BlockStack>
      </Card>
    )
  }
  