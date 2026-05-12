import { useEffect, useState } from "react";
import { useActionData, useLoaderData, useSubmit } from "react-router";

export default function Settings() {
    const loaderData = useLoaderData();
    const actionData = useActionData();
    const submit = useSubmit();
    const [isLoading, setIsLoading] = useState(false);

    const [bufferPercentage, setBufferPercentage] = useState(
        String(loaderData.returnShippingBufferPercentage ?? 0),
    );
    const [shippingCreditPerPair, setShippingCreditPerPair] = useState(
        String(loaderData.shippingCreditPerPair ?? 10),
    );

    const savedBufferPercentage = String(
        actionData?.success
            ? actionData.returnShippingBufferPercentage
            : loaderData.returnShippingBufferPercentage ?? 0,
    );
    const savedShippingCreditPerPair = String(
        actionData?.success
            ? actionData.shippingCreditPerPair
            : loaderData.shippingCreditPerPair ?? 10,
    );
    const isDirty = bufferPercentage !== savedBufferPercentage
        || shippingCreditPerPair !== savedShippingCreditPerPair;

    useEffect(() => {
        if (!actionData?.message) {
            return;
        }

        shopify.toast.show(
            actionData.message,
            actionData.success ? undefined : { isError: true },
        );

        setIsLoading(false);
    }, [actionData]);

    useEffect(() => {
        const nextValue = actionData?.success
            ? actionData.returnShippingBufferPercentage
            : loaderData.returnShippingBufferPercentage;
        const nextShippingCreditValue = actionData?.success
            ? actionData.shippingCreditPerPair
            : loaderData.shippingCreditPerPair;

        setBufferPercentage(String(nextValue ?? 0));
        setShippingCreditPerPair(String(nextShippingCreditValue ?? 10));
    }, [actionData, loaderData.returnShippingBufferPercentage, loaderData.shippingCreditPerPair]);

    const handleSaveSettings = () => {
        if (!isDirty || isLoading) {
            return;
        }

        const formData = new FormData();
        formData.append("returnShippingBufferPercentage", bufferPercentage);
        formData.append("shippingCreditPerPair", shippingCreditPerPair);
        setIsLoading(true);
        submit(formData, { method: "post" });
    };

    return (
        <s-page
            heading="Settings"
            subtitle="Configure how return shipping is priced for customers."
        >
            <div className="main_wrapper">
                <s-section heading="Return Shipping Buffer">
                    <div className="settings-content">
                        <s-text tone="subdued">
                            This percentage is added only to store-to-customer shipping quotes
                            shown during booking. It ensures the final charged amount includes
                            a buffer for later label purchase.
                        </s-text>

                        <div className="input-wrapper">
                            <s-text-field
                                type="number"
                                name="returnShippingBufferPercentage"
                                label="Buffer percentage (%)"
                                details="Example: entering 10 turns $12.00 into $13.20."
                                min="0"
                                step="0.01"
                                value={bufferPercentage}
                                onInput={(event) =>
                                    setBufferPercentage(event.currentTarget.value)
                                }
                            />
                        </div>
                    </div>
                </s-section>

                <s-section heading="Shipping Credit">
                    <div className="settings-content">
                        <s-text tone="subdued">
                            This fixed credit amount is applied per eligible sneaker pair when
                            calculating the final customer-facing shipping price.
                        </s-text>

                        <div className="input-wrapper">
                            <s-text-field
                                type="number"
                                name="shippingCreditPerPair"
                                label="Shipping credit per pair ($)"
                                details="Example: entering 10 subtracts $10.00 per pair from the combined shipping amount."
                                min="0"
                                step="0.01"
                                value={shippingCreditPerPair}
                                onInput={(event) =>
                                    setShippingCreditPerPair(event.currentTarget.value)
                                }
                            />
                        </div>
                    </div>
                </s-section>

                <div className="settings-actions settings-actions--footer">
                    <s-button
                        variant="primary"
                        loading={isLoading ? true : undefined}
                        disabled={!isDirty || isLoading ? true : undefined}
                        onClick={handleSaveSettings}
                    >
                        Save settings
                    </s-button>
                </div>
            </div>
        </s-page>
    );
}
