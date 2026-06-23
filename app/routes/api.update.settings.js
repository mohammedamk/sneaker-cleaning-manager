import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);
    const body = await request.json();
    const settingType = body.settingType;

    const [
      {
        normalizeReturnShippingBufferPercentage,
        normalizeShippingCreditPerPair,
        saveReturnShippingBufferPercentage,
        saveShippingCreditPerPair,
      },
      {
        saveCleaningTiers,
        saveAddOns,
        saveQuotedServices,
        saveShippingBoxLibrary,
        saveSneakerWeight,
        saveHighValueDisclosures,
        saveAlterationOptions,
        savePolicyReferences,
        saveBookingAcknowledgments,
        saveBookingStatuses,
        saveHandoffMethods,
      },
    ] = await Promise.all([
      import("../utils/returnShippingBuffer.server.js"),
      import("../utils/adminSettings.server.js"),
    ]);

    let result = {};

    switch (settingType) {
      case "shipping": {
        const returnShippingBufferPercentage = normalizeReturnShippingBufferPercentage(
          body.returnShippingBufferPercentage
        );
        const shippingCreditPerPair = normalizeShippingCreditPerPair(
          body.shippingCreditPerPair
        );
        const sneakerWeightLb = Number(body.sneakerWeightLb) || 4;

        await saveReturnShippingBufferPercentage(returnShippingBufferPercentage);
        await saveShippingCreditPerPair(shippingCreditPerPair);
        await saveSneakerWeight(sneakerWeightLb);

        result = {
          success: true,
          message: "Shipping settings saved successfully.",
          returnShippingBufferPercentage,
          shippingCreditPerPair,
          sneakerWeightLb,
        };
        break;
      }

      case "cleaningTiers": {
        const tiers = body.tiers;
        await saveCleaningTiers(tiers);
        result = {
          success: true,
          message: "Cleaning tiers saved successfully.",
          tiers,
        };
        break;
      }

      case "addOns": {
        const addOns = body.addOns;
        await saveAddOns(addOns);
        result = {
          success: true,
          message: "Add-ons saved successfully.",
          addOns,
        };
        break;
      }

      case "quotedServices": {
        const quotedServices = body.quotedServices;
        await saveQuotedServices(quotedServices);
        result = {
          success: true,
          message: "Quoted services saved successfully.",
          quotedServices,
        };
        break;
      }

      case "shippingBoxLibrary": {
        const boxLibrary = body.boxLibrary;
        await saveShippingBoxLibrary(boxLibrary);
        result = {
          success: true,
          message: "Shipping box library saved successfully.",
          boxLibrary,
        };
        break;
      }

      case "bookingQuestions": {
        const disclosureLabel = body.disclosureLabel;
        const acknowledgmentLabel = body.acknowledgmentLabel;
        await saveHighValueDisclosures(disclosureLabel, acknowledgmentLabel);
        result = {
          success: true,
          message: "Booking questions saved successfully.",
          disclosureLabel,
          acknowledgmentLabel,
        };
        break;
      }

      case "alterationOptions": {
        const options = body.options;
        await saveAlterationOptions(options);
        result = {
          success: true,
          message: "Alteration options saved successfully.",
          options,
        };
        break;
      }

      case "policyReferences": {
        const policies = body.policies;
        await savePolicyReferences(policies);
        result = {
          success: true,
          message: "Policy references saved successfully.",
          policies,
        };
        break;
      }

      case "acknowledgments": {
        const acknowledgments = body.acknowledgments;
        await saveBookingAcknowledgments(acknowledgments);
        result = {
          success: true,
          message: "Acknowledgments & disclaimers saved successfully.",
          acknowledgments,
        };
        break;
      }

      case "bookingStatuses": {
        const statuses = body.statuses;
        await saveBookingStatuses(statuses);
        result = {
          success: true,
          message: "Booking statuses saved successfully.",
          statuses,
        };
        break;
      }

      case "handoffMethods": {
        const handoffMethods = body.handoffMethods;
        await saveHandoffMethods(handoffMethods);
        const { syncMenuWithHandoffMethods } = await import("../utils/menuSync.server.js");
        await syncMenuWithHandoffMethods(admin, handoffMethods);
        result = {
          success: true,
          message: "Handoff methods saved successfully.",
          handoffMethods,
        };
        break;
      }

      default:
        result = {
          success: false,
          message: "Unknown setting type.",
        };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Settings action error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Unable to save settings.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
