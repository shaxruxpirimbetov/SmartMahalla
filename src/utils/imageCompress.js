// A phone/camera photo picked in an Admin form can easily be several MB -
// held as a base64 data URL in the form's React state the whole time it's
// being edited (see FieldsFormModal.jsx handleImageChange), then uploaded as
// a real file to Tadbirkorlar.image/Farmer.photo (see dataUrlToBlob below +
// src/services/api.js). None of these photos are ever displayed larger than
// a small map-popup thumbnail, so there's no reason to keep the original
// resolution - this downsamples to a sane max dimension and re-encodes as
// JPEG before it ever becomes a data URL, typically shrinking a multi-MB
// photo down to tens of KB, both for a snappier in-form preview and a
// smaller upload.
export function compressImageFile(file, { maxDimension = 640, quality = 0.72 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Faylni oʻqib boʻlmadi.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Rasmni dekodlab boʻlmadi.'));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale) || 1;
        canvas.height = Math.round(img.height * scale) || 1;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// The inverse of the above: FieldsFormModal keeps a picked photo as a
// base64 data URL in its form state the whole time (see handleImageChange
// there), but the real Tadbirkorlar/Farmer endpoints (apps/mahalla,
// apps/land models.py) take a real uploaded file (ImageField), which means
// a multipart/form-data POST - see src/services/api.js's `toFormData`. This
// converts the data URL back into a Blob right before that POST, so the
// data-URL representation never has to leak past api.js.
export function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mime = /data:(.*);base64/.exec(header)?.[1] ?? 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}
