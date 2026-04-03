import React, { useState } from 'react';
import FormField from '../../shared/FormField/FormField.jsx';
import ImageUploader from '../../shared/ImageUploader/ImageUploader.jsx';
import './ShoeRackSneakerStep.css';

const SIZE_UNITS = ['US', 'UK', 'EU'];

const EMPTY_SNEAKER = {
  id: null,
  nickname: '',
  brand: '',
  model: '',
  colorway: '',
  size: '',
  sizeUnit: 'US',
  images: [],
};

function ShoeRackSneakerStep({ editingSneaker, onSave, onCancel }) {
  const initial = React.useMemo(() => {
    if (editingSneaker) {
      return {
        ...editingSneaker,
        images: (editingSneaker.images || []).map(img =>
          typeof img === 'string'
            ? { preview: img, url: img }
            : { ...img, preview: img.url || img.preview }
        )
      };
    }
    return { ...EMPTY_SNEAKER, id: Date.now() };
  }, [editingSneaker]);

  const [form, setForm] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);

  // syncing form if editingSneaker changes while component is mounted
  React.useEffect(() => {
    setForm(initial);
  }, [initial]);

  const [errors, setErrors] = useState({});

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.nickname.trim()) newErrors.nickname = 'Sneaker nickname is required.';
    if (form.images.length === 0) newErrors.images = 'Please upload at least one image.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || isSaving) return;

    try {
      setIsSaving(true);
      await Promise.resolve(onSave(form));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="shoe-rack-sneaker-form">
      <div className="shoe-rack-sneaker-form__header">
        <h2 className="shoe-rack-sneaker-form__title">
          {editingSneaker ? 'Edit Sneaker Details' : 'Add New Sneaker to Rack'}
        </h2>
      </div>

      <div className="shoe-rack-sneaker-form__body">
        <FormField label="Sneaker Nickname" required error={errors.nickname}>
          <input
            className="input"
            type="text"
            placeholder='e.g. "My Jordan 1s"'
            value={form.nickname}
            onChange={(e) => setField('nickname', e.target.value)}
          />
        </FormField>

        <FormField label="Brand">
          <input
            className="input"
            type="text"
            placeholder="e.g. Nike, Adidas"
            value={form.brand}
            onChange={(e) => setField('brand', e.target.value)}
          />
        </FormField>

        <FormField label="Model">
          <input
            className="input"
            type="text"
            placeholder="e.g. Air Jordan 1, Yeezy 350"
            value={form.model}
            onChange={(e) => setField('model', e.target.value)}
          />
        </FormField>

        <FormField label="Colorway">
          <input
            className="input"
            type="text"
            placeholder="e.g. Chicago, Bred"
            value={form.colorway}
            onChange={(e) => setField('colorway', e.target.value)}
          />
        </FormField>

        <FormField label="Size">
          <div className="size-selector">
            <select
              className="select"
              value={form.sizeUnit}
              onChange={(e) => setField('sizeUnit', e.target.value)}
            >
              {SIZE_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              min="1"
              max="60"
              step="0.5"
              placeholder="10"
              value={form.size}
              onChange={(e) => setField('size', e.target.value)}
            />
          </div>
        </FormField>

        <FormField label="Sneaker Photos" required error={errors.images}>
          <ImageUploader
            images={form.images}
            onImagesChange={(imgs) => setField('images', imgs)}
          />
        </FormField>
      </div>

      <div className="shoe-rack-sneaker-form__footer">
        <button className="btn btn--secondary" onClick={onCancel} disabled={isSaving}>Cancel</button>
        <button className="btn btn--primary shoe-rack-sneaker-form__save-btn" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <span className="shoe-rack-sneaker-form__spinner" aria-hidden="true" />
              <span>{editingSneaker ? 'Saving...' : 'Adding...'}</span>
            </>
          ) : (
            editingSneaker ? 'Save Changes' : 'Add to Rack'
          )}
        </button>
      </div>
    </div>
  );
}

export default ShoeRackSneakerStep;
