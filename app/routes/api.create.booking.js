import { authenticate } from "../shopify.server";
import BookingModel from "../MongoDB/models/Booking";
import SneakerModel from "../MongoDB/models/Sneaker";

const STAGED_UPLOADS_URL_QUERY = `
  mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        resourceUrl
        url
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const FILE_CREATE_MUTATION = `
  mutation fileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        ... on MediaImage {
          id
          image {
            url
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function uploadImageToShopify(admin, base64Data, mimeType = "image/jpeg", filename = "sneaker-image.jpg") {
    try {
        const stagedUploadRes = await admin.graphql(STAGED_UPLOADS_URL_QUERY, {
            variables: {
                input: [
                    {
                        filename,
                        mimeType,
                        resource: "IMAGE",
                        httpMethod: "POST"
                    }
                ]
            }
        });

        const stagedUploadData = await stagedUploadRes.json();
        if (stagedUploadData.data?.stagedUploadsCreate?.userErrors?.length > 0) {
            console.error("StagedUpload error:", stagedUploadData.data.stagedUploadsCreate.userErrors);
            return null;
        }

        const target = stagedUploadData.data.stagedUploadsCreate.stagedTargets[0];

        const formData = new FormData();
        target.parameters.forEach(({ name, value }) => {
            formData.append(name, value);
        });

        const base64Content = base64Data.includes("base64,") ? base64Data.split("base64,")[1] : base64Data;
        const buffer = Buffer.from(base64Content, 'base64');

        const blob = new Blob([buffer], { type: mimeType });
        formData.append("file", blob, filename);

        const uploadResponse = await fetch(target.url, {
            method: "POST",
            body: formData,
        });

        if (!uploadResponse.ok) {
            console.error("Failed to upload image to Shopify bucket", uploadResponse.statusText);
            return null;
        }

        const fileCreateRes = await admin.graphql(FILE_CREATE_MUTATION, {
            variables: {
                files: [
                    {
                        alt: "Sneaker image",
                        contentType: "IMAGE",
                        originalSource: target.resourceUrl,
                    }
                ]
            }
        });

        const fileCreateData = await fileCreateRes.json();
        if (fileCreateData.data?.fileCreate?.userErrors?.length > 0) {
            console.error("FileCreate error:", fileCreateData.data.fileCreate.userErrors);
            return null;
        }

        const createdFile = fileCreateData.data.fileCreate.files[0];
        console.log('createdFile', JSON.stringify(createdFile))

        const finalUrl = createdFile?.image?.url || target.resourceUrl;

        return {
            id: createdFile.id,
            url: finalUrl
        };
    } catch (err) {
        console.error("Exception during generic image upload flow", err);
        return null;
    }
}

export const action = async ({ request }) => {
    try {
        const { admin } = await authenticate.public.appProxy(request);
        const body = await request.json();

        console.log("create booking body received");

        const strippedPayload = { ...body };
        const allProcessedSneakersInputs = [];

        if (body.sneakers && Array.isArray(body.sneakers)) {
            strippedPayload.sneakers = [];
            for (let i = 0; i < body.sneakers.length; i++) {
                const sneakerData = body.sneakers[i];
                const uploadedImageUrls = [];

                if (sneakerData.images && Array.isArray(sneakerData.images)) {
                    for (let j = 0; j < sneakerData.images.length; j++) {
                        const b64 = sneakerData.images[j];
                        if (b64) {
                            const result = await uploadImageToShopify(admin, b64, "image/jpeg", `sneaker-${Date.now()}-${j}.jpg`);
                            if (result && result.url) {
                                uploadedImageUrls.push(result.url);
                            }
                        }
                    }
                }

                const cleanSneakerData = {
                    ...sneakerData,
                    images: uploadedImageUrls
                };

                strippedPayload.sneakers.push(cleanSneakerData);
                allProcessedSneakersInputs.push(cleanSneakerData);
            }
        }

        const bookingData = {
            customerID: body.customerID || null,
            guestInfo: body.guestInfo || {},
            handoffMethod: body.handoffMethod,
            fullPayload: strippedPayload,
            sneakers: strippedPayload.sneakers,
            submittedAt: body.submittedAt ? new Date(body.submittedAt) : new Date(),
            status: 'Received',
        };

        const bookingDoc = new BookingModel(bookingData);
        await bookingDoc.save();

        const createdSneakersIds = [];

        // storing a separate Sneaker document if there's a customer ID
        if (body.customerID) {
            for (let i = 0; i < allProcessedSneakersInputs.length; i++) {
                const cleanData = allProcessedSneakersInputs[i];

                const newSneaker = new SneakerModel({
                    customerID: body.customerID,
                    bookingID: bookingDoc._id,
                    nickname: cleanData.nickname,
                    brand: cleanData.brand,
                    model: cleanData.model,
                    colorway: cleanData.colorway,
                    size: cleanData.size,
                    sizeUnit: cleanData.sizeUnit,
                    history: cleanData.history,
                    notes: cleanData.notes,
                    services: body.services ? body.services[cleanData.id] : null,
                    images: cleanData.images,
                    status: 'Received',
                    submittedAt: body.submittedAt ? new Date(body.submittedAt) : new Date()
                });

                await newSneaker.save();
                createdSneakersIds.push(newSneaker._id);
            }
        }

        return new Response(JSON.stringify({ success: true, message: "Booking created successfully", bookingId: bookingDoc._id }))
    } catch (error) {
        console.log("error occured on api.create.booking", error)
        return new Response(JSON.stringify({ success: false, message: "Error occured while creating booking", error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
};