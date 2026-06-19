import AppSettingsModel from "../MongoDB/models/AppSettings";

const DEFAULT_SETTINGS_KEY = "default";

// Default values for all settings
const DEFAULT_CLEANING_TIERS = [
  {
    id: 'standard',
    label: 'Gold Standard',
    price: 25,
    shippingCredit: false,
    description: 'Their premium is our standard. This is for those looking to remove everyday stains. This includes a detailed cleaning of the upper and midsole, along with a standard outsole cleaning to remove everyday dirt and buildup. A strong option for routine maintenance and keeping your footwear looking sharp.',
    learnMoreUrl: ''
  },
  {
    id: 'deep',
    label: 'Platinum Deep Clean',
    price: 45,
    shippingCredit: true,
    description: 'A more detailed cleaning for shoes that need extra attention. This includes everything in the Gold Standard service, plus a deeper outsole cleaning, interior cleaning, and careful detail work around seams, edges, grooves, and hard-to-reach areas. Best for footwear with heavier wear, deeper buildup, or areas that need a more focused touch.',
    learnMoreUrl: ''
  },
  {
    id: 'extreme',
    label: 'Diamond Restoration',
    price: 70,
    shippingCredit: true,
    description: 'Our most complete cleaning package for footwear that needs the highest level of care. This includes a full deep clean, interior and exterior detailing, sanitization, deodorization, and sole whitening. Best for shoes that need a full reset, especially pairs with odor, yellowing, heavier wear, or visible aging.',
    learnMoreUrl: ''
  },
];

const DEFAULT_ADD_ONS = [
  { id: 'deoxidation', label: 'Deoxidation', price: 15, description: '', learnMoreUrl: '' },
  { id: 'deodorization', label: 'Deodorization', price: 10, description: '', learnMoreUrl: '' },
  { id: 'waterproofing', label: 'Waterproofing', price: 12, description: '', learnMoreUrl: '' },
  { id: 'sole_cleaning', label: 'Sole Cleaning', price: 10, description: '', learnMoreUrl: '' },
  { id: 'lace_replacement', label: 'Lace Replacement', price: 8, description: '', learnMoreUrl: '' },
];

const DEFAULT_QUOTED_SERVICES = [
  { id: 'repaint', label: 'Repaint', description: 'Full or partial repaint of your footwear. Pricing determined after inspection.', enabled: true },
  { id: 'reglue', label: 'Reglue', description: 'Regluing of sole or upper separations. Pricing determined after inspection.', enabled: true },
  { id: 'customization', label: 'Customization', description: 'Custom design work on your footwear. Pricing determined after inspection.', enabled: true },
];

const DEFAULT_SHIPPING_BOX_LIBRARY = [
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
];

const DEFAULT_ALTERATION_OPTIONS = [
  { id: 'repainting', label: 'Repainting' },
  { id: 'resoling', label: 'Resoling' },
  { id: 'deoxidation', label: 'Deoxidation' },
  { id: 'modifications', label: 'Other Modifications' },
];

const DEFAULT_POLICY_REFERENCES = [
  { id: 'terms', label: 'Terms of Service' },
  { id: 'shipping', label: 'Shipping Instructions & Disclaimer' },
  { id: 'refunds', label: 'Refund Policy' },
  { id: 'service', label: 'Service Disclaimer / Restoration Risk Policy' },
  { id: 'intake', label: 'Intake Accuracy & Customer Disclosure Policy' },
  { id: 'privacy', label: 'Privacy Policy' },
];

const DEFAULT_BOOKING_STATUSES = [
  "Pending",
  "Received",
  "Under Inspection",
  "In Cleaning",
  "Awaiting Customer Approval",
  "Cleaning Complete",
  "Ready for Pickup / Shipment",
  "Completed",
  "Canceled",
];

