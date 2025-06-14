import { useLoaderData, Form, Link, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { Page, IndexTable, Card, Pagination } from "@shopify/polaris";
import { useMemo } from "react";

export async function loader({ request }) {
    const { admin } = await authenticate.admin(request);
    const url = new URL(request.url);
    const searchParam = url.searchParams;
    const rel = searchParam.get('rel');
    const cursor = searchParam.get('cursor');
    let searchString = `first: 5`;
    if (cursor && rel) {
        if (rel == "next") {
            searchString += `, after: "${cursor}"`;
        } else {
            searchString = `last: 5, before: "${cursor}"`;
        }
    }
    const response = await admin.graphql(`
    {
      products(${searchString}) {
        pageInfo {
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
        nodes {
          id
          title
          description
          status
          images(first: 1) {
            edges {
              node {
                originalSrc
                altText
              }
            }
          }
        }
      }
    }`);
    const parsedResponse = await response.json();
    const product = parsedResponse.data.products.nodes;
    const pageInfo = parsedResponse.data.products.pageInfo;

    return Response.json({ product, pageInfo });
}

export default function Shopdata() {
    const { product, pageInfo } = useLoaderData();
    const navigate = useNavigate();
    const pagination = useMemo(() => {
        const { hasNextPage, hasPreviousPage, startCursor, endCursor } = pageInfo || {};

        return {
            previous: {
                disabled: !hasPreviousPage || !startCursor,
                link: `/app/shopifydata/?rel=previous&cursor=${startCursor}`,
            },
            next: {
                disabled: !hasNextPage || !endCursor,
                link: `/app/shopifydata/?rel=next&cursor=${endCursor}`,
            },
        };
    }, [pageInfo]);

    const rowMarkup = product.map(
        ({ images, id, title, description, status }, index) => (

            <IndexTable.Row id={id} key={id} position={index}>
                <IndexTable.Cell>
                    <img style={{ width: "30px", height: "40px" }} src={images.edges[0].node.originalSrc}
                        alt={images.edges[0].node.altText} />
                </IndexTable.Cell>

                <IndexTable.Cell> {id.replace("gid://shopify/Product/", "")} </IndexTable.Cell>
                <IndexTable.Cell> {title} </IndexTable.Cell>
                <IndexTable.Cell> {description} </IndexTable.Cell>
                <IndexTable.Cell> {status} </IndexTable.Cell>
            </IndexTable.Row>
        )
    );
    return (
        <Page>
            <Card>
                <IndexTable
                    itemCount={product.length}
                    headings={[
                        { title: "Image" },
                        { title: "Id" },
                        { title: "Title" },
                        { title: "Description" },
                        { title: "Status" },
                    ]}
                    selectable={false}
                >
                    {rowMarkup}
                </IndexTable>
                <div className="navigation">
                    <Pagination
                        hasPrevious={!pagination.previous.disabled}
                        onPrevious={() => navigate(pagination.previous.link)}
                        hasNext={!pagination.next.disabled}
                        onNext={() => navigate(pagination.next.link)}
                    />
                </div>
            </Card>
        </Page>
    );
}