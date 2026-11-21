// Hôm nay ăn gì? - Service Worker (Offline Cache & 0ms Food Images)
const CACHE_NAME = 'hom-nay-an-gi-v1'

const PRECACHE_ASSETS = [
  '/',
  '/group',
  '/history',
  '/contribute',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/images/food/com_tam.webp',
  '/images/food/com_van_phong.webp',
  '/images/food/pho.webp',
  '/images/food/bun_bo.webp',
  '/images/food/bun_dau.webp',
  '/images/food/hu_tieu.webp',
  '/images/food/banh_mi.webp',
  '/images/food/lau.webp',
  '/images/food/nuong_bbq.webp',
  '/images/food/sushi_ramen.webp',
  '/images/food/do_han.webp',
  '/images/food/pizza_pasta.webp',
  '/images/food/an_vat.webp',
  '/images/food/oc_hai_san.webp',
  '/images/food/khac.webp',
  '/images/food/default.webp'
]

// 1. Cài đặt Service Worker và Pre-cache các ảnh món ăn & App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Một số tài nguyên tĩnh chưa cache được:', err)
      })
    })
  )
  self.skipWaiting()
})

// 2. Kích hoạt và dọn dẹp các cache phiên bản cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// 3. Xử lý Intercept Request (Chiến lược thông minh theo loại tài nguyên)
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Bỏ qua các request không phải GET hoặc chrome-extension
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return
  }

  // Chiến lược 1: Cache-First cho Ảnh món ăn (/images/food/) & Tài nguyên tĩnh Next.js (_next/static/)
  if (url.pathname.startsWith('/images/food/') || url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return networkResponse
        }).catch(() => {
          // Fallback về ảnh default nếu ảnh món ăn bị lỗi
          if (url.pathname.startsWith('/images/food/')) {
            return caches.match('/images/food/default.webp')
          }
        })
      })
    )
    return
  }

  // Chiến lược 2: Network-First cho Trang HTML điều hướng (Navigation) và API
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
        }
        return networkResponse
      })
      .catch(async () => {
        // Khi mất mạng (Offline), tìm trong Cache
        const cachedResponse = await caches.match(request)
        if (cachedResponse) {
          return cachedResponse
        }
        // Nếu là trang điều hướng chính, fallback về trang chủ cache
        if (request.mode === 'navigate') {
          return caches.match('/')
        }
      })
  )
})
