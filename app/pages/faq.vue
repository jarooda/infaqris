<template>
  <div class="min-h-dvh bg-(--bg-app)">
    <!-- Header -->
    <div class="sticky top-0 z-10 bg-(--surface-card) border-b border-(--border-default)">
      <div class="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <NuxtLink
          to="/"
          class="p-1.5 rounded-lg text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-hover) transition-colors"
          title="Kembali ke peta"
        >
          <Icon name="material-symbols:arrow-back" class="w-5 h-5" />
        </NuxtLink>
        <div>
          <h1 class="text-base font-bold text-(--text-primary) leading-tight">FAQ</h1>
          <p class="text-xs text-(--text-tertiary)">
            <em>Frequently Asked Questions</em>
          </p>
        </div>
      </div>
    </div>

    <!-- Accordion -->
    <div class="max-w-2xl mx-auto px-4 py-8 space-y-2">
      <Card v-for="item in faqs" :id="item.id" :key="item.id" class="scroll-mt-16">
        <button
          class="w-full flex items-center justify-between px-4 py-3 text-left gap-3 cursor-pointer"
          @click="toggle(item.id)"
        >
          <span class="text-sm font-semibold text-(--text-primary)" v-html="item.question" />
          <Icon
            name="material-symbols:expand-more"
            class="w-5 h-5 text-(--text-tertiary) shrink-0 transition-transform duration-250"
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
            class="faq-answer px-4 pb-4 pt-3 border-t border-(--border-subtle) text-sm text-(--text-secondary) leading-relaxed"
            v-html="item.answer"
          />
        </Transition>
      </Card>
    </div>

    <!-- Footer -->
    <div
      class="max-w-2xl mx-auto px-4 py-6 border-t border-(--border-default) text-xs text-(--text-tertiary) text-center space-y-1"
    >
      <div>
        <NuxtLink to="/privacy" class="hover:text-(--accent) transition-colors"
          >Kebijakan Privasi <em>/ Privacy Policy</em></NuxtLink
        >
      </div>
      <div>
        © {{ year }}
        <a
          href="https://jaluwibowo.id"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-(--accent) transition-colors"
          >Jalu Wibowo Aji</a
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Card } from '~/components/ui/card'

const { init: initTheme } = useTheme()
const route = useRoute()
const year = new Date().getFullYear()
const sheetUrl = useRuntimeConfig().public.sheetPublicUrl as string

const activeId = ref<string | null>(null)

interface FaqItem {
  id: string
  question: string
  answer: string
}

