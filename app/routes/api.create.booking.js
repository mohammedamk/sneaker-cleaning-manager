import mongoose from "mongoose";
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
      id
      fileStatus
    }
    userErrors {
      field
      message
    }
  }
}
`;

async function uploadImageToShopify(admin, base64Data, mimeType = "image/jpeg", filename = "sneaker.jpg") {
    try {
        const stagedRes = await admin.graphql(STAGED_UPLOADS_URL_QUERY, {
            variables: {
                input: [
                    {
                        filename,
                        mimeType,
                        resource: "IMAGE",
                        httpMethod: "POST",
                    },
                ],
            },
        });

        const stagedData = await stagedRes.json();
        if (stagedData?.data?.stagedUploadsCreate?.userErrors?.length) {
            console.error("Staged upload error:", stagedData.data.stagedUploadsCreate.userErrors);
            return null;
        }

        const target = stagedData.data.stagedUploadsCreate.stagedTargets[0];

        const formData = new FormData();
        target.parameters.forEach(({ name, value }) => {
            formData.append(name, value);
        });

        if (typeof base64Data !== "string") {
            console.error("Invalid base64:", base64Data);
            return null;
        }

        const base64Content = base64Data.includes("base64,")
            ? base64Data.split("base64,")[1]
            : base64Data;

        const buffer = Buffer.from(base64Content, "base64");
        const blob = new Blob([buffer], { type: mimeType });
        formData.append("file", blob, filename);

        const uploadRes = await fetch(target.url, {
            method: "POST",
            body: formData,
        });

        if (!uploadRes.ok) {
            console.error("Upload failed:", uploadRes.statusText);
            return null;
        }

        const fileRes = await admin.graphql(FILE_CREATE_MUTATION, {
            variables: {
                files: [
                    {
                        alt: "Sneaker image",
                        contentType: "IMAGE",
                        originalSource: target.resourceUrl,
                    },
                ],
            },
        });

        const fileData = await fileRes.json();
        if (fileData?.data?.fileCreate?.userErrors?.length) {
            console.error("File create error:", fileData.data.fileCreate.userErrors);
            return null;
        }

        const createdFile = fileData?.data?.fileCreate?.files?.[0];

        if (!createdFile?.id) {
            console.error("No file ID returned:", createdFile);
            return null;
        }

        return {
            id: createdFile.id,
            status: createdFile.fileStatus,
        };
    } catch (err) {
        console.error("Upload exception:", err);
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
                const uploadedImageIds = [];

                if (sneakerData.images && Array.isArray(sneakerData.images)) {
                    for (let j = 0; j < sneakerData.images.length; j++) {
                        const b64OrGid = sneakerData.images[j];
                        if (!b64OrGid) continue;

                        if (typeof b64OrGid === "string" && b64OrGid.startsWith("gid://shopify/")) {
                            uploadedImageIds.push(b64OrGid);
                            continue;
                        }

                        const result = await uploadImageToShopify(
                            admin,
                            b64OrGid,
                            "image/jpeg",
                            `sneaker-${Date.now()}-${j}.jpg`
                        );

                        if (result?.id) {
                            uploadedImageIds.push(result.id);
                        } else {
                            console.error("Image upload failed at index:", j);
                        }
                    }
                }

                const cleanSneakerData = {
                    ...sneakerData,
                    images: uploadedImageIds,
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
            status: "Received",
        };

        const bookingDoc = new BookingModel(bookingData);
        await bookingDoc.save();

        const createdSneakersIds = [];

        if (body.customerID) {
            for (let i = 0; i < allProcessedSneakersInputs.length; i++) {
                const cleanData = allProcessedSneakersInputs[i];
                const sneakerId = cleanData.id;

                const sneakerFields = {
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
                    status: "Received",
                    submittedAt: body.submittedAt ? new Date(body.submittedAt) : new Date(),
                };

                if (sneakerId && mongoose.Types.ObjectId.isValid(sneakerId)) {
                    // updating existing sneaker
                    const updatedSneaker = await SneakerModel.findOneAndUpdate(
                        { _id: sneakerId, customerID: body.customerID },
                        { $set: sneakerFields },
                        { returnDocument: 'after', upsert: true }
                    );
                    createdSneakersIds.push(updatedSneaker._id);
                } else {
                    // creating new sneaker
                    const newSneaker = new SneakerModel(sneakerFields);
                    await newSneaker.save();
                    createdSneakersIds.push(newSneaker._id);
                }
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: "Booking created successfully",
                bookingId: bookingDoc._id,
            })
        );
    } catch (error) {
        console.log("error occured on api.create.booking", error);

        return new Response(
            JSON.stringify({
                success: false,
                message: "Error occured while creating booking",
                error: error.message,
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
};