import { PROXY_SUB_PATH } from "./global";

// Frontend utility to fetch admin settings from the API
let settingsCache = null;

export async function fetchAdminSettings() {
  if (settingsCache) {
    return settingsCache;
  }

  try {
    const response = await fetch(`/apps/${PROXY_SUB_PATH}/api/get/admin-settings`);
    if (!response.ok) {
      throw new Error('Failed to fetch admin settings');
    }
    settingsCache = await response.json();
    return settingsCache;
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    // Return default values if fetch fails
    return getDefaultSettings();
  }
}

function getDefaultSettings() {
  return {
    cleaningTiers: [
      { id: 'standard', label: 'Standard Cleaning', price: 25 },
      { id: 'deep', label: 'Deep Cleaning', price: 45 },
      { id: 'extreme', label: 'Extreme Cleaning', price: 70 },
    ],
    addOns: [
      { id: 'deoxidation', label: 'Deoxidation', price: 15 },
      { id: 'deodorization', label: 'Deodorization', price: 10 },
      { id: 'waterproofing', label: 'Waterproofing', price: 12 },
      { id: 'sole_cleaning', label: 'Sole Cleaning', price: 10 },
      { id: 'lace_replacement', label: 'Lace Replacement', price: 8 },
    ],
    shippingBoxLibrary: [
      { sneakerQuantity: 1, length: 17, width: 11, height: 8, boxWeightLb: 1 },
      { sneakerQuantity: 2, length: 15, width: 12, height: 10, boxWeightLb: 1.5 },
      { sneakerQuantity: 3, length: 14, width: 14, height: 14, boxWeightLb: 1.5 },
      { sneakerQuantity: 4, length: 14, width: 14, height: 14, boxWeightLb: 1.5 },
      { sneakerQuantity: 5, length: 20, width: 20, height: 12, boxWeightLb: 3 },
      { sneakerQuantity: 6, length: 20, width: 20, height: 12, boxWeightLb: 3 },
      { sneakerQuantity: 7, length: 18, width: 18, height: 18, boxWeightLb: 3 },
      { sneakerQuantity: 8, length: 18, width: 18, height: 18, boxWeightLb: 3 },
      { sneakerQuantity: 9, length: 24, width: 18, height: 18, boxWeightLb: 3.5 },
      { sneakerQuantity: 10, length: 24, width: 18, height: 18, boxWeightLb: 3.5 },
    ],
    sneakerWeightLb: 4,
    highValueDisclosureLabel: 'Are any items in your order luxury, rare, sentimental, irreplaceable, one-of-one, custom, collectible, vintage, or unusually valuable?',
    highValueAcknowledgmentLabel: 'I understand that I am submitting luxury, rare, sentimental, irreplaceable, one-of-one, custom, collectible, vintage, or unusually valuable footwear. I understand that Save Our Soles does not guarantee preservation of market value, resale value, sentimental value, collectible value, authentication value, factory originality, or replacement value, and that additional shipping coverage or special handling must be requested before shipping.',
    alterationOptions: [
      { id: 'repainting', label: 'Repainting' },
      { id: 'resoling', label: 'Resoling' },
      { id: 'deoxidation', label: 'Deoxidation' },
      { id: 'modifications', label: 'Other Modifications' },
    ],
    policyReferences: [
      { id: 'terms', label: 'Terms of Service' },
      { id: 'shipping', label: 'Shipping Instructions & Disclaimer' },
      { id: 'refunds', label: 'Refund Policy' },
      { id: 'service', label: 'Service Disclaimer / Restoration Risk Policy' },
      { id: 'intake', label: 'Intake Accuracy & Customer Disclosure Policy' },
      { id: 'privacy', label: 'Privacy Policy' },
    ],
    agreementAcknowledgment: 'I have reviewed and agree to the Save Our Soles policies. I have reviewed and agree to the Save Our Soles {{PolicyReferences}}, and all other applicable policies. I understand that footwear cleaning, sanitation, deodorization, and restoration involve inherent risk, that results are not guaranteed, that I am responsible for providing accurate order information, and that Save Our Soles may contact me about my order.',
    shippingInstructionsDisclaimer: `To help keep shipping costs accurate and avoid delays, please package your footwear according to the box size recommended during checkout. You may use the recommended box size or a smaller box, as long as all footwear fits safely without forcing, bending, or damaging the shoes.

If you do not have an appropriately sized box, we recommend asking your shipping carrier for assistance with selecting the correct box size before sending your items. Oversized packages may result in carrier price adjustments, shipping delays, or additional charges. Carrier measurements, weights, and rate adjustments may differ from the website estimate. Any additional charges caused by carrier remeasurement, oversized packaging, or incorrect packaging may be the customer’s responsibility.

Please place each pair in a separate plastic bag before placing them in the shipping box. Do not include original shoeboxes unless specifically instructed, as this may increase package size and shipping cost. If original shoeboxes or additional packaging are included without instruction, Save Our Soles is not responsible for damage to, storage of, or return of those materials.

Do not include cash, jewelry, accessories, personal items, or any items unrelated to your order. Save Our Soles is not responsible for storage, loss, or return of unauthorized items included in the shipment.

Only ship the footwear included in your order. Additional, unauthorized, missing, or incorrect footwear may delay processing, pose additional charges, or require review before service can begin. Save Our Soles may pause service until shipment contents are reviewed and matched to the order.

Customers are responsible for providing accurate shipping information. Save Our Soles is not responsible for delays, failed deliveries, returned packages, or additional charges caused by incorrect or incomplete addresses.

Customers are responsible for packaging footwear securely and sealing the package properly before shipment. We recommend taking photos of the footwear and packaged box before drop-off and keeping your carrier drop-off receipt for your records.

Save Our Soles is not responsible for damage caused by insufficient packaging before the shipment arrives at our facility. Save Our Soles is also not responsible for loss, damage, delays, or carrier issues that occur while items are in transit to or from our facility. Shipping carrier policies, timelines, scans, measurements, and delivery decisions are outside of our control.

Shipping labels must be used within the stated timeframe. Expired, unused, or incorrectly used labels may require a new label at the customer’s expense.

Service turnaround time begins only after footwear has been received, checked in, and matched to the order.

Once return shipment is marked delivered by the carrier, Save Our Soles is not responsible for theft, loss, or damage occurring after delivery.

Refunds do not include shipping costs. Shipping charges are nonrefundable once a shipping label has been generated, purchased, or used.

By shipping your footwear, you acknowledge that you are responsible for following the packaging instructions and providing accurate shipment contents.`,
    bookingStatuses: [
      'Pending',
      'Received',
      'Under Inspection',
      'In Cleaning',
      'Awaiting Customer Approval',
      'Cleaning Complete',
      'Ready for Pickup / Shipment',
      'Completed',
      'Canceled',
    ],
  };
}

// Clear cache when needed (e.g., after settings are updated)
export function clearSettingsCache() {
  settingsCache = null;
}
