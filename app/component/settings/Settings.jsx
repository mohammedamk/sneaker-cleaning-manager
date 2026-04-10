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

        setBufferPercentage(String(nextValue ?? 0));
    }, [actionData, loaderData.returnShippingBufferPercentage]);

    const handleSaveSettings = () => {
        console.log("sfsdf")
        const formData = new FormData();
        formData.append("returnShippingBufferPercentage", bufferPercentage);
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

                        <div className="settings-actions">
                            <s-button
                                variant="primary"
                                loading={isLoading ? true : undefined}
                                disabled={isLoading ? true : undefined}
                                onClick={handleSaveSettings}
                            >
                                Save settings
                            </s-button>
                        </div>
                    </div>
                </s-section>
            </div>
        </s-page>
    );
}
