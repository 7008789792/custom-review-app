// app/routes/products.jsx or .tsx

import { Card, Frame, Layout, Page, Text, Thumbnail } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useLoaderData } from "@remix-run/react";

// ✅ loader
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const query = `
    {
      products(first: 30) {
        edges {
          node {
            id
            title
            handle
            status
            images(first: 1) {
              edges {
                node {
                  originalSrc
                  altText
                }
              }
            }
            variants(first: 30) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await admin.graphql(query);
  const responseJson = await response.json();

  return Response.json(responseJson.data.products.edges); // only returning array of products
};



// ✅ React Component
export default function Products() {
  const products = useLoaderData(); // this gets the loader return data

  return (
    <Frame>
      <Page title="Product List">
        <Layout>
          {products.map(({ node: product }) => (
            <Layout.Section key={product.id}>
              <Card>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  {product.images.edges.length > 0 && (
                    <Thumbnail
                      source={product.images.edges[0].node.originalSrc}
                      alt={product.images.edges[0].node.altText || product.title}
                    />
                  )}
                  <div>
                    <Text as="h2" variant="headingMd">{product.title}</Text>
                    <Text>Handle: {product.handle}</Text>
                    <Text>Status: {product.status}</Text>
                    {product.variants.edges.length > 0 && (
                      <Text>Price: ₹{product.variants.edges[0].node.price}</Text>
                    )}
                  </div>
                </div>
              </Card>
            </Layout.Section>
          ))}
        </Layout>
      </Page>
    </Frame>
  );
}
