import { authenticate } from "../shopify.server";
import SneakerModel from "../MongoDB/models/Sneaker";


const FILE_DELETE_MUTATION = `
mutation fileDelete($fileIds: [ID!]!) {
  fileDelete(fileIds: $fileIds) {
    deletedFileIds
    userErrors {
      field
      message
      code
    }
  }
}
`;

export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.public.appProxy(request);
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Sneaker ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }


    const sneaker = await SneakerModel.findById(id);

    if (!sneaker) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Sneaker not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const fileIds = (sneaker.images || []).filter(
      (img) => typeof img === "string" && img.startsWith("gid://shopify/")
    );

    if (fileIds.length > 0) {
      try {
        const response = await admin.graphql(FILE_DELETE_MUTATION, {
          variables: {
            fileIds,
          },
        });

        const data = await response.json();

        console.log("Shopify delete response:", JSON.stringify(data, null, 2));

        if (data?.data?.fileDelete?.userErrors?.length) {
          console.error(
            "Shopify file delete errors:",
            data.data.fileDelete.userErrors
          );
        } else {
          console.log(
            "Deleted files:",
            data?.data?.fileDelete?.deletedFileIds
          );
        }
      } catch (err) {
        console.error("Error deleting files from Shopify:", err);
      }
    }


    await SneakerModel.findByIdAndDelete(id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sneaker and images deleted successfully",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in api.delete.sneaker:", error);

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