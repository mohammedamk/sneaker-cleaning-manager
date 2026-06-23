import { useEffect, useState } from "react";

// Component for editing cleaning tiers with descriptions and learn-more URLs
function EditableCleaningTiersComponent({ items, onSave }) {
    const [localItems, setLocalItems] = useState(items || []);
    const [isEditing, setIsEditing] = useState(false);
    const [newItem, setNewItem] = useState({ id: '', label: '', price: 0, shippingCredit: false, description: '', learnMoreUrl: '' });

    const handleAddItem = () => {
        if (!newItem.id || !newItem.label) return;
        const item = {
            id: newItem.id.toLowerCase().replace(/\s+/g, '_'),
            label: newItem.label,
            price: Number(newItem.price),
            shippingCredit: Boolean(newItem.shippingCredit),
            description: newItem.description || '',
            learnMoreUrl: newItem.learnMoreUrl || ''
        };
        setLocalItems([...localItems, item]);
        setNewItem({ id: '', label: '', price: 0, shippingCredit: false, description: '', learnMoreUrl: '' });
    };

    const handleRemoveItem = (id) => {
        setLocalItems(localItems.filter(item => item.id !== id));
    };

    const handleUpdateItem = (index, field, value) => {
        const updated = [...localItems];
        if (field === 'price') {
            updated[index] = { ...updated[index], [field]: Number(value) };
        } else if (field === 'shippingCredit') {
            updated[index] = { ...updated[index], [field]: Boolean(value) };
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }
        setLocalItems(updated);
    };

    const handleSave = () => {
        onSave(localItems);
        setIsEditing(false);
    };

    return (
        <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4>Cleaning Tiers</h4>
                <s-button size="small" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? 'Cancel' : 'Edit'}
                </s-button>
            </div>

            {!isEditing && (
                <div style={{ display: 'grid', gap: '10px' }}>
                    {localItems.map(item => (
                        <div key={item.id} style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                            <div style={{ fontWeight: 'bold' }}>{item.label}</div>
                            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '4px' }}>
                                <div>Price: ${item.price.toFixed(2)}</div>
                                <div>Shipping Credit Eligible: {item.shippingCredit ? 'Yes' : 'No'}</div>
                                {item.description && (
                                    <div style={{ marginTop: '8px', fontStyle: 'italic', borderLeft: '3px solid #ddd', paddingLeft: '8px' }}>
                                        {item.description}
                                    </div>
                                )}
                                {item.learnMoreUrl && (
                                    <div style={{ marginTop: '4px' }}>Learn More URL: <a href={item.learnMoreUrl} target="_blank" rel="noopener noreferrer">{item.learnMoreUrl}</a></div>
                                )}
                            </div>
                        </div>
                    ))}
                    {localItems.length === 0 && <s-text tone="subdued">No items configured</s-text>}
                </div>
            )}

            {isEditing && (
                <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                    <div style={{ display: 'grid', gap: '10px', marginBottom: '15px' }}>
                        {localItems.map((item, index) => (
                            <div key={item.id} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr) auto auto', gap: '10px', marginBottom: '10px', alignItems: 'end' }}>
                                    <s-text-field
                                        label="Label"
                                        value={item.label}
                                        onInput={(e) => handleUpdateItem(index, 'label', e.currentTarget.value)}
                                    />
                                    <s-text-field
                                        type="number"
                                        label="Price"
                                        value={String(item.price)}
                                        step="0.01"
                                        min="0"
                                        onInput={(e) => handleUpdateItem(index, 'price', e.currentTarget.value)}
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px' }}>
                                        <input
                                            type="checkbox"
                                            id={`shipping-credit-${item.id}`}
                                            checked={item.shippingCredit || false}
                                            onChange={(e) => handleUpdateItem(index, 'shippingCredit', e.target.checked)}
                                        />
                                        <label htmlFor={`shipping-credit-${item.id}`} style={{ margin: 0, cursor: 'pointer' }}>
                                            Shipping Credit
                                        </label>
                                    </div>
                                    <s-button variant="destructive" size="small" onClick={() => handleRemoveItem(item.id)}>
                                        Remove
                                    </s-button>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.9em' }}>Tooltip Description</label>
                                    <textarea
                                        value={item.description || ''}
                                        onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                                        style={{
                                            width: '100%',
                                            minHeight: '80px',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ccc',
                                            fontFamily: 'inherit',
                                            fontSize: '0.9em'
                                        }}
                                        placeholder="Tooltip text shown to customers when they click the info icon..."
                                    />
                                </div>
                                <s-text-field
                                    label="Learn More URL (optional)"
                                    placeholder="https://yourstore.com/services/standard-clean"
                                    value={item.learnMoreUrl || ''}
                                    onInput={(e) => handleUpdateItem(index, 'learnMoreUrl', e.currentTarget.value)}
                                />
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#fff', borderRadius: '4px', marginBottom: '15px', border: '1px solid #ddd' }}>
                        <h5 style={{ marginTop: 0 }}>Add New Tier</h5>
                        <div style={{ display: 'grid', gap: '10px' }}>
                            <s-text-field
                                label="ID"
                                placeholder="e.g., standard"
                                value={newItem.id}
                                onInput={(e) => setNewItem({ ...newItem, id: e.currentTarget.value })}
                            />
                            <s-text-field
                                label="Label"
                                placeholder="e.g., Gold Standard"
                                value={newItem.label}
                                onInput={(e) => setNewItem({ ...newItem, label: e.currentTarget.value })}
                            />
                            <s-text-field
                                type="number"
                                label="Price"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                value={String(newItem.price)}
                                onInput={(e) => setNewItem({ ...newItem, price: e.currentTarget.value })}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    id="shipping-credit-new"
                                    checked={newItem.shippingCredit || false}
                                    onChange={(e) => setNewItem({ ...newItem, shippingCredit: e.target.checked })}
                                />
                                <label htmlFor="shipping-credit-new" style={{ margin: 0, cursor: 'pointer' }}>
                                    Shipping Credit Eligible
                                </label>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Tooltip Description</label>
                                <textarea
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                    style={{
                                        width: '100%',
                                        minHeight: '80px',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc',
                                        fontFamily: 'inherit'
                                    }}
                                    placeholder="Tooltip text shown to customers when they click the info icon..."
                                />
                            </div>
                            <s-text-field
                                label="Learn More URL (optional)"
                                placeholder="https://yourstore.com/services/..."
                                value={newItem.learnMoreUrl}
                                onInput={(e) => setNewItem({ ...newItem, learnMoreUrl: e.currentTarget.value })}
                            />
                            <s-button onClick={handleAddItem}>Add Tier</s-button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <s-button onClick={() => setIsEditing(false)}>Cancel</s-button>
                        <s-button variant="primary" onClick={handleSave}>Save Changes</s-button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Component for editing optional add-ons with descriptions and learn-more URLs
function EditableAddOnsComponent({ items, onSave }) {
    const [localItems, setLocalItems] = useState(items || []);
    const [isEditing, setIsEditing] = useState(false);
    const [newItem, setNewItem] = useState({ id: '', label: '', price: 0, description: '', learnMoreUrl: '' });

    const handleAddItem = () => {
        if (!newItem.id || !newItem.label) return;
        const item = {
            id: newItem.id.toLowerCase().replace(/\s+/g, '_'),
            label: newItem.label,
            price: Number(newItem.price),
            description: newItem.description || '',
            learnMoreUrl: newItem.learnMoreUrl || ''
        };
        setLocalItems([...localItems, item]);
        setNewItem({ id: '', label: '', price: 0, description: '', learnMoreUrl: '' });
    };

    const handleRemoveItem = (id) => {
        setLocalItems(localItems.filter(item => item.id !== id));
    };

    const handleUpdateItem = (index, field, value) => {
        const updated = [...localItems];
        updated[index] = { ...updated[index], [field]: field === 'price' ? Number(value) : value };
        setLocalItems(updated);
    };

    const handleSave = () => {
        onSave(localItems);
        setIsEditing(false);
    };

    return (
        <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4>Optional Add-ons</h4>
                <s-button size="small" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? 'Cancel' : 'Edit'}
                </s-button>
            </div>

            {!isEditing && (
                <div style={{ display: 'grid', gap: '10px' }}>
                    {localItems.map(item => (
                        <div key={item.id} style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                            <div style={{ fontWeight: 'bold' }}>{item.label}</div>
                            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '4px' }}>
                                <div>Price: ${item.price.toFixed(2)}</div>
                                {item.description && (
                                    <div style={{ marginTop: '8px', fontStyle: 'italic', borderLeft: '3px solid #ddd', paddingLeft: '8px' }}>
                                        {item.description}
                                    </div>
                                )}
                                {item.learnMoreUrl && (
                                    <div style={{ marginTop: '4px' }}>Learn More URL: <a href={item.learnMoreUrl} target="_blank" rel="noopener noreferrer">{item.learnMoreUrl}</a></div>
                                )}
                            </div>
                        </div>
                    ))}
                    {localItems.length === 0 && <s-text tone="subdued">No items configured</s-text>}
                </div>
            )}

            {isEditing && (
                <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                    <div style={{ display: 'grid', gap: '10px', marginBottom: '15px' }}>
                        {localItems.map((item, index) => (
                            <div key={item.id} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', marginBottom: '10px', alignItems: 'end' }}>
                                    <s-text-field
                                        label="Label"
                                        value={item.label}
                                        onInput={(e) => handleUpdateItem(index, 'label', e.currentTarget.value)}
                                    />
                                    <s-text-field
                                        type="number"
                                        label="Price"
                                        value={String(item.price)}
                                        step="0.01"
                                        min="0"
                                        onInput={(e) => handleUpdateItem(index, 'price', e.currentTarget.value)}
                                    />
                                    <s-button variant="destructive" size="small" onClick={() => handleRemoveItem(item.id)}>
                                        Remove
                                    </s-button>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.9em' }}>Tooltip Description</label>
                                    <textarea
                                        value={item.description || ''}
                                        onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                                        style={{
                                            width: '100%',
                                            minHeight: '60px',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ccc',
                                            fontFamily: 'inherit',
                                            fontSize: '0.9em'
                                        }}
                                        placeholder="Tooltip text shown to customers when they click the info icon..."
                                    />
                                </div>
                                <s-text-field
                                    label="Learn More URL (optional)"
                                    placeholder="https://yourstore.com/services/..."
                                    value={item.learnMoreUrl || ''}
                                    onInput={(e) => handleUpdateItem(index, 'learnMoreUrl', e.currentTarget.value)}
                                />
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#fff', borderRadius: '4px', marginBottom: '15px', border: '1px solid #ddd' }}>
                        <h5 style={{ marginTop: 0 }}>Add New Add-on</h5>
                        <div style={{ display: 'grid', gap: '10px' }}>
                            <s-text-field
                                label="ID"
                                placeholder="e.g., waterproofing"
                                value={newItem.id}
                                onInput={(e) => setNewItem({ ...newItem, id: e.currentTarget.value })}
                            />
                            <s-text-field
                                label="Label"
                                placeholder="e.g., Waterproofing"
                                value={newItem.label}
                                onInput={(e) => setNewItem({ ...newItem, label: e.currentTarget.value })}
                            />
                            <s-text-field
                                type="number"
                                label="Price"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                value={String(newItem.price)}
                                onInput={(e) => setNewItem({ ...newItem, price: e.currentTarget.value })}
                            />
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Tooltip Description</label>
                                <textarea
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                    style={{
                                        width: '100%',
                                        minHeight: '60px',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc',
                                        fontFamily: 'inherit'
                                    }}
                                    placeholder="Tooltip text shown to customers when they click the info icon..."
                                />
                            </div>
                            <s-text-field
                                label="Learn More URL (optional)"
                                placeholder="https://yourstore.com/services/..."
                                value={newItem.learnMoreUrl}
                                onInput={(e) => setNewItem({ ...newItem, learnMoreUrl: e.currentTarget.value })}
                            />
                            <s-button onClick={handleAddItem}>Add Add-on</s-button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <s-button onClick={() => setIsEditing(false)}>Cancel</s-button>
                        <s-button variant="primary" onClick={handleSave}>Save Changes</s-button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Component for editing quoted add-on services (no price — charged post-inspection)
function EditableQuotedServicesComponent({ items, onSave }) {
    const [localItems, setLocalItems] = useState(items || []);
    const [isEditing, setIsEditing] = useState(false);
    const [newItem, setNewItem] = useState({ id: '', label: '', description: '' });

    const handleAddItem = () => {
        if (!newItem.id || !newItem.label) return;
        const item = {
            id: newItem.id.toLowerCase().replace(/\s+/g, '_'),
            label: newItem.label,
            description: newItem.description || '',
            enabled: true
        };
        setLocalItems([...localItems, item]);
        setNewItem({ id: '', label: '', description: '', enabled: true });
    };

    const handleRemoveItem = (id) => {
        setLocalItems(localItems.filter(item => item.id !== id));
    };

    const handleUpdateItem = (index, field, value) => {
        const updated = [...localItems];
        updated[index] = { ...updated[index], [field]: value };
        setLocalItems(updated);
    };

    const handleSave = () => {
        onSave(localItems);
        setIsEditing(false);
    };

    return (
        <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h4>Quoted Add-on Services</h4>
                <s-button size="small" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? 'Cancel' : 'Edit'}
                </s-button>
            </div>
            <p style={{ fontSize: '0.85em', color: '#666', margin: '0 0 12px' }}>
                These services (e.g., Repaint, Reglue, Customization) have no upfront price. The final charge is determined after inspection and billed separately.
            </p>

            {!isEditing && (
                <div style={{ display: 'grid', gap: '10px' }}>
                    {localItems.map(item => (
                        <div key={item.id} style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                            <div style={{ fontWeight: 'bold' }}>{item.label}</div>
                            {item.description && (
                                <div style={{ fontSize: '0.9em', color: '#666', marginTop: '6px', fontStyle: 'italic', borderLeft: '3px solid #ddd', paddingLeft: '8px' }}>
                                    {item.description}
                                </div>
                            )}
                        </div>
                    ))}
                    {localItems.length === 0 && <s-text tone="subdued">No quoted services configured</s-text>}
                </div>
            )}

            {isEditing && (
                <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                    <div style={{ display: 'grid', gap: '10px', marginBottom: '15px' }}>
                        {localItems.map((item, index) => (
                            <div key={item.id} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', marginBottom: '10px', alignItems: 'end' }}>
                                    <s-text-field
                                        label="Label"
                                        value={item.label}
                                        onInput={(e) => handleUpdateItem(index, 'label', e.currentTarget.value)}
                                    />
                                    <s-button variant="destructive" size="small" onClick={() => handleRemoveItem(item.id)}>
                                        Remove
                                    </s-button>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.9em' }}>Description (shown as tooltip)</label>
                                    <textarea
                                        value={item.description || ''}
                                        onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                                        style={{
                                            width: '100%',
                                            minHeight: '60px',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ccc',
                                            fontFamily: 'inherit',
                                            fontSize: '0.9em'
                                        }}
                                        placeholder="Brief description shown to customers..."
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#fff', borderRadius: '4px', marginBottom: '15px', border: '1px solid #ddd' }}>
                        <h5 style={{ marginTop: 0 }}>Add New Quoted Service</h5>
                        <div style={{ display: 'grid', gap: '10px' }}>
                            <s-text-field
                                label="ID"
                                placeholder="e.g., repaint"
                                value={newItem.id}
                                onInput={(e) => setNewItem({ ...newItem, id: e.currentTarget.value })}
                            />
                            <s-text-field
                                label="Label"
                                placeholder="e.g., Repaint"
                                value={newItem.label}
                                onInput={(e) => setNewItem({ ...newItem, label: e.currentTarget.value })}
                            />
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Description (shown as tooltip)</label>
                                <textarea
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                    style={{
                                        width: '100%',
                                        minHeight: '60px',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc',
                                        fontFamily: 'inherit'
                                    }}
                                    placeholder="Brief description shown to customers..."
                                />
                            </div>
                            <s-button onClick={handleAddItem}>Add Service</s-button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <s-button onClick={() => setIsEditing(false)}>Cancel</s-button>
                        <s-button variant="primary" onClick={handleSave}>Save Changes</s-button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Component for editing a list of items with id, label, and price
function EditableItemList({ items, onSave, title, fields = ['label', 'price'] }) {
    const [localItems, setLocalItems] = useState(items || []);
    const [isEditing, setIsEditing] = useState(false);
    const [newItem, setNewItem] = useState({ id: '', label: '', price: 0, shippingCredit: false });

    const handleAddItem = () => {
        if (!newItem.id || !newItem.label) return;
        const item = {
            id: newItem.id.toLowerCase().replace(/\s+/g, '_'),
            label: newItem.label,
            ...(fields.includes('price') && { price: Number(newItem.price) }),
            ...(fields.includes('shippingCredit') && { shippingCredit: Boolean(newItem.shippingCredit) })
        };
        setLocalItems([...localItems, item]);
        setNewItem({ id: '', label: '', price: 0, shippingCredit: false });
    };

    const handleRemoveItem = (id) => {
        setLocalItems(localItems.filter(item => item.id !== id));
    };

    const handleUpdateItem = (index, field, value) => {
        const updated = [...localItems];
        if (field === 'price') {
            updated[index] = { ...updated[index], [field]: Number(value) };
        } else if (field === 'shippingCredit') {
            updated[index] = { ...updated[index], [field]: Boolean(value) };
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }
        setLocalItems(updated);
    };

    const handleSave = () => {
        onSave(localItems);
        setIsEditing(false);
    };

    return (
        <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4>{title}</h4>
                <s-button size="small" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? 'Cancel' : 'Edit'}
                </s-button>
            </div>

            {!isEditing && (
                <div style={{ display: 'grid', gap: '10px' }}>
                    {localItems.map(item => (
                        <div key={item.id} style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                            <div style={{ fontWeight: 'bold' }}>{item.label}</div>
                            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '4px' }}>
                                {fields.includes('price') && <div>Price: ${item.price.toFixed(2)}</div>}
                                {fields.includes('shippingCredit') && <div>Shipping Credit Eligible: {item.shippingCredit ? 'Yes' : 'No'}</div>}
                            </div>
                        </div>
                    ))}
                    {localItems.length === 0 && <s-text tone="subdued">No items configured</s-text>}
                </div>
            )}

            {isEditing && (
                <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                    <div style={{ display: 'grid', gap: '10px', marginBottom: '15px' }}>
                        {localItems.map((item, index) => (
                            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: fields.includes('shippingCredit') ? 'repeat(2, 1fr) auto auto' : 'repeat(2, 1fr) auto', gap: '10px', alignItems: 'end' }}>
                                <s-text-field
                                    label="Label"
                                    value={item.label}
                                    onInput={(e) => handleUpdateItem(index, 'label', e.currentTarget.value)}
                                />
                                {fields.includes('price') && (
                                    <s-text-field
                                        type="number"
                                        label="Price"
                                        value={String(item.price)}
                                        step="0.01"
                                        min="0"
                                        onInput={(e) => handleUpdateItem(index, 'price', e.currentTarget.value)}
                                    />
                                )}
                                {fields.includes('shippingCredit') && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px' }}>
                                        <input
                                            type="checkbox"
                                            id={`shipping-credit-${item.id}`}
                                            checked={item.shippingCredit || false}
                                            onChange={(e) => handleUpdateItem(index, 'shippingCredit', e.target.checked)}
                                        />
                                        <label htmlFor={`shipping-credit-${item.id}`} style={{ margin: 0, cursor: 'pointer' }}>
                                            Shipping Credit
                                        </label>
                                    </div>
                                )}
                                <s-button variant="destructive" size="small" onClick={() => handleRemoveItem(item.id)}>
                                    Remove
                                </s-button>
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#fff', borderRadius: '4px', marginBottom: '15px', border: '1px solid #ddd' }}>
                        <h5 style={{ marginTop: 0 }}>Add New Item</h5>
                        <div style={{ display: 'grid', gap: '10px' }}>
                            <s-text-field
                                label="ID"
                                placeholder="e.g., standard"
                                value={newItem.id}
                                onInput={(e) => setNewItem({ ...newItem, id: e.currentTarget.value })}
                            />
                            <s-text-field
                                label="Label"
                                placeholder="e.g., Standard Cleaning"
                                value={newItem.label}
                                onInput={(e) => setNewItem({ ...newItem, label: e.currentTarget.value })}
                            />
                            {fields.includes('price') && (
                                <s-text-field
                                    type="number"
                                    label="Price"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    value={String(newItem.price)}
                                    onInput={(e) => setNewItem({ ...newItem, price: e.currentTarget.value })}
                                />
                            )}
                            {fields.includes('shippingCredit') && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="checkbox"
                                        id="shipping-credit-new"
                                        checked={newItem.shippingCredit || false}
                                        onChange={(e) => setNewItem({ ...newItem, shippingCredit: e.target.checked })}
                                    />
                                    <label htmlFor="shipping-credit-new" style={{ margin: 0, cursor: 'pointer' }}>
                                        Shipping Credit Eligible
                                    </label>
                                </div>
                            )}
                            <s-button onClick={handleAddItem}>Add Item</s-button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <s-button onClick={() => setIsEditing(false)}>Cancel</s-button>
                        <s-button variant="primary" onClick={handleSave}>Save Changes</s-button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Component for editing shipping boxes
function ShippingBoxLibraryEditor({ boxes, onSave }) {
    const [localBoxes, setLocalBoxes] = useState(boxes || []);
    const [isEditing, setIsEditing] = useState(false);
    const [newBox, setNewBox] = useState({ sneakerQuantity: 1, length: 0, width: 0, height: 0, boxWeightLb: 0 });

    const handleAddBox = () => {
        if (newBox.sneakerQuantity && newBox.length && newBox.width && newBox.height) {
            setLocalBoxes([...localBoxes, { ...newBox, sneakerQuantity: Number(newBox.sneakerQuantity) }]);
            setNewBox({ sneakerQuantity: 1, length: 0, width: 0, height: 0, boxWeightLb: 0 });
        }
    };

    const handleRemoveBox = (quantity) => {
        setLocalBoxes(localBoxes.filter(b => b.sneakerQuantity !== quantity));
    };

    const handleUpdateBox = (quantity, field, value) => {
        const updated = localBoxes.map(b =>
            b.sneakerQuantity === quantity ? { ...b, [field]: Number(value) } : b
        );
        setLocalBoxes(updated);
    };

    const handleSave = () => {
        onSave(localBoxes.sort((a, b) => a.sneakerQuantity - b.sneakerQuantity));
        setIsEditing(false);
    };

    return (
        <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4>Shipping Box Library</h4>
                <s-button size="small" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? 'Cancel' : 'Edit'}
                </s-button>
            </div>

            {!isEditing && (
                <div style={{ display: 'grid', gap: '10px' }}>
                    {localBoxes.map(box => (
                        <div key={box.sneakerQuantity} style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                            <div style={{ fontWeight: 'bold' }}>{box.sneakerQuantity} Pair(s)</div>
                            <div style={{ fontSize: '0.9em', color: '#666' }}>
                                L×W×H: {box.length}×{box.width}×{box.height} in | Weight: {box.boxWeightLb} lb
                            </div>
                        </div>
                    ))}
                    {localBoxes.length === 0 && <s-text tone="subdued">No boxes configured</s-text>}
                </div>
            )}

            {isEditing && (
                <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                    <div style={{ display: 'grid', gap: '10px', marginBottom: '15px' }}>
                        {localBoxes.map(box => (
                            <div key={box.sneakerQuantity} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: '10px', alignItems: 'end' }}>
                                <s-text-field
                                    type="number"
                                    label="Qty"
                                    value={String(box.sneakerQuantity)}
                                    min="1"
                                    disabled
                                />
                                <s-text-field
                                    type="number"
                                    label="Length"
                                    value={String(box.length)}
                                    step="0.1"
                                    onInput={(e) => handleUpdateBox(box.sneakerQuantity, 'length', e.currentTarget.value)}
                                />
                                <s-text-field
                                    type="number"
                                    label="Width"
                                    value={String(box.width)}
                                    step="0.1"
                                    onInput={(e) => handleUpdateBox(box.sneakerQuantity, 'width', e.currentTarget.value)}
                                />
                                <s-text-field
                                    type="number"
                                    label="Height"
                                    value={String(box.height)}
                                    step="0.1"
                                    onInput={(e) => handleUpdateBox(box.sneakerQuantity, 'height', e.currentTarget.value)}
                                />
                                <s-text-field
                                    type="number"
                                    label="Box Weight"
                                    value={String(box.boxWeightLb)}
                                    step="0.1"
                                    onInput={(e) => handleUpdateBox(box.sneakerQuantity, 'boxWeightLb', e.currentTarget.value)}
                                />
                                <s-button variant="destructive" size="small" onClick={() => handleRemoveBox(box.sneakerQuantity)}>
                                    Remove
                                </s-button>
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#fff', borderRadius: '4px', marginBottom: '15px', border: '1px solid #ddd' }}>
                        <h5 style={{ marginTop: 0 }}>Add New Box Configuration</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: '10px' }}>
                            <s-text-field
                                type="number"
                                label="Quantity"
                                value={String(newBox.sneakerQuantity)}
                                min="1"
                                onInput={(e) => setNewBox({ ...newBox, sneakerQuantity: e.currentTarget.value })}
                            />
                            <s-text-field
                                type="number"
                                label="Length"
                                step="0.1"
                                value={String(newBox.length)}
                                onInput={(e) => setNewBox({ ...newBox, length: e.currentTarget.value })}
                            />
                            <s-text-field
                                type="number"
                                label="Width"
                                step="0.1"
                                value={String(newBox.width)}
                                onInput={(e) => setNewBox({ ...newBox, width: e.currentTarget.value })}
                            />
                            <s-text-field
                                type="number"
                                label="Height"
                                step="0.1"
                                value={String(newBox.height)}
                                onInput={(e) => setNewBox({ ...newBox, height: e.currentTarget.value })}
                            />
                            <s-text-field
                                type="number"
                                label="Weight"
                                step="0.1"
                                value={String(newBox.boxWeightLb)}
                                onInput={(e) => setNewBox({ ...newBox, boxWeightLb: e.currentTarget.value })}
                            />
                            <s-button onClick={handleAddBox}>Add</s-button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <s-button onClick={() => setIsEditing(false)}>Cancel</s-button>
                        <s-button variant="primary" onClick={handleSave}>Save Changes</s-button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Settings() {
    const [loadingType, setLoadingType] = useState(null);
    const [isFetching, setIsFetching] = useState(true);
    const [activeTab, setActiveTab] = useState('shipping');

    // Shipping settings
    const [bufferPercentage, setBufferPercentage] = useState('0');
    const [shippingCreditPerPair, setShippingCreditPerPair] = useState('10');
    const [sneakerWeightLb, setSneakerWeightLb] = useState('4');
    const [isShippingDirty, setIsShippingDirty] = useState(false);

    // Cleaning tiers
    const [cleaningTiers, setCleaningTiers] = useState([]);

    // Add-ons
    const [addOns, setAddOns] = useState([]);

    // Quoted services
    const [quotedServices, setQuotedServices] = useState([]);

    // Shipping box library
    const [shippingBoxLibrary, setShippingBoxLibrary] = useState([]);

    // Booking questions
    const [highValueDisclosureLabel, setHighValueDisclosureLabel] = useState('');
    const [highValueAcknowledgmentLabel, setHighValueAcknowledgmentLabel] = useState('');
    const [isQuestionsDirty, setIsQuestionsDirty] = useState(false);

    // Alteration options
    const [alterationOptions, setAlterationOptions] = useState([]);

    // Policy references
    const [policyReferences, setPolicyReferences] = useState([]);

    // Acknowledgments
    const [agreementAcknowledgment, setAgreementAcknowledgment] = useState('');
    const [shippingInstructionsDisclaimer, setShippingInstructionsDisclaimer] = useState('');
    const [isAcknowledgmentsDirty, setIsAcknowledgmentsDirty] = useState(false);

    // Booking statuses
    const [bookingStatuses, setBookingStatuses] = useState([]);
    const [newStatus, setNewStatus] = useState('');
    const [isStatusesDirty, setIsStatusesDirty] = useState(false);

    // Handoff method visibility toggles
    const [handoffMethods, setHandoffMethods] = useState({ dropoff: true, shipping: true, pickup_delivery: true });
    const [isHandoffMethodsDirty, setIsHandoffMethodsDirty] = useState(false);

    useEffect(() => {
        fetch("/api/get/settings")
            .then(res => res.json())
            .then(data => {
                if (data.returnShippingBufferPercentage !== undefined) setBufferPercentage(String(data.returnShippingBufferPercentage));
                if (data.shippingCreditPerPair !== undefined) setShippingCreditPerPair(String(data.shippingCreditPerPair));
                if (data.sneakerWeightLb !== undefined) setSneakerWeightLb(String(data.sneakerWeightLb));

                if (data.cleaningTiers) setCleaningTiers(data.cleaningTiers);
                if (data.addOns) setAddOns(data.addOns);
                if (data.quotedServices) setQuotedServices(data.quotedServices);
                if (data.shippingBoxLibrary) setShippingBoxLibrary(data.shippingBoxLibrary);

                if (data.highValueDisclosureLabel !== undefined) setHighValueDisclosureLabel(data.highValueDisclosureLabel);
                if (data.highValueAcknowledgmentLabel !== undefined) setHighValueAcknowledgmentLabel(data.highValueAcknowledgmentLabel);

                if (data.alterationOptions) setAlterationOptions(data.alterationOptions);
                if (data.policyReferences) setPolicyReferences(data.policyReferences);

                if (data.agreementAcknowledgment !== undefined) setAgreementAcknowledgment(data.agreementAcknowledgment);
                if (data.shippingInstructionsDisclaimer !== undefined) setShippingInstructionsDisclaimer(data.shippingInstructionsDisclaimer);

                if (data.bookingStatuses) setBookingStatuses(data.bookingStatuses);
                if (data.handoffMethods) setHandoffMethods(prev => ({ ...prev, ...data.handoffMethods }));

                setIsFetching(false);
            })
            .catch(err => {
                console.error("Failed to load settings:", err);
                shopify.toast.show("Failed to load settings", { isError: true });
                setIsFetching(false);
            });
    }, []);

    const handleActionResponse = (data) => {
        shopify.toast.show(
            data.message,
            data.success ? undefined : { isError: true },
        );

        if (data.success) {
            if (data.message.includes('Shipping')) setIsShippingDirty(false);
            if (data.message.includes('Booking questions')) setIsQuestionsDirty(false);
            if (data.message.includes('Acknowledgments')) setIsAcknowledgmentsDirty(false);
            if (data.message.includes('Booking statuses')) setIsStatusesDirty(false);
            if (data.message.includes('Handoff methods')) setIsHandoffMethodsDirty(false);
        }
        setLoadingType(null);
    };

    const submitData = (body) => {
        setLoadingType(body.settingType);
        fetch("/api/update/settings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })
            .then(res => res.json())
            .then(handleActionResponse)
            .catch(err => {
                console.error("Failed to update settings:", err);
                shopify.toast.show("Failed to update settings", { isError: true });
                setLoadingType(null);
            });
    };

    const handleSaveShippingSettings = () => {
        submitData({
            settingType: "shipping",
            returnShippingBufferPercentage: bufferPercentage,
            shippingCreditPerPair: shippingCreditPerPair,
            sneakerWeightLb: sneakerWeightLb
        });
    };

    const handleSaveCleaningTiers = (tiers) => {
        submitData({ settingType: "cleaningTiers", tiers });
    };

    const handleSaveAddOns = (addOnsData) => {
        submitData({ settingType: "addOns", addOns: addOnsData });
    };

    const handleSaveQuotedServices = (servicesData) => {
        submitData({ settingType: "quotedServices", quotedServices: servicesData });
    };

    const handleSaveShippingBoxLibrary = (boxLibrary) => {
        submitData({ settingType: "shippingBoxLibrary", boxLibrary });
    };

    const handleSaveBookingQuestions = () => {
        submitData({
            settingType: "bookingQuestions",
            disclosureLabel: highValueDisclosureLabel,
            acknowledgmentLabel: highValueAcknowledgmentLabel
        });
    };

    const handleSaveAlterationOptions = (options) => {
        submitData({ settingType: "alterationOptions", options });
    };

    const handleSavePolicyReferences = (policies) => {
        submitData({ settingType: "policyReferences", policies });
    };

    const handleSaveAcknowledgments = () => {
        submitData({
            settingType: "acknowledgments",
            acknowledgments: {
                agreementAcknowledgment,
                shippingInstructionsDisclaimer,
            }
        });
    };

    const handleSaveBookingStatuses = () => {
        submitData({ settingType: "bookingStatuses", statuses: bookingStatuses });
    };

    const handleSaveHandoffMethods = () => {
        submitData({ settingType: "handoffMethods", handoffMethods });
    };

    const handleAddBookingStatus = () => {
        if (newStatus && !bookingStatuses.includes(newStatus)) {
            setBookingStatuses([...bookingStatuses, newStatus]);
            setNewStatus('');
        }
    };

    const handleRemoveBookingStatus = (status) => {
        setBookingStatuses(bookingStatuses.filter(s => s !== status));
    };

    if (isFetching) {
        return (
            <s-page heading="Settings" subtitle="Configure business logic and customer-facing text.">
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <s-text tone="subdued">Loading settings...</s-text>
                </div>
            </s-page>
        );
    }

    return (
        <s-page
            heading="Settings"
            subtitle="Configure business logic and customer-facing text."
        >
            <div className="main_wrapper">
                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px', overflowX: 'auto' }}>
                    {[
                        { id: 'shipping', label: 'Shipping' },
                        { id: 'services', label: 'Services' },
                        { id: 'boxes', label: 'Shipping Boxes' },
                        { id: 'questions', label: 'Booking Questions' },
                        { id: 'disclaimers', label: 'Other Acknowledgments' },
                        { id: 'statuses', label: 'Booking Statuses' },
                    ].map(tab => (
                        <s-button
                            key={tab.id}
                            variant={activeTab === tab.id ? 'primary' : 'secondary'}
                            size="small"
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </s-button>
                    ))}
                </div>

                {/* Shipping Tab */}
                {activeTab === 'shipping' && (
                    <s-section heading="Shipping & Pricing Configuration">
                        <div className="settings-content">
                            <s-text tone="subdued">
                                Configure shipping rates, pricing credits, and footwear weight for calculations.
                            </s-text>

                            <div className="input-wrapper" style={{ marginTop: '20px' }}>
                                <s-text-field
                                    type="number"
                                    label="Return Shipping Buffer (%)"
                                    details="Percentage added to store-to-customer shipping quotes during booking."
                                    min="0"
                                    step="0.01"
                                    value={bufferPercentage}
                                    onInput={(event) => {
                                        setBufferPercentage(event.currentTarget.value);
                                        setIsShippingDirty(true);
                                    }}
                                />
                            </div>

                            <div className="input-wrapper">
                                <s-text-field
                                    type="number"
                                    label="Shipping Credit Per Pair ($)"
                                    details="Fixed credit amount applied per footwear pair in shipping calculations."
                                    min="0"
                                    step="0.01"
                                    value={shippingCreditPerPair}
                                    onInput={(event) => {
                                        setShippingCreditPerPair(event.currentTarget.value);
                                        setIsShippingDirty(true);
                                    }}
                                />
                            </div>

                            <div className="input-wrapper">
                                <s-text-field
                                    type="number"
                                    label="Footwear Weight (lbs)"
                                    details="Default weight per footwear pair used for shipping calculations."
                                    min="0"
                                    step="0.1"
                                    value={sneakerWeightLb}
                                    onInput={(event) => {
                                        setSneakerWeightLb(event.currentTarget.value);
                                        setIsShippingDirty(true);
                                    }}
                                />
                            </div>

                            <div className="settings-actions" style={{ marginTop: '20px' }}>
                                <s-button
                                    variant="primary"
                                    loading={loadingType === 'shipping' ? true : undefined}
                                    disabled={loadingType !== null || !isShippingDirty ? true : undefined}
                                    onClick={handleSaveShippingSettings}
                                >
                                    Save Shipping Settings
                                </s-button>
                            </div>

                        </div>
                    </s-section>
                )}

                {/* Services Tab */}
                {activeTab === 'services' && (
                    <s-section heading="Service Configuration">
                        <div className="settings-content">
                            <s-text tone="subdued">
                                Manage cleaning tiers, optional add-ons, and quoted services available to customers.
                                Tooltip descriptions and Learn More links are shown to customers via the info icon in the booking flow.
                            </s-text>

                            <div style={{ marginTop: '20px' }}>
                                <EditableCleaningTiersComponent
                                    items={cleaningTiers}
                                    onSave={(tiers) => {
                                        setCleaningTiers(tiers);
                                        handleSaveCleaningTiers(tiers);
                                    }}
                                />
                            </div>

                            <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                            <div>
                                <EditableAddOnsComponent
                                    items={addOns}
                                    onSave={(items) => {
                                        setAddOns(items);
                                        handleSaveAddOns(items);
                                    }}
                                />
                            </div>

                            <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                            <div>
                                <EditableQuotedServicesComponent
                                    items={quotedServices}
                                    onSave={(items) => {
                                        setQuotedServices(items);
                                        handleSaveQuotedServices(items);
                                    }}
                                />
                            </div>

                            <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                            <div>
                                <h4 style={{ marginBottom: '6px' }}>Handoff Methods</h4>
                                <p style={{ fontSize: '0.85em', color: '#666', margin: '0 0 14px' }}>
                                    Choose which delivery options are shown to customers during the booking flow.
                                </p>
                                {[
                                    { key: 'dropoff', label: 'Drop-Off' },
                                    { key: 'shipping', label: 'Shipping' },
                                    { key: 'pickup_delivery', label: 'Pickup & Return' },
                                ].map(({ key, label }) => (
                                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <input
                                            type="checkbox"
                                            id={`handoff-${key}`}
                                            checked={handoffMethods[key] !== false}
                                            onChange={(e) => {
                                                setHandoffMethods(prev => ({ ...prev, [key]: e.target.checked }));
                                                setIsHandoffMethodsDirty(true);
                                            }}
                                        />
                                        <label htmlFor={`handoff-${key}`} style={{ margin: 0, cursor: 'pointer' }}>{label}</label>
                                    </div>
                                ))}
                                <div className="settings-actions" style={{ marginTop: '12px' }}>
                                    <s-button
                                        variant="primary"
                                        loading={loadingType === 'handoffMethods' ? true : undefined}
                                        disabled={loadingType !== null || !isHandoffMethodsDirty ? true : undefined}
                                        onClick={handleSaveHandoffMethods}
                                    >
                                        Save Handoff Methods
                                    </s-button>
                                </div>
                            </div>
                        </div>
                    </s-section>
                )}

                {/* Shipping Boxes Tab */}
                {activeTab === 'boxes' && (
                    <s-section heading="Shipping Box Library">
                        <div className="settings-content">
                            <s-text tone="subdued">
                                Define box dimensions and weight for each footwear quantity. Used for shipping rate calculations.
                            </s-text>

                            <div style={{ marginTop: '20px' }}>
                                <ShippingBoxLibraryEditor
                                    boxes={shippingBoxLibrary}
                                    onSave={(boxes) => {
                                        setShippingBoxLibrary(boxes);
                                        handleSaveShippingBoxLibrary(boxes);
                                    }}
                                />
                            </div>
                        </div>
                    </s-section>
                )}

                {/* Booking Questions Tab */}
                {activeTab === 'questions' && (
                    <s-section heading="Booking Questions & Disclosures">
                        <div className="settings-content">
                            <s-text tone="subdued">
                                Customize questions and disclosures shown during the booking process.
                            </s-text>

                            <div className="input-wrapper" style={{ marginTop: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>High Value Item Disclosure Question</label>
                                <textarea
                                    style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'inherit' }}
                                    value={highValueDisclosureLabel}
                                    onChange={(e) => {
                                        setHighValueDisclosureLabel(e.currentTarget.value);
                                        setIsQuestionsDirty(true);
                                    }}
                                    placeholder="Enter the disclosure question..."
                                />
                            </div>

                            <div className="input-wrapper">
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>High Value Item Acknowledgment</label>
                                <textarea
                                    style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'inherit' }}
                                    value={highValueAcknowledgmentLabel}
                                    onChange={(e) => {
                                        setHighValueAcknowledgmentLabel(e.currentTarget.value);
                                        setIsQuestionsDirty(true);
                                    }}
                                    placeholder="Enter the acknowledgment text..."
                                />
                            </div>

                            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                            <div>
                                <EditableItemList
                                    items={alterationOptions}
                                    onSave={(options) => {
                                        setAlterationOptions(options);
                                        handleSaveAlterationOptions(options);
                                    }}
                                    title="Alteration History Options"
                                    fields={['label']}
                                />
                            </div>

                            <div className="settings-actions" style={{ marginTop: '20px' }}>
                                <s-button
                                    variant="primary"
                                    loading={loadingType === 'bookingQuestions' ? true : undefined}
                                    disabled={loadingType !== null || !isQuestionsDirty ? true : undefined}
                                    onClick={handleSaveBookingQuestions}
                                >
                                    Save Booking Questions
                                </s-button>
                            </div>
                        </div>
                    </s-section>
                )}

                {/* Acknowledgments & Disclaimers Tab */}
                {activeTab === 'disclaimers' && (
                    <s-section heading="Acknowledgments & Disclaimers">
                        <div className="settings-content">
                            <s-text tone="subdued">
                                Customize acknowledgments and disclaimers shown to customers at various steps.
                            </s-text>

                            <div className="input-wrapper">
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Agreement Acknowledgment</label>
                                <textarea
                                    style={{ width: '100%', minHeight: '120px', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'inherit' }}
                                    value={agreementAcknowledgment}
                                    onChange={(e) => {
                                        setAgreementAcknowledgment(e.currentTarget.value);
                                        setIsAcknowledgmentsDirty(true);
                                    }}
                                    placeholder="Enter agreement acknowledgment text..."
                                />
                                <div
                                    style={{
                                        marginTop: '6px',
                                        fontSize: '13px',
                                        color: '#666',
                                        lineHeight: '1.5',
                                    }}
                                >
                                    Please do not remove the <strong>{'{{PolicyReferences}}'}</strong> placeholder.
                                    The configured policy reference links will automatically appear in that location on the customer-facing agreement page.
                                </div>
                            </div>

                            <div className="input-wrapper">
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Shipping Instructions & Disclaimer</label>
                                <textarea
                                    style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'inherit' }}
                                    value={shippingInstructionsDisclaimer}
                                    onChange={(e) => {
                                        setShippingInstructionsDisclaimer(e.currentTarget.value);
                                        setIsAcknowledgmentsDirty(true);
                                    }}
                                    placeholder="Enter shipping instructions and disclaimer..."
                                />
                            </div>

                            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                            <div>
                                <EditableItemList
                                    items={policyReferences}
                                    onSave={(policies) => {
                                        setPolicyReferences(policies);
                                        handleSavePolicyReferences(policies);
                                    }}
                                    title="Policy References"
                                    fields={['label']}
                                />
                            </div>

                            <div className="settings-actions" style={{ marginTop: '20px' }}>
                                <s-button
                                    variant="primary"
                                    loading={loadingType === 'acknowledgments' ? true : undefined}
                                    disabled={loadingType !== null || !isAcknowledgmentsDirty ? true : undefined}
                                    onClick={handleSaveAcknowledgments}
                                >
                                    Save Acknowledgments
                                </s-button>
                            </div>
                        </div>
                    </s-section>
                )}

                {/* Booking Statuses Tab */}
                {activeTab === 'statuses' && (
                    <s-section heading="Booking Order Statuses">
                        <div className="settings-content">
                            <s-text tone="subdued">
                                Define the booking statuses available in the system. These appear in the booking management interface.
                            </s-text>

                            <div style={{ marginTop: '20px' }}>
                                <h4>Current Statuses</h4>
                                <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
                                    {bookingStatuses.map(status => (
                                        <div key={status} style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>{status}</span>
                                            <s-button
                                                variant="destructive"
                                                size="small"
                                                onClick={() => {
                                                    handleRemoveBookingStatus(status);
                                                    setIsStatusesDirty(true);
                                                }}
                                            >
                                                Remove
                                            </s-button>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '20px' }}>
                                    <h5 style={{ marginTop: 0 }}>Add New Status</h5>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <s-text-field
                                            style={{ flex: 1 }}
                                            placeholder="Enter new status"
                                            value={newStatus}
                                            onInput={(e) => setNewStatus(e.currentTarget.value)}
                                        />
                                        <s-button onClick={() => {
                                            handleAddBookingStatus();
                                            setIsStatusesDirty(true);
                                        }}>Add Status</s-button>
                                    </div>
                                </div>
                            </div>

                            <div className="settings-actions">
                                <s-button
                                    variant="primary"
                                    loading={loadingType === 'bookingStatuses' ? true : undefined}
                                    disabled={loadingType !== null || !isStatusesDirty ? true : undefined}
                                    onClick={handleSaveBookingStatuses}
                                >
                                    Save Booking Statuses
                                </s-button>
                            </div>
                        </div>
                    </s-section>
                )}
            </div>
        </s-page>
    );
}