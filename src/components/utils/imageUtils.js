const MAX_SIZE = 400;
const QUALITY = 0.85;

/**
 * Resizes any image file to a square MAX_SIZExMAX_SIZE WebP with center crop.
 * Accepts any format (JPEG, PNG, HEIC, WEBP, GIF, etc.).
 * @param {File} file
 * @returns {Promise<File>}
 */
export function resizeToAvatar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = /** @type {string} */ (event.target.result);
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, size, size, 0, 0, MAX_SIZE, MAX_SIZE);

        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('Canvas to Blob failed')); return; }
          resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
            type: 'image/webp',
            lastModified: Date.now(),
          }));
        }, 'image/webp', QUALITY);
      };
      img.onerror = () => reject(new Error('Image load failed'));
    };
    reader.onerror = () => reject(new Error('File read failed'));
  });
}
