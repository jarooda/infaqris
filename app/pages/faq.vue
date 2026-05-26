<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div
      class="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
    >
      <div class="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <NuxtLink
          to="/"
          class="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Kembali ke peta"
        >
          <Icon name="material-symbols:arrow-back" class="w-5 h-5" />
        </NuxtLink>
        <div>
          <h1 class="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">FAQ</h1>
          <p class="text-xs text-gray-400 dark:text-gray-500">
            <em>Frequently Asked Questions</em>
          </p>
        </div>
      </div>
    </div>

    <!-- Accordion -->
    <div class="max-w-2xl mx-auto px-4 py-8 space-y-2">
      <div
        v-for="item in faqs"
        :id="item.id"
        :key="item.id"
        class="scroll-mt-16 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <button
          class="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 text-left gap-3 cursor-pointer"
          @click="toggle(item.id)"
        >
          <span
            class="text-sm font-semibold text-gray-900 dark:text-gray-100"
            v-html="item.question"
          />
          <Icon
            name="material-symbols:expand-more"
            class="w-5 h-5 text-gray-400 shrink-0 transition-transform duration-250"
            :class="{ 'rotate-180': activeId === item.id }"
          />
        </button>
        <Transition
          @enter="onEnter"
          @after-enter="onAfterEnter"
          @leave="onLeave"
          @after-leave="onAfterLeave"
        >
          <div
            v-if="activeId === item.id"
            class="faq-answer px-4 pb-4 pt-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
            v-html="item.answer"
          />
        </Transition>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="max-w-2xl mx-auto px-4 py-6 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center"
    >
      © {{ year }}
      <a
        href="https://jaluwibowo.id"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
        >Jalu Wibowo Aji</a
      >
    </div>
  </div>
</template>

<script setup lang="ts">
const { init: initTheme } = useTheme()
const route = useRoute()
const year = new Date().getFullYear()

const activeId = ref<string | null>(null)

interface FaqItem {
  id: string
  question: string
  answer: string
}

