/**
 * Nhận diện nhóm món ăn (sub_cuisine) và ảnh minh họa tự động từ tên quán
 */

export interface SubCuisineDetection {
  cuisine: string
  sub_cuisine: string
  imageUrl: string
}

// Bảng ảnh chất lượng cao 4:3 theo từng nhóm món ăn (Local WebP 0ms load)
const SUB_CUISINE_IMAGES: Record<string, string> = {
  com_tam: '/images/food/com_tam.webp',
  com_van_phong: '/images/food/com_van_phong.webp',
  pho: '/images/food/pho.webp',
  bun_bo: '/images/food/bun_bo.webp',
  bun_dau: '/images/food/bun_dau.webp',
  hu_tieu: '/images/food/hu_tieu.webp',
  banh_mi: '/images/food/banh_mi.webp',
  lau: '/images/food/lau.webp',
  nuong_bbq: '/images/food/nuong_bbq.webp',
  sushi_ramen: '/images/food/sushi_ramen.webp',
  do_han: '/images/food/do_han.webp',
  pizza_pasta: '/images/food/pizza_pasta.webp',
  an_vat: '/images/food/an_vat.webp',
  oc_hai_san: '/images/food/oc_hai_san.webp',
  khac: '/images/food/khac.webp'
}

/**
 * Loại bỏ dấu tiếng Việt để tìm kiếm từ khóa món ăn
 */
function removeAccents(str: string): string {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

/**
 * Tự động đoán món ăn và gán ảnh đẹp từ tên quán người dùng nhập
 */
export function detectSubCuisine(restaurantName: string): SubCuisineDetection {
  const norm = removeAccents(restaurantName)

  // 0. Buffet & Lẩu nướng cao cấp
  if (/\b(buffet|all you can eat|dookki|kichi|haidilao|manwah|hotpot story|king bbq|sumo)\b/.test(norm)) {
    return { cuisine: 'Lẩu/Nướng', sub_cuisine: 'lau', imageUrl: SUB_CUISINE_IMAGES.lau }
  }

  // 1. Cơm tấm
  if (/\b(com tam|suon bi cha)\b/.test(norm)) {
    return { cuisine: 'Cơm', sub_cuisine: 'com_tam', imageUrl: SUB_CUISINE_IMAGES.com_tam }
  }
  // 2. Phở
  if (/\b(pho)\b/.test(norm) && !/\b(pho mai)\b/.test(norm)) {
    return { cuisine: 'Bún/Phở', sub_cuisine: 'pho', imageUrl: SUB_CUISINE_IMAGES.pho }
  }
  // 3. Bún bò
  if (/\b(bun bo)\b/.test(norm)) {
    return { cuisine: 'Bún/Phở', sub_cuisine: 'bun_bo', imageUrl: SUB_CUISINE_IMAGES.bun_bo }
  }
  // 4. Bún đậu
  if (/\b(bun dau)\b/.test(norm)) {
    return { cuisine: 'Bún/Phở', sub_cuisine: 'bun_dau', imageUrl: SUB_CUISINE_IMAGES.bun_dau }
  }
  // 5. Hủ tiếu / Mì / Bánh canh
  if (/\b(hu tieu|mi quang|banh canh|mi hoanh thanh|hu tieu muc)\b/.test(norm)) {
    return { cuisine: 'Bún/Phở', sub_cuisine: 'hu_tieu', imageUrl: SUB_CUISINE_IMAGES.hu_tieu }
  }
  // 6. Bánh mì
  if (/\b(banh mi|pate)\b/.test(norm)) {
    return { cuisine: 'Ăn vặt', sub_cuisine: 'banh_mi', imageUrl: SUB_CUISINE_IMAGES.banh_mi }
  }
  // 7. Ốc / Hải sản
  if (/\b(quan oc|oc |hai san|seafood|ghe|cua)\b/.test(norm)) {
    return { cuisine: 'Ăn vặt', sub_cuisine: 'oc_hai_san', imageUrl: SUB_CUISINE_IMAGES.oc_hai_san }
  }
  // 8. Lẩu
  if (/\b(lau|hotpot)\b/.test(norm)) {
    return { cuisine: 'Lẩu/Nướng', sub_cuisine: 'lau', imageUrl: SUB_CUISINE_IMAGES.lau }
  }
  // 9. Nướng / BBQ / Bò né
  if (/\b(nuong|bbq|bo ne|xien que)\b/.test(norm)) {
    return { cuisine: 'Lẩu/Nướng', sub_cuisine: 'nuong_bbq', imageUrl: SUB_CUISINE_IMAGES.nuong_bbq }
  }
  // 10. Sushi / Ramen / Món Nhật
  if (/\b(sushi|ramen|sashimi|udon|nhat ban)\b/.test(norm)) {
    return { cuisine: 'Đồ Nhật/Hàn', sub_cuisine: 'sushi_ramen', imageUrl: SUB_CUISINE_IMAGES.sushi_ramen }
  }
  // 11. Đồ Hàn Quốc
  if (/\b(han quoc|tokbokki|kimbap|ga ran|bbq han|bibimbap)\b/.test(norm)) {
    return { cuisine: 'Đồ Nhật/Hàn', sub_cuisine: 'do_han', imageUrl: SUB_CUISINE_IMAGES.do_han }
  }
  // 12. Pizza / Pasta / Steak / Đồ Âu
  if (/\b(pizza|pasta|spaghetti|steak|burger)\b/.test(norm)) {
    return { cuisine: 'Đồ Âu', sub_cuisine: 'pizza_pasta', imageUrl: SUB_CUISINE_IMAGES.pizza_pasta }
  }
  // 13. Cơm niêu / Cơm gà / Cơm văn phòng
  if (/\b(com nieu|com ga|com van phong|com trua)\b/.test(norm)) {
    return { cuisine: 'Cơm', sub_cuisine: 'com_van_phong', imageUrl: SUB_CUISINE_IMAGES.com_van_phong }
  }
  // 14. Ăn vặt
  if (/\b(banh trang|che |tra sua|an vat|banh xeo)\b/.test(norm)) {
    return { cuisine: 'Ăn vặt', sub_cuisine: 'an_vat', imageUrl: SUB_CUISINE_IMAGES.an_vat }
  }

  // Mặc định: Món Việt khác
  return { cuisine: 'Món Việt khác', sub_cuisine: 'khac', imageUrl: SUB_CUISINE_IMAGES.khac }
}

export function getImageForSubCuisine(subCuisine: string): string {
  return SUB_CUISINE_IMAGES[subCuisine] || SUB_CUISINE_IMAGES.khac
}
