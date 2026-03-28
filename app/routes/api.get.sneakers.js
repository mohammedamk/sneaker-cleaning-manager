import { authenticate } from "../shopify.server";
import SneakerModel from "../MongoDB/models/Sneaker";


async function getImageUrls(admin, fileIds = []) {
  try {
    if (!fileIds.length) return {};

    const query = `
      query getFiles($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on MediaImage {
            id
            image {
              url
            }
          }
        }
      }
    `;

    const res = await admin.graphql(query, {
      variables: { ids: fileIds },
    });

    const data = await res.json();

    const map = {};

    if (data?.data?.nodes) {
      data.data.nodes.forEach((node) => {
        if (node?.id && node?.image?.url) {
          map[node.id] = node.image.url;
        }
      });
    }

    return map;
  } catch (err) {
    console.error("Error fetching image URLs:", err);
    return {};
  }
}


export const loader = async ({ request }) => {
  try {
    const { admin } = await authenticate.public.appProxy(request);

    const url = new URL(request.url);
    const customerID = url.searchParams.get("customerID");

    console.log("customerID from get sneakers", customerID);

    if (!customerID) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Customer ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const idsToSearch = [];
    if (!String(customerID).startsWith("gid://")) {
      idsToSearch.push(`gid://shopify/Customer/${customerID}`);
    }
    const sneakers = await SneakerModel.find({ customerID: { $in: idsToSearch } }).sort({
      submittedAt: -1,
    });

    const allImageIds = [];

    sneakers.forEach((snk) => {
      if (Array.isArray(snk.images)) {
        snk.images.forEach((id) => {
          if (id) allImageIds.push(id);
        });
      }
    });

    const uniqueIds = [...new Set(allImageIds)];

    const imageMap = await getImageUrls(admin, uniqueIds);

    const sneakersWithUrls = sneakers.map((snk) => {
      const updatedImages = (snk.images || []).map(
        (id) => ({ id, url: imageMap[id] || null })
      );

      return {
        ...snk.toObject(),
        id: snk._id.toString(),
        images: updatedImages.filter(img => img.url),
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        sneakers: sneakersWithUrls,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in api.get.sneakers:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};