const faqs: FaqItem[] = [
  {
    id: 'what-is-qris',
    question:
      'Apa itu QRIS? <em class="font-normal text-gray-500 dark:text-gray-400">/ What is QRIS?</em>',
    answer: `QRIS (Quick Response Code Indonesian Standard) adalah standar kode QR nasional Indonesia untuk pembayaran digital. Satu kode QR dapat digunakan di berbagai aplikasi dompet digital seperti GoPay, OVO, Dana, dan lainnya.
      <em class="text-gray-500 dark:text-gray-400"> / QRIS is Indonesia's national QR code standard for digital payments. One QR code works across multiple e-wallet apps like GoPay, OVO, Dana, and more.</em>`,
  },
  {
    id: 'what-is-infaqris',
    question:
      'Apa itu InfaQRIS? <em class="font-normal text-gray-500 dark:text-gray-400">/ What is InfaQRIS?</em>',
    answer: `Platform crowdsource untuk menemukan dan berbagi lokasi titik QRIS masjid, mushola, dan tempat ibadah di Indonesia. Semua data dikontribusikan langsung oleh pengguna.
      <em class="text-gray-500 dark:text-gray-400"> / A crowdsourcing platform to find and share QRIS payment locations at mosques and prayer rooms across Indonesia. All data is user-contributed.</em>`,
  },
  {
    id: 'how-to-use',
    question:
      'Bagaimana cara menggunakannya? <em class="font-normal text-gray-500 dark:text-gray-400">/ How do I use this?</em>',
    answer: `Buka peta, temukan titik QRIS terdekat, klik untuk melihat kode QR, lalu scan untuk berdonasi. Untuk menambah atau mengedit data, login dengan akun Google terlebih dahulu.
      <em class="text-gray-500 dark:text-gray-400"> / Open the map, find a nearby QRIS location, click to view the QR code, then scan to donate. To add or edit entries, sign in with your Google account first.</em>`,
  },
  {
    id: 'qr-validity',
    question:
      'Apakah kode QR yang ada di aplikasi sudah pasti valid? <em class="font-normal text-gray-500 dark:text-gray-400">/ Is the QR code in the app guaranteed to be valid?</em>',
    answer: `Tidak ada jaminan — data dikontribusikan oleh pengguna dan bisa saja sudah kedaluwarsa atau tidak akurat. Sebelum mengirim donasi, selalu periksa nama yang tertera pada kode QR dan pastikan nama tersebut sesuai dengan nama masjid atau mushola yang dituju. Jika ragu, tanyakan langsung kepada pengurus setempat.
      <em class="text-gray-500 dark:text-gray-400"> / There is no guarantee — data is user-contributed and may be outdated or inaccurate. Before sending any donation, always check the name displayed on the QR code and make sure it matches the mosque or prayer room you intend to donate to. If in doubt, ask the local administrator directly.</em>`,
  },
  {
    id: 'why-login',
    question:
      'Kenapa harus login? <em class="font-normal text-gray-500 dark:text-gray-400">/ Why do I need to login?</em>',
    answer: `Login sepenuhnya opsional — Anda tetap bisa melihat peta, mencari lokasi, dan scan kode QR tanpa akun. Login hanya diperlukan jika Anda ingin menambah atau mengedit data, untuk menjaga kualitas dan akuntabilitas kontribusi.
      <em class="text-gray-500 dark:text-gray-400"> / Login is entirely optional — you can browse the map, search locations, and scan QR codes without an account. It's only required if you want to add or edit data, to keep contributions accurate and accountable.</em>`,
  },
  {
    id: 'permissions',
    question:
      'Kenapa aplikasi meminta izin lokasi dan kamera? Aman kah? <em class="font-normal text-gray-500 dark:text-gray-400">/ It\'s asking for location and camera — is this safe?</em>',
    answer: `Aman, dan keduanya sepenuhnya opsional. Izin lokasi hanya digunakan untuk memusatkan peta ke posisi Anda — jika ditolak, peta tetap bisa digunakan secara normal. Kamera hanya aktif saat Anda memindai kode QR untuk menambah data baru — jika tidak tersedia, Anda bisa mengunggah foto kode QR dari galeri. Tidak ada lokasi atau gambar yang disimpan di server kami.
      <em class="text-gray-500 dark:text-gray-400"> / Safe, and both are entirely optional. Location permission only centers the map to your position — if denied, the map still works normally. Camera only activates when scanning a QR code to add new data — if unavailable, you can upload a QR image from your gallery instead. No location data or images are stored on our servers.</em>`,
  },
  {
    id: 'data-transparency',
    question:
      'Bisakah saya melihat data yang digunakan di web ini? <em class="font-normal text-gray-500 dark:text-gray-400">/ Can I see the data powering this site?</em>',
    answer: `Ya! Semua data disimpan di Google Sheets yang dapat diakses publik. Data meliputi nama lokasi, koordinat, dan informasi kontributor. Lihat langsung di <a href="https://docs.google.com/spreadsheets/d/14PWPiTLMnkesePI0npbZZ9y9sZR0PuuHB7O9ODe4Sk0/edit?gid=0#gid=0" target="_blank" rel="noopener noreferrer">Google Sheets</a>.
      <em class="text-gray-500 dark:text-gray-400"> / Yes! All data is stored in a publicly accessible Google Sheets document, including location names, coordinates, and contributor info. View it directly on <a href="https://docs.google.com/spreadsheets/d/14PWPiTLMnkesePI0npbZZ9y9sZR0PuuHB7O9ODe4Sk0/edit?gid=0#gid=0" target="_blank" rel="noopener noreferrer">Google Sheets</a>.</em>`,
  },
  {
    id: 'data-freshness',
    question:
      'Apakah data selalu up-to-date? <em class="font-normal text-gray-500 dark:text-gray-400">/ Is the data always up to date?</em>',
    answer: `Data diambil langsung saat halaman dibuka, namun akurasi isi bergantung pada kontribusi pengguna. Jika menemukan data yang salah atau usang, Anda dapat mengeditnya (jika login) atau melaporkannya kepada kami.
      <em class="text-gray-500 dark:text-gray-400"> / Data is fetched live each time the page loads, but accuracy depends on user contributions. If you find incorrect or outdated data, you can edit it (if logged in) or report it to us.</em>`,
  },
  {
    id: 'contribute',
    question:
      'Bagaimana cara menambah lokasi QRIS yang belum ada di peta? <em class="font-normal text-gray-500 dark:text-gray-400">/ How do I add a missing QRIS location?</em>',
    answer: `Login dengan akun Google, lalu klik tombol "+" di pojok kanan bawah peta. Ikuti langkah-langkahnya: scan kode QR → isi nama dan deskripsi → tandai lokasi di peta → simpan.
      <em class="text-gray-500 dark:text-gray-400"> / Sign in with Google, then tap the "+" button at the bottom-right of the map. Follow the steps: scan the QR code → enter name and description → pin the location on the map → save.</em>`,
  },
  {
    id: 'contribute-platform',
    question:
      'Bagaimana jika saya ingin berkontribusi pada pengembangan platform ini? <em class="font-normal text-gray-500 dark:text-gray-400">/ What if I want to contribute to this platform?</em>',
    answer: `Kami sangat terbuka untuk saran, ide fitur, atau laporan bug. Silakan buat issue di repositori GitHub kami di <a href="https://github.com/jarooda/infaqris" target="_blank" rel="noopener noreferrer">github.com/jarooda/infaqris</a>.
      <em class="text-gray-500 dark:text-gray-400"> / We welcome suggestions, feature ideas, or bug reports. Please open an issue on our GitHub repository at <a href="https://github.com/jarooda/infaqris" target="_blank" rel="noopener noreferrer">github.com/jarooda/infaqris</a>.</em>`,
  },
  {
    id: 'report',
    question:
      'Bagaimana cara melaporkan data yang tidak akurat jika saya tidak punya akun? <em class="font-normal text-gray-500 dark:text-gray-400">/ How do I report inaccurate data without logging in?</em>',
    answer: `Klik tombol "Laporkan data tidak akurat" di halaman detail lokasi, lalu kirim email kepada kami dengan menyertakan nama lokasi dan detail ketidakakuratan yang Anda temukan. Hubungi kami di <a href="mailto:me@jaluwibowo.id">me@jaluwibowo.id</a>.
      <em class="text-gray-500 dark:text-gray-400"> / Click the "Report inaccurate data" button on the location detail page, then email us with the location name and details of the inaccuracy. Reach us at <a href="mailto:me@jaluwibowo.id">me@jaluwibowo.id</a>.</em>`,
  },
]

