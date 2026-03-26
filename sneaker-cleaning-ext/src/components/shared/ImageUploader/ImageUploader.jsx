import React, { useRef } from 'react';
import './ImageUploader.css';

function ImageUploader({ images, onImagesChange }) {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    onImagesChange([...images, ...newImages]);
    // resetting input so the same file can be re-selected
    e.target.value = '';
  };

  const handleRemove = (index) => {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  };

  return (
    <div className="image-uploader">
      <div className="image-uploader__previews">
        {images.map((img, index) => (
          <div key={index} className="image-uploader__preview-item">
            <img
              src={img.preview || img.url || img}
              alt={`Sneaker ${index + 1}`}
              className="image-uploader__preview-img"
            />
            <button
              type="button"
              className="image-uploader__remove-btn"
              onClick={() => handleRemove(index)}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="image-uploader__add-btn"
          onClick={() => inputRef.current.click()}
        >
          + Add Photo
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="image-uploader__input"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default ImageUploader;
