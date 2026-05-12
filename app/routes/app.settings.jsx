import { authenticate } from "../shopify.server";
import {
  getReturnShippingBufferPercentage,
  getShippingCreditPerPair,
  normalizeReturnShippingBufferPercentage,
  normalizeShippingCreditPerPair,
  saveReturnShippingBufferPercentage,
  saveShippingCreditPerPair,
} from "../utils/returnShippingBuffer";
import Settings from "../component/settings/Settings";
import settingsStyles from "../component/settings/settings.css?url";

export const links = () => [
  { rel: "stylesheet", href: settingsStyles },
];

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return {
    returnShippingBufferPercentage: await getReturnShippingBufferPercentage(),
    shippingCreditPerPair: await getShippingCreditPerPair(),
  };
};

export const action = async ({ request }) => {
  try {
    await authenticate.admin(request);
    const formData = await request.formData();
    const returnShippingBufferPercentage = normalizeReturnShippingBufferPercentage(
      formData.get("returnShippingBufferPercentage"),
    );
    const shippingCreditPerPair = normalizeShippingCreditPerPair(
      formData.get("shippingCreditPerPair"),
    );

    const savedBufferPercentage = await saveReturnShippingBufferPercentage(returnShippingBufferPercentage);
    const savedShippingCreditPerPair = await saveShippingCreditPerPair(shippingCreditPerPair);

    return {
      success: true,
      message: "Settings saved successfully.",
      returnShippingBufferPercentage: savedBufferPercentage,
      shippingCreditPerPair: savedShippingCreditPerPair,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Unable to save settings.",
    };
  }
};

export default function AppSettingsRoute() {

  return (
    <Settings/>
  );
}
