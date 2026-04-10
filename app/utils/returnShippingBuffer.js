import AppSettingsModel from "../MongoDB/models/AppSettings";

const DEFAULT_SETTINGS_KEY = "default";

export function normalizeReturnShippingBufferPercentage(value) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }

    return Number(parsed.toFixed(2));
}

function roundCurrencyAmount(value) {
    return Number(Number(value).toFixed(2));
}

export async function getReturnShippingBufferPercentage() {
    const settings = await AppSettingsModel.findOne({ key: DEFAULT_SETTINGS_KEY });
    return normalizeReturnShippingBufferPercentage(settings?.returnShippingBufferPercentage);
}

export async function saveReturnShippingBufferPercentage(value) {
    const normalizedValue = normalizeReturnShippingBufferPercentage(value);

    await AppSettingsModel.findOneAndUpdate(
        { key: DEFAULT_SETTINGS_KEY },
        {
            $set: {
                key: DEFAULT_SETTINGS_KEY,
                returnShippingBufferPercentage: normalizedValue,
            },
        },
        { upsert: true, new: true },
    );

    return normalizedValue;
}

export function applyReturnShippingBufferToRate(rate, bufferPercentage) {
    const normalizedBuffer = normalizeReturnShippingBufferPercentage(bufferPercentage);
    const originalAmount = roundCurrencyAmount(rate?.amount || 0);
    const bufferedAmount = roundCurrencyAmount(originalAmount * (1 + (normalizedBuffer / 100)));

    return {
        ...rate,
        amount: bufferedAmount,
        amountDisplay: bufferedAmount.toFixed(2),
        originalAmount,
        originalAmountDisplay: originalAmount.toFixed(2),
        bufferPercentage: normalizedBuffer,
        maxPurchaseAmount: bufferedAmount,
    };
}

export function applyReturnShippingBufferToQuotes(quotes, bufferPercentage) {
    const normalizedBuffer = normalizeReturnShippingBufferPercentage(bufferPercentage);

    if (!quotes?.storeToCustomer?.rates?.length) {
        return quotes;
    }

    return {
        ...quotes,
        storeToCustomer: {
            ...quotes.storeToCustomer,
            bufferPercentage: normalizedBuffer,
            rates: quotes.storeToCustomer.rates.map((rate) =>
                applyReturnShippingBufferToRate(rate, normalizedBuffer),
            ),
        },
    };
}