// Get all settings with defaults
export async function getAllSettings() {
  const settings = await AppSettingsModel.findOne({ key: DEFAULT_SETTINGS_KEY }).lean();

  if (!settings) {
    // Initialize with defaults if not found
    return {
      key: DEFAULT_SETTINGS_KEY,
      returnShippingBufferPercentage: 0,
      shippingCreditPerPair: 10,
      sneakerWeightLb: 4,
      cleaningTiers: DEFAULT_CLEANING_TIERS,
      addOns: DEFAULT_ADD_ONS,
      quotedServices: DEFAULT_QUOTED_SERVICES,
      shippingBoxLibrary: DEFAULT_SHIPPING_BOX_LIBRARY,
      highValueDisclosureLabel: 'Are any items in your order luxury, rare, sentimental, irreplaceable, one-of-one, custom, collectible, vintage, or unusually valuable?',
      highValueAcknowledgmentLabel: 'I understand that I am submitting luxury, rare, sentimental, irreplaceable, one-of-one, custom, collectible, vintage, or unusually valuable footwear. I understand that Save Our Soles does not guarantee preservation of market value, resale value, sentimental value, collectible value, authentication value, factory originality, or replacement value, and that additional shipping coverage or special handling must be requested before shipping.',
      alterationOptions: DEFAULT_ALTERATION_OPTIONS,
      policyReferences: DEFAULT_POLICY_REFERENCES,
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
      bookingStatuses: DEFAULT_BOOKING_STATUSES,
      handoffMethods: { dropoff: true, shipping: true, pickup_delivery: true },
    };
  }

  // Fill in missing fields with defaults
  return {
    key: settings.key || DEFAULT_SETTINGS_KEY,
    returnShippingBufferPercentage: settings.returnShippingBufferPercentage ?? 0,
    shippingCreditPerPair: settings.shippingCreditPerPair ?? 10,
    sneakerWeightLb: settings.sneakerWeightLb ?? 4,
    cleaningTiers: settings.cleaningTiers?.length > 0 ? settings.cleaningTiers : DEFAULT_CLEANING_TIERS,
    addOns: settings.addOns?.length > 0 ? settings.addOns : DEFAULT_ADD_ONS,
    quotedServices: settings.quotedServices?.length > 0 ? settings.quotedServices : DEFAULT_QUOTED_SERVICES,
    shippingBoxLibrary: settings.shippingBoxLibrary?.length > 0 ? settings.shippingBoxLibrary : DEFAULT_SHIPPING_BOX_LIBRARY,
    highValueDisclosureLabel: settings.highValueDisclosureLabel || 'Are any items in your order luxury, rare, sentimental, irreplaceable, one-of-one, custom, collectible, vintage, or unusually valuable?',
    highValueAcknowledgmentLabel: settings.highValueAcknowledgmentLabel || 'I understand that I am submitting luxury, rare, sentimental, irreplaceable, one-of-one, custom, collectible, vintage, or unusually valuable footwear. I understand that Save Our Soles does not guarantee preservation of market value, resale value, sentimental value, collectible value, authentication value, factory originality, or replacement value, and that additional shipping coverage or special handling must be requested before shipping.',
    alterationOptions: settings.alterationOptions?.length > 0 ? settings.alterationOptions : DEFAULT_ALTERATION_OPTIONS,
    policyReferences: settings.policyReferences?.length > 0 ? settings.policyReferences : DEFAULT_POLICY_REFERENCES,
    agreementAcknowledgment: settings.agreementAcknowledgment || 'I have reviewed and agree to the Save Our Soles policies. I have reviewed and agree to the Save Our Soles {{PolicyReferences}}, and all other applicable policies. I understand that footwear cleaning, sanitation, deodorization, and restoration involve inherent risk, that results are not guaranteed, that I am responsible for providing accurate order information, and that Save Our Soles may contact me about my order.',
    shippingInstructionsDisclaimer: settings.shippingInstructionsDisclaimer || `To help keep shipping costs accurate and avoid delays, please package your footwear according to the box size recommended during checkout. You may use the recommended box size or a smaller box, as long as all footwear fits safely without forcing, bending, or damaging the shoes.

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
    bookingStatuses: settings.bookingStatuses?.length > 0 ? settings.bookingStatuses : DEFAULT_BOOKING_STATUSES,
    handoffMethods: settings.handoffMethods ?? { dropoff: true, shipping: true, pickup_delivery: true },
  };
}

// Get specific setting
export async function getSetting(key) {
  const allSettings = await getAllSettings();
  return allSettings[key];
}

// Update specific setting
export async function updateSetting(key, value) {
  const update = { $set: { [key]: value, key: DEFAULT_SETTINGS_KEY } };

  const result = await AppSettingsModel.findOneAndUpdate(
    { key: DEFAULT_SETTINGS_KEY },
    update,
    { upsert: true, new: true }
  );

  return result;
}

// Save all settings
export async function saveAllSettings(settingsObject) {
  const update = {
    $set: {
      ...settingsObject,
      key: DEFAULT_SETTINGS_KEY,
    }
  };

  const result = await AppSettingsModel.findOneAndUpdate(
    { key: DEFAULT_SETTINGS_KEY },
    update,
    { upsert: true, new: true }
  );

  return result;
}

// Cleaning Tiers
export async function getCleaningTiers() {
  const tiers = await getSetting('cleaningTiers');
  return tiers || DEFAULT_CLEANING_TIERS;
}

export async function saveCleaningTiers(tiers) {
  return updateSetting('cleaningTiers', tiers);
}

// Add-ons
export async function getAddOns() {
  const addOns = await getSetting('addOns');
  return addOns || DEFAULT_ADD_ONS;
}

export async function saveAddOns(addOns) {
  return updateSetting('addOns', addOns);
}

// Quoted Services
export async function getQuotedServices() {
  const quotedServices = await getSetting('quotedServices');
  return quotedServices || DEFAULT_QUOTED_SERVICES;
}

export async function saveQuotedServices(quotedServices) {
  return updateSetting('quotedServices', quotedServices);
}

// Shipping Box Library
export async function getShippingBoxLibrary() {
  const boxLibrary = await getSetting('shippingBoxLibrary');
  return boxLibrary || DEFAULT_SHIPPING_BOX_LIBRARY;
}

export async function saveShippingBoxLibrary(boxLibrary) {
  return updateSetting('shippingBoxLibrary', boxLibrary);
}

// Sneaker Weight
export async function getSneakerWeight() {
  const weight = await getSetting('sneakerWeightLb');
  return weight ?? 4;
}

export async function saveSneakerWeight(weight) {
  return updateSetting('sneakerWeightLb', weight);
}

// Booking Questions
export async function getHighValueDisclosureLabel() {
  return getSetting('highValueDisclosureLabel');
}

export async function getHighValueAcknowledgmentLabel() {
  return getSetting('highValueAcknowledgmentLabel');
}

export async function saveHighValueDisclosures(disclosureLabel, acknowledgmentLabel) {
  await updateSetting('highValueDisclosureLabel', disclosureLabel);
  return updateSetting('highValueAcknowledgmentLabel', acknowledgmentLabel);
}

// Alteration Options
export async function getAlterationOptions() {
  const options = await getSetting('alterationOptions');
  return options || DEFAULT_ALTERATION_OPTIONS;
}

export async function saveAlterationOptions(options) {
  return updateSetting('alterationOptions', options);
}

// Policy References
export async function getPolicyReferences() {
  const policies = await getSetting('policyReferences');
  return policies || DEFAULT_POLICY_REFERENCES;
}

export async function savePolicyReferences(policies) {
  return updateSetting('policyReferences', policies);
}

// Acknowledgments & Disclaimers
export async function getBookingAcknowledgments() {
  const allSettings = await getAllSettings();
  return {
    agreementAcknowledgment: allSettings.agreementAcknowledgment,
    shippingInstructionsDisclaimer: allSettings.shippingInstructionsDisclaimer,
  };
}

export async function saveBookingAcknowledgments(acknowledgments) {
  return await AppSettingsModel.findOneAndUpdate(
    { key: DEFAULT_SETTINGS_KEY },
    {
      $set: {
        agreementAcknowledgment: acknowledgments.agreementAcknowledgment,
        shippingInstructionsDisclaimer: acknowledgments.shippingInstructionsDisclaimer,
        key: DEFAULT_SETTINGS_KEY,
      }
    },
    { upsert: true, new: true }
  );
}

// Booking Statuses
export async function getBookingStatuses() {
  const statuses = await getSetting('bookingStatuses');
  return statuses || DEFAULT_BOOKING_STATUSES;
}

export async function saveBookingStatuses(statuses) {
  return updateSetting('bookingStatuses', statuses);
}

export async function saveHandoffMethods(handoffMethods) {
  return updateSetting('handoffMethods', handoffMethods);
}

// Initialize default settings if they don't exist
export async function initializeDefaultSettings() {
  const existing = await AppSettingsModel.findOne({ key: DEFAULT_SETTINGS_KEY }).lean();

  if (!existing) {
    return AppSettingsModel.create({
      key: DEFAULT_SETTINGS_KEY,
      returnShippingBufferPercentage: 0,
      shippingCreditPerPair: 10,
      sneakerWeightLb: 4,
      cleaningTiers: DEFAULT_CLEANING_TIERS,
      addOns: DEFAULT_ADD_ONS,
      quotedServices: DEFAULT_QUOTED_SERVICES,
      shippingBoxLibrary: DEFAULT_SHIPPING_BOX_LIBRARY,
      highValueDisclosureLabel: 'Are any items in your order luxury, rare, sentimental, irreplaceable, one-of-one, custom, collectible, vintage, or unusually valuable?',
      highValueAcknowledgmentLabel: 'I understand that I am submitting luxury, rare, sentimental, irreplaceable, one-of-one, custom, collectible, vintage, or unusually valuable footwear. I understand that Save Our Soles does not guarantee preservation of market value, resale value, sentimental value, collectible value, authentication value, factory originality, or replacement value, and that additional shipping coverage or special handling must be requested before shipping.',
      alterationOptions: DEFAULT_ALTERATION_OPTIONS,
      policyReferences: DEFAULT_POLICY_REFERENCES,
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
      bookingStatuses: DEFAULT_BOOKING_STATUSES,
    });
  }

  return existing;
}
