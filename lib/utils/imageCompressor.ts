/**
 * Nén ảnh client-side bằng HTML5 Canvas (0đ chi phí vận hành):
 * - Giảm kích thước ảnh về tối đa 800x600 (tỷ lệ chuẩn 4:3 của app)
 * - Nén định dạng JPEG chất lượng 0.8
 * - Giảm dung lượng từ 5MB - 15MB xuống còn ~60KB - 80KB siêu nhẹ
 * - Trả về base64 data URL và Blob để upload hoặc lưu offline
 */
export async function compressImage(
  file: File,
  maxWidth = 800,
  maxHeight = 600,
  quality = 0.8
): Promise<{ dataUrl: string; blob: Blob; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    // Kiểm tra định dạng file
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Tệp tải lên không phải là định dạng hình ảnh'))
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Lỗi đọc file ảnh từ thiết bị'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Không thể tải dữ liệu ảnh'))
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Tính toán kích thước mới giữ nguyên tỉ lệ khung hình
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return reject(new Error('Không thể khởi tạo Canvas 2D context'))
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL('image/jpeg', quality)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Lỗi chuyển đổi ảnh sang Blob'))
            }
            const sizeKb = Math.round(blob.size / 1024)
            resolve({ dataUrl, blob, sizeKb })
          },
          'image/jpeg',
          quality
        )
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}