function onEnter(el: Element) {
  const e = el as HTMLElement
  e.style.height = '0'
  e.style.overflow = 'hidden'
  requestAnimationFrame(() => {
    e.style.height = e.scrollHeight + 'px'
  })
}

function onAfterEnter(el: Element) {
  const e = el as HTMLElement
  e.style.height = 'auto'
  e.style.overflow = ''
}

function onLeave(el: Element) {
  const e = el as HTMLElement
  e.style.height = e.scrollHeight + 'px'
  e.style.overflow = 'hidden'
  requestAnimationFrame(() => {
    e.style.height = '0'
  })
}

function onAfterLeave(el: Element) {
  const e = el as HTMLElement
  e.style.height = ''
  e.style.overflow = ''
}

function toggle(id: string) {
  if (activeId.value === id) {
    activeId.value = null
    history.replaceState(null, '', location.pathname)
  } else {
    activeId.value = id
    history.replaceState(null, '', `${location.pathname}#${id}`)
  }
}

useSeoMeta({
  title: 'FAQ — InfaQRIS',
  description:
    'Pertanyaan umum seputar InfaQRIS — platform crowdsource lokasi QRIS masjid di Indonesia.',
})

onMounted(() => {
  initTheme()
  const hash = route.hash.slice(1)
  if (hash) {
    activeId.value = hash
    nextTick(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
})
</script>

<style scoped>
.faq-answer {
  transition: height 0.25s ease;
}
.faq-answer :deep(a) {
  color: #2563eb;
  text-decoration: none;
}
.faq-answer :deep(a:hover) {
  text-decoration: underline;
}
:global(.dark) .faq-answer :deep(a) {
  color: #60a5fa;
}
</style>
