/**
 * Utility functions for handling customer-selected shipping insurance.
 * 
 * The new insurance flow:
 * 1. Customer optionally checks "Add Shipping Insurance"
 * 2. Customer enters desired coverage amount
 * 3. Insurance cost is calculated dynamically by EasyPost when rates are fetched
 * 4. Insurance is purchased at label purchase time with the customer's coverage amount
 */

function normalizeInsuranceCoverageAmount(value) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }

    return Number(parsed.toFixed(2));
}

function normalizeInsuranceCost(value) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }

    return Number(parsed.toFixed(2));
}

/**
 * Calculate insurance cost based on coverage amount
 * EasyPost charges approximately 1% of coverage for ground shipping
 */
export function calculateInsuranceCost(coverageAmount) {
    const normalized = normalizeInsuranceCoverageAmount(coverageAmount);
    
    if (normalized <= 0) {
        return 0;
    }

    // EasyPost insurance is approximately 1% of coverage amount
    // This is an estimate; actual cost will be returned by EasyPost when purchasing
    return Number((normalized * 0.01).toFixed(2));
}

/**
 * Get the insurance coverage amount from customer selection
 */
export function getInsuranceCoverageAmount(insuranceSelection) {
    if (!insuranceSelection) {
        return 0;
    }

    const isEnabled = insuranceSelection.enabled || insuranceSelection.selected;
    if (!isEnabled) return 0;

    const coverageAmount = insuranceSelection.coverageAmount 
        || insuranceSelection.config?.selectedCoverageAmount 
        || insuranceSelection.config?.coverageAmount;

    return normalizeInsuranceCoverageAmount(coverageAmount);
}

/**
 * Get the insurance cost from customer selection
 */
export function getInsuranceCost(insuranceSelection) {
    if (!insuranceSelection) {
        return 0;
    }

    const isEnabled = insuranceSelection.enabled || insuranceSelection.selected;
    if (!isEnabled) return 0;

    const cost = insuranceSelection.cost || insuranceSelection.config?.price;

    return normalizeInsuranceCost(cost);
}

/**
 * Build insurance line item for draft order
 */
export function getShippingInsuranceLineItem(insuranceSelection) {
    const isEnabled = Boolean(insuranceSelection?.enabled || insuranceSelection?.selected);
    const coverageAmount = getInsuranceCoverageAmount(insuranceSelection);
    const costPerShipment = getInsuranceCost(insuranceSelection);
    const totalCost = Number((costPerShipment * 2).toFixed(2));

    if (!isEnabled || coverageAmount <= 0 || totalCost <= 0) {
        return null;
    }

    return {
        title: `Shipping Insurance (${coverageAmount > 0 ? `$${coverageAmount}` : 'Coverage'})`,
        originalUnitPrice: totalCost,
        quantity: 1,
        customAttributes: [
            { key: "line_item_role", value: "booking_shipping_insurance" },
            { key: "booking_shipping_insurance", value: "true" },
            { key: "booking_shipping_insurance_coverage_amount", value: String(coverageAmount) },
            { key: "booking_shipping_insurance_cost", value: String(totalCost) },
        ],
    };
}
