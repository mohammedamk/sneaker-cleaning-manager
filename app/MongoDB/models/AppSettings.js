import mongoose from "mongoose";

const appSettingsSchema = mongoose.Schema({
    key: { type: String, required: true, unique: true },

    // Shipping & Pricing
    returnShippingBufferPercentage: { type: Number, default: 0 },
    shippingCreditPerPair: { type: Number, default: 10 },
    sneakerWeightLb: { type: Number, default: 4 },

    // Cleaning Tiers
    cleaningTiers: [{
        id: { type: String, required: true },
        label: { type: String, required: true },
        price: { type: Number, required: true },
        shippingCredit: { type: Boolean, default: false },
        description: { type: String, default: '' },
        learnMoreUrl: { type: String, default: '' }
    }],

    // Add-ons
    addOns: [{
        id: { type: String, required: true },
        label: { type: String, required: true },
        price: { type: Number, required: true },
        description: { type: String, default: '' },
        learnMoreUrl: { type: String, default: '' }
    }],

    // Quoted Add-on Services (no upfront price — charged post-inspection)
    quotedServices: [{
        id: { type: String, required: true },
        label: { type: String, required: true },
        description: { type: String, default: '' },
        enabled: { type: Boolean, default: true }
    }],

    // Shipping Box Library
    shippingBoxLibrary: [{
        sneakerQuantity: { type: Number, required: true },
        length: { type: Number, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        boxWeightLb: { type: Number, required: true }
    }],

    // Booking Questions & Disclosures
    highValueDisclosureLabel: { type: String, default: 'Are any items in your order luxury, rare, sentimental, irreplaceable, one-of-one, custom, collectible, vintage, or unusually valuable?' },
    highValueAcknowledgmentLabel: { type: String, default: 'I understand that I am submitting luxury, rare, sentimental, irreplaceable, one-of-one, custom, collectible, vintage, or unusually valuable footwear. I understand that Save Our Soles does not guarantee preservation of market value, resale value, sentimental value, collectible value, authentication value, factory originality, or replacement value, and that additional shipping coverage or special handling must be requested before shipping.' },

    // Alteration History Options
    alterationOptions: [{
        id: { type: String, required: true },
        label: { type: String, required: true }
    }],

    // Policy References
    policyReferences: [{
        id: { type: String, required: true },
        label: { type: String, required: true }
    }],

    // Acknowledgments & Disclaimers
    agreementAcknowledgment: { type: String, default: 'I have reviewed and agree to the Save Our Soles policies. I have reviewed and agree to the Save Our Soles {{PolicyReferences}}, and all other applicable policies. I understand that footwear cleaning, sanitation, deodorization, and restoration involve inherent risk, that results are not guaranteed, that I am responsible for providing accurate order information, and that Save Our Soles may contact me about my order.' },
    shippingInstructionsDisclaimer: {
        type: String,
        default: `To help keep shipping costs accurate and avoid delays, please package your footwear according to the box size recommended during checkout. You may use the recommended box size or a smaller box, as long as all footwear fits safely without forcing, bending, or damaging the shoes.

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
    },

    // Booking Statuses
    bookingStatuses: [{ type: String }],

    // Handoff Method Visibility
    handoffMethods: {
        dropoff: { type: Boolean, default: true },
        shipping: { type: Boolean, default: true },
        pickup_delivery: { type: Boolean, default: true },
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const AppSettingsModel = mongoose.models.AppSettings || mongoose.model("AppSettings", appSettingsSchema);

export default AppSettingsModel;
