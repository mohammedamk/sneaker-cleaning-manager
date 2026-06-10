import React, { useState } from 'react';
import StepLayout from '../../shared/StepLayout/StepLayout.jsx';
import FormField from '../../shared/FormField/FormField.jsx';
import ImageUploader from '../../shared/ImageUploader/ImageUploader.jsx';
import './SneakerRegistrationStep.css';

const SIZE_UNITS = ['US', 'US M', 'US W', 'UK', 'EU'];

const EMPTY_SNEAKER = {
  id: null,
  nickname: '',
  brand: '',
  model: '',
  colorway: '',
  size: '',
  sizeUnit: '',
  images: [],
};

function SneakerRegistrationStep({ editingSneaker, onSave, onPrev }) {
  const initial = React.useMemo(() => {
    if (editingSneaker) {
      return {
        ...editingSneaker,
        images: (editingSneaker.images || []).map(img =>
          typeof img === 'string'
            ? { preview: img, url: img }
            : { ...img, preview: img.preview || img.url }
        )
      };
    }
    return { ...EMPTY_SNEAKER, id: Date.now() };
  }, [editingSneaker]);

  const [form, setForm] = useState(initial);

  React.useEffect(() => {
    setForm(initial);
  }, [initial]);

  const [errors, setErrors] = useState({});

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // sizeUnit and size share the same error row — clear both when either changes
    if (field === 'sizeUnit' || field === 'size') {
      setErrors((prev) => ({ ...prev, sizeUnit: '', size: '' }));
    } else if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.nickname.trim())            newErrors.nickname  = 'Footwear nickname is required.';
    if (!form.brand.trim())               newErrors.brand     = 'Brand is required.';
    if (!form.model.trim())               newErrors.model     = 'Model is required.';
    if (!form.colorway.trim())            newErrors.colorway  = 'Colorway is required.';
    if (!form.sizeUnit)                   newErrors.sizeUnit  = 'Please select a size type.';
    if (!String(form.size).trim())        newErrors.size      = 'Size is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) onSave(form);
  };

  return (
    <StepLayout
      title={editingSneaker ? 'Edit Footwear' : 'Register Your Footwear'}
      onNext={handleSave}
      onPrev={onPrev}
      nextLabel="Save Footwear"
    >
      <FormField
        label="Footwear Nickname"
        required
        error={errors.nickname}
        tooltip="Give this pair a nickname so you can easily recognize it later. It helps everyone identify the footwear throughout the cleaning process. This can be anything simple like 'My Favorite AF1s' or 'Work Boots'."
      >
        <input
          className="input"
          type="text"
          placeholder='e.g. "My Jordan 1s"'
          value={form.nickname}
          onChange={(e) => setField('nickname', e.target.value)}
        />
      </FormField>

      <FormField label="Brand" required error={errors.brand}>
        <input
          className="input"
          type="text"
          placeholder="e.g. Nike, Adidas"
          value={form.brand}
          onChange={(e) => setField('brand', e.target.value)}
        />
      </FormField>

      <FormField label="Model" required error={errors.model}>
        <input
          className="input"
          type="text"
          placeholder="e.g. Air Jordan 1, Yeezy 350"
          value={form.model}
          onChange={(e) => setField('model', e.target.value)}
        />
      </FormField>

      <FormField
        label="Colorway"
        required
        error={errors.colorway}
        tooltip="Enter the official color combination name, such as 'Concrete', or describe the main colors, such as 'Grey and White'."
      >
        <input
          className="input"
          type="text"
          placeholder="e.g. Chicago, Bred"
          value={form.colorway}
          onChange={(e) => setField('colorway', e.target.value)}
        />
      </FormField>

      <FormField label="Size" required error={errors.sizeUnit || errors.size}>
        <div className="size-selector">
          <select
            className="select"
            value={form.sizeUnit}
            onChange={(e) => setField('sizeUnit', e.target.value)}
          >
            <option value="" disabled>Select Type</option>
            {SIZE_UNITS.map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
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

      <FormField label="Footwear Photos">
        <ImageUploader
          images={form.images}
          onImagesChange={(imgs) => setField('images', imgs)}
        />
      </FormField>
    </StepLayout>
  );
}

export default SneakerRegistrationStep;