const faqs: FaqItem[] = [
  {
    id: 'what-is-qris',
    question: 'Apa itu QRIS? <em class="font-normal text-(--text-tertiary)">/ What is QRIS?</em>',
    answer: `QRIS (Quick Response Code Indonesian Standard) adalah standar kode QR nasional Indonesia untuk pembayaran digital. Satu kode QR dapat digunakan di berbagai aplikasi dompet digital seperti GoPay, OVO, Dana, dan lainnya.
      <em class="text-(--text-tertiary)"> / QRIS is Indonesia's national QR code standard for digital payments. One QR code works across multiple e-wallet apps like GoPay, OVO, Dana, and more.</em>`,
  },
  {
    id: 'what-is-infaqris',
    question:
      'Apa itu InfaQRIS? <em class="font-normal text-(--text-tertiary)">/ What is InfaQRIS?</em>',
    answer: `Platform crowdsource untuk menemukan dan berbagi lokasi titik QRIS masjid, mushola, dan tempat ibadah di Indonesia. Semua data dikontribusikan langsung oleh pengguna.
      <em class="text-(--text-tertiary)"> / A crowdsourcing platform to find and share QRIS payment locations at mosques and prayer rooms across Indonesia. All data is user-contributed.</em>`,
  },
  {
    id: 'how-to-use',
    question:
      'Bagaimana cara menggunakannya? <em class="font-normal text-(--text-tertiary)">/ How do I use this?</em>',
    answer: `Buka peta, temukan titik QRIS terdekat, klik untuk melihat kode QR, lalu scan untuk berdonasi. Gunakan tombol sort di panel kiri untuk mengurutkan berdasarkan <strong>jarak terdekat</strong> dari posisi Anda. Untuk menambah data baru, login dengan akun Google terlebih dahulu. Pengeditan data yang sudah ada hanya dapat dilakukan oleh admin.
      <em class="text-(--text-tertiary)"> / Open the map, find a nearby QRIS location, click to view the QR code, then scan to donate. Use the sort button in the left panel to order by <strong>nearest first</strong>. To add new entries, sign in with your Google account first. Editing existing data is handled by admins only.</em>`,
  },
  {
    id: 'qr-validity',
    question:
      'Seberapa terpercaya kode QR di aplikasi ini? <em class="font-normal text-(--text-tertiary)">/ How trustworthy are the QR codes in this app?</em>',
    answer: `Kami menyediakan beberapa lapisan untuk membantu Anda memverifikasi sebelum berdonasi. Pertama, info QRIS otomatis — setiap entri menampilkan nama merchant, bank penerbit, merchant ID, dan kota yang terdaftar; cocokkan dengan nama masjid atau mushola yang dituju. Kedua, moderasi admin — kiriman dari pengguna biasa masuk ke antrian tinjauan dan baru muncul di peta setelah disetujui. Saat meninjau, admin memverifikasi nama merchant dan kota yang tertera di QRIS dengan membandingkannya ke lokasi yang ditandai di peta menggunakan tampilan satelit atau Street View — memastikan nama terdaftar cocok dengan bangunan yang sebenarnya. Ketiga, akuntabilitas kontributor — setiap entri mencatat siapa yang menambahkan dan kapan. Meski demikian, kami tidak dapat menjamin keakuratan mutlak karena data bersifat crowdsource dan kode QR fisik bisa berubah setelah dimasukkan. Sebelum berdonasi, selalu periksa nama merchant yang tertera dan pastikan sesuai. Jika ragu, tanyakan langsung kepada pengurus setempat.
      <em class="text-(--text-tertiary)"> / We provide several layers to help you verify before donating. First, automatic QRIS info — every entry shows the registered merchant name, issuing bank, merchant ID, and city; cross-check this against the mosque or prayer room you intend to donate to. Second, admin moderation — submissions from regular users enter a review queue and only appear on the map once approved. During review, admins verify the merchant name and city shown in the QRIS by cross-referencing the pinned location on the map using satellite or Street View — confirming the registered name matches the actual building. Third, contributor accountability — every entry records who added it and when. That said, we cannot guarantee absolute accuracy since data is crowdsourced and physical QR codes may change after submission. Always check the merchant name shown before donating. If in doubt, ask the local mosque administrator directly.</em>`,
  },
  {
    id: 'mcc',
    question:
      'Apa itu MCC yang tertera di info QRIS? <em class="font-normal text-(--text-tertiary)">/ What is the MCC shown in QRIS info?</em>',
    answer: `<strong>MCC (Merchant Category Code)</strong> adalah kode 4 digit yang ditetapkan oleh bank saat mendaftarkan QRIS, yang mengklasifikasikan jenis usaha atau organisasi pemilik QRIS tersebut — seperti restoran, toko retail, hotel, atau organisasi keagamaan.
      <br><br>
      Untuk masjid, mushola, atau tempat ibadah, MCC yang seharusnya terdaftar adalah:
      <ul style="list-style:disc;padding-left:1.25rem;margin-top:0.5rem;margin-bottom:0.5rem">
        <li><strong>8661</strong> — Religious Organizations (Organisasi Keagamaan)</li>
        <li><strong>8398</strong> — Charitable and Social Service Organizations (Lembaga Sosial / Amal)</li>
      </ul>
      Jika MCC yang tertera berbeda dari kedua kode di atas — misalnya <strong>5992</strong> (Florists) atau <strong>5812</strong> (Eating Places) — QRIS tersebut terdaftar dalam kategori berbeda dari yang Anda harapkan. Ini tidak selalu berarti penipuan; bisa jadi kesalahan pendaftaran oleh bank atau masjid yang mendaftar menggunakan akun usaha lain. Namun sebaiknya Anda memverifikasi terlebih dahulu sebelum berdonasi — cocokkan nama merchant yang tertera dengan nama masjid yang dituju, atau tanyakan langsung kepada pengurus.
      <br><br>
      <em class="text-(--text-tertiary)"><strong>MCC (Merchant Category Code)</strong> is a 4-digit code assigned by the bank when registering a QRIS, classifying the type of business or organization — such as a restaurant, retail store, hotel, or religious organization. For mosques and prayer rooms, the expected MCCs are <strong>8661</strong> (Religious Organizations) or <strong>8398</strong> (Charitable and Social Service Organizations). If a different MCC appears — e.g. 5992 (Florists) or 5812 (Eating Places) — the QRIS is registered under a different category than expected. This isn't necessarily fraud; it may be a registration error. Always verify the merchant name and, if in doubt, ask the local administrator before donating.</em>`,
  },
  {
    id: 'why-login',
    question:
      'Kenapa harus login? <em class="font-normal text-(--text-tertiary)">/ Why do I need to login?</em>',
    answer: `Login sepenuhnya opsional — Anda tetap bisa melihat peta, mencari lokasi, dan scan kode QR tanpa akun. Login hanya diperlukan jika Anda ingin menambah data baru, untuk menjaga kualitas dan akuntabilitas kontribusi.
      <em class="text-(--text-tertiary)"> / Login is entirely optional — you can browse the map, search locations, and scan QR codes without an account. It's only required if you want to add new data, to keep contributions accurate and accountable.</em>`,
  },
  {
    id: 'permissions',
    question:
      'Kenapa aplikasi meminta izin lokasi dan kamera? Aman kah? <em class="font-normal text-(--text-tertiary)">/ It\'s asking for location and camera — is this safe?</em>',
    answer: `Aman, dan keduanya sepenuhnya opsional. Izin lokasi hanya digunakan untuk memusatkan peta ke posisi Anda — jika ditolak, peta tetap bisa digunakan secara normal. Kamera hanya aktif saat Anda memindai kode QR untuk menambah data baru — jika tidak tersedia, Anda bisa mengunggah foto kode QR dari galeri. Tidak ada lokasi atau gambar yang disimpan di server kami.
      <em class="text-(--text-tertiary)"> / Safe, and both are entirely optional. Location permission only centers the map to your position — if denied, the map still works normally. Camera only activates when scanning a QR code to add new data — if unavailable, you can upload a QR image from your gallery instead. No location data or images are stored on our servers.</em>`,
  },
  {
    id: 'data-transparency',
    question:
      'Bisakah saya melihat data yang digunakan di web ini? <em class="font-normal text-(--text-tertiary)">/ Can I see the data powering this site?</em>',
    answer: `Ya! Semua data disimpan di Google Sheets yang dapat diakses publik. Data meliputi nama lokasi, koordinat, dan waktu kontribusi — tanpa informasi pribadi kontributor. Lihat langsung di <a href="${sheetUrl}" target="_blank" rel="noopener noreferrer">Google Sheets</a>.
      <em class="text-(--text-tertiary)"> / Yes! All data is stored in a publicly accessible Google Sheets document, including location names, coordinates, and contribution timestamps — without contributor personal info. View it directly on <a href="${sheetUrl}" target="_blank" rel="noopener noreferrer">Google Sheets</a>.</em>`,
  },
  {
    id: 'data-freshness',
    question:
      'Apakah data selalu up-to-date? <em class="font-normal text-(--text-tertiary)">/ Is the data always up to date?</em>',
    answer: `Data diambil langsung saat halaman dibuka, namun akurasi isi bergantung pada kontribusi pengguna. Jika menemukan data yang salah atau usang, silakan laporkan kepada kami — pengeditan dilakukan oleh admin.
      <em class="text-(--text-tertiary)"> / Data is fetched live each time the page loads, but accuracy depends on user contributions. If you find incorrect or outdated data, please report it to us — edits are handled by admins.</em>`,
  },
  {
    id: 'contribute',
    question:
      'Bagaimana cara menambah lokasi QRIS yang belum ada di peta? <em class="font-normal text-(--text-tertiary)">/ How do I add a missing QRIS location?</em>',
    answer: `Login dengan akun Google, lalu klik tombol "+" di pojok kanan bawah peta. Ikuti langkah-langkahnya: scan kode QR → isi nama dan deskripsi → tandai lokasi di peta → simpan. Kiriman Anda akan masuk ke antrian moderasi dan muncul di peta setelah disetujui oleh admin.
      <em class="text-(--text-tertiary)"> / Sign in with Google, then tap the "+" button at the bottom-right of the map. Follow the steps: scan the QR code → enter name and description → pin the location on the map → save. Your submission will enter a moderation queue and appear on the map once approved by an admin.</em>`,
  },
  {
    id: 'moderation',
    question:
      'Bagaimana proses moderasi kiriman baru? <em class="font-normal text-(--text-tertiary)">/ How does moderation work for new submissions?</em>',
    answer: `Setiap kiriman dari pengguna biasa tidak langsung muncul di peta — kiriman masuk ke status pending dan ditinjau oleh admin terlebih dahulu. Jika disetujui, entri langsung tampil di peta untuk semua pengguna. Selama menunggu, Anda dapat melihat kiriman sendiri dengan label "Menunggu persetujuan admin". Proses ini menjaga kualitas data dan mencegah penyalahgunaan.
      <em class="text-(--text-tertiary)"> / Every submission from a regular user doesn't go live immediately — it enters a pending state and is reviewed by an admin first. Once approved, the entry appears on the map for all users. While waiting, you can see your own submission labeled "Pending admin approval". This process maintains data quality and prevents misuse.</em>`,
  },
  {
    id: 'offline',
    question:
      'Bisakah saya menggunakan aplikasi ini saat offline? <em class="font-normal text-(--text-tertiary)">/ Can I use the app offline?</em>',
    answer: `Ya, <strong>setelah setidaknya satu kali membuka aplikasi saat online</strong>. Kunjungan pertama menginstal service worker yang menyimpan cache aplikasi dan data lokasi ke perangkat Anda. Setelah itu, Anda dapat membuka dan menggunakan InfaQRIS tanpa koneksi internet — termasuk melihat kode QR dan mencari lokasi. Anda juga dapat menambah data baru saat offline; perubahan tersimpan di perangkat dan otomatis dikirim ke server saat koneksi kembali. Ubin peta pada area yang pernah dikunjungi juga tersedia secara offline. Jika aplikasi menampilkan pesan "offline" saat pertama kali dibuka tanpa koneksi, itu karena cache belum terbentuk — coba buka dulu saat online, kemudian fitur offline akan aktif.
      <em class="text-(--text-tertiary)"> / Yes, <strong>after at least one online visit</strong>. The first visit installs a service worker that caches the app shell and location data to your device. After that, you can open and use InfaQRIS without an internet connection — including viewing QR codes and searching locations. You can also add new entries while offline; changes are saved on your device and automatically synced to the server when connectivity returns. Map tiles for previously visited areas are also available offline. If the app shows an "offline" message the very first time you open it without a connection, that's because the cache hasn't been built yet — open it once while online first, and offline support will be active from then on.</em>`,
  },
  {
    id: 'contribute-platform',
    question:
      'Bagaimana jika saya ingin berkontribusi pada pengembangan platform ini? <em class="font-normal text-(--text-tertiary)">/ What if I want to contribute to this platform?</em>',
    answer: `Kami sangat terbuka untuk saran, ide fitur, atau laporan bug. Silakan buat issue di repositori GitHub kami di <a href="https://github.com/jarooda/infaqris" target="_blank" rel="noopener noreferrer">github.com/jarooda/infaqris</a>.
      <em class="text-(--text-tertiary)"> / We welcome suggestions, feature ideas, or bug reports. Please open an issue on our GitHub repository at <a href="https://github.com/jarooda/infaqris" target="_blank" rel="noopener noreferrer">github.com/jarooda/infaqris</a>.</em>`,
  },
  {
    id: 'report',
    question:
      'Bagaimana cara melaporkan data yang tidak akurat jika saya tidak punya akun? <em class="font-normal text-(--text-tertiary)">/ How do I report inaccurate data without logging in?</em>',
    answer: `Klik tombol "Laporkan data tidak akurat" di halaman detail lokasi, lalu kirim email kepada kami dengan menyertakan nama lokasi dan detail ketidakakuratan yang Anda temukan. Hubungi kami di <a href="mailto:me@jaluwibowo.id">me@jaluwibowo.id</a>.
      <em class="text-(--text-tertiary)"> / Click the "Report inaccurate data" button on the location detail page, then email us with the location name and details of the inaccuracy. Reach us at <a href="mailto:me@jaluwibowo.id">me@jaluwibowo.id</a>.</em>`,
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
  color: var(--accent);
  text-decoration: none;
}
.faq-answer :deep(a:hover) {
  text-decoration: underline;
}
</style>
