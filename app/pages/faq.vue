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

    <!-- Content -->
    <div class="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <!-- 1. Apa itu QRIS? -->
      <div id="what-is-qris" class="scroll-mt-16">
        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Apa itu QRIS?
          <em class="font-normal text-gray-500 dark:text-gray-400">/ What is QRIS?</em>
        </p>
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          QRIS (Quick Response Code Indonesian Standard) adalah standar kode QR nasional Indonesia
          untuk pembayaran digital. Satu kode QR dapat digunakan di berbagai aplikasi dompet digital
          seperti GoPay, OVO, Dana, dan lainnya.
          <em class="text-gray-500 dark:text-gray-400">
            / QRIS is Indonesia's national QR code standard for digital payments. One QR code works
            across multiple e-wallet apps like GoPay, OVO, Dana, and more.</em
          >
        </p>
      </div>

      <!-- 2. Apa itu InfaQRIS? -->
      <div id="what-is-infaqris" class="scroll-mt-16">
        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Apa itu InfaQRIS?
          <em class="font-normal text-gray-500 dark:text-gray-400">/ What is InfaQRIS?</em>
        </p>
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Platform crowdsource untuk menemukan dan berbagi lokasi titik QRIS masjid, mushola, dan
          tempat ibadah di Indonesia. Semua data dikontribusikan langsung oleh pengguna.
          <em class="text-gray-500 dark:text-gray-400">
            / A crowdsourcing platform to find and share QRIS payment locations at mosques and
            prayer rooms across Indonesia. All data is user-contributed.</em
          >
        </p>
      </div>

      <!-- 3. Cara menggunakan -->
      <div id="how-to-use" class="scroll-mt-16">
        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Bagaimana cara menggunakannya?
          <em class="font-normal text-gray-500 dark:text-gray-400">/ How do I use this?</em>
        </p>
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Buka peta, temukan titik QRIS terdekat, klik untuk melihat kode QR, lalu scan untuk
          berdonasi. Untuk menambah atau mengedit data, login dengan akun Google terlebih dahulu.
          <em class="text-gray-500 dark:text-gray-400">
            / Open the map, find a nearby QRIS location, click to view the QR code, then scan to
            donate. To add or edit entries, sign in with your Google account first.</em
          >
        </p>
      </div>

      <!-- 4. Kenapa harus login -->
      <div id="why-login" class="scroll-mt-16">
        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Kenapa harus login untuk menambah data?
          <em class="font-normal text-gray-500 dark:text-gray-400">/ Why do I need to login?</em>
        </p>
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Login sepenuhnya opsional — Anda tetap bisa melihat peta, mencari lokasi, dan scan kode QR
          tanpa akun. Login hanya diperlukan jika Anda ingin menambah atau mengedit data, untuk
          menjaga kualitas dan akuntabilitas kontribusi.
          <em class="text-gray-500 dark:text-gray-400">
            / Login is entirely optional — you can browse the map, search locations, and scan QR
            codes without an account. It's only required if you want to add or edit data, to keep
            contributions accurate and accountable.</em
          >
        </p>
      </div>

      <!-- 5. Izin lokasi dan kamera -->
      <div id="permissions" class="scroll-mt-16">
        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Kenapa aplikasi meminta izin lokasi dan kamera? Aman kah?
          <em class="font-normal text-gray-500 dark:text-gray-400"
            >/ It's asking for location and camera — is this safe?</em
          >
        </p>
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Aman, dan keduanya sepenuhnya opsional. Izin lokasi hanya digunakan untuk memusatkan peta
          ke posisi Anda — jika ditolak, peta tetap bisa digunakan secara normal. Kamera hanya aktif
          saat Anda memindai kode QR untuk menambah data baru — jika tidak tersedia, Anda bisa
          mengunggah foto kode QR dari galeri. Tidak ada lokasi atau gambar yang disimpan di server
          kami.
          <em class="text-gray-500 dark:text-gray-400">
            / Safe, and both are entirely optional. Location permission only centers the map to your
            position — if denied, the map still works normally. Camera only activates when scanning
            a QR code to add new data — if unavailable, you can upload a QR image from your gallery
            instead. No location data or images are stored on our servers.</em
          >
        </p>
      </div>

      <!-- 6. Melihat data -->
      <div id="data-transparency" class="scroll-mt-16">
        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Bisakah saya melihat data yang digunakan di web ini?
          <em class="font-normal text-gray-500 dark:text-gray-400"
            >/ Can I see the data powering this site?</em
          >
        </p>
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Ya! Semua data disimpan di Google Sheets yang dapat diakses publik. Data meliputi nama
          lokasi, koordinat, dan informasi kontributor. Lihat langsung di
          <a
            href="https://docs.google.com/spreadsheets/d/14PWPiTLMnkesePI0npbZZ9y9sZR0PuuHB7O9ODe4Sk0/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 dark:text-blue-400 hover:underline"
            >Google Sheets</a
          >.
          <em class="text-gray-500 dark:text-gray-400">
            / Yes! All data is stored in a publicly accessible Google Sheets document, including
            location names, coordinates, and contributor info. View it directly on
            <a
              href="https://docs.google.com/spreadsheets/d/14PWPiTLMnkesePI0npbZZ9y9sZR0PuuHB7O9ODe4Sk0/edit?gid=0#gid=0"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 dark:text-blue-400 hover:underline"
              >Google Sheets</a
            >.</em
          >
        </p>
      </div>

      <!-- 7. Apakah data selalu up-to-date? -->
      <div id="data-freshness" class="scroll-mt-16">
        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Apakah data selalu up-to-date?
          <em class="font-normal text-gray-500 dark:text-gray-400"
            >/ Is the data always up to date?</em
          >
        </p>
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Data diambil langsung saat halaman dibuka, namun akurasi isi bergantung pada kontribusi
          pengguna. Jika menemukan data yang salah atau usang, Anda dapat mengeditnya (jika login)
          atau melaporkannya kepada kami.
          <em class="text-gray-500 dark:text-gray-400">
            / Data is fetched live each time the page loads, but accuracy depends on user
            contributions. If you find incorrect or outdated data, you can edit it (if logged in) or
            report it to us.</em
          >
        </p>
      </div>

      <!-- 8. Cara berkontribusi -->
      <div id="contribute" class="scroll-mt-16">
        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Bagaimana cara menambah lokasi QRIS yang belum ada di peta?
          <em class="font-normal text-gray-500 dark:text-gray-400"
            >/ How do I add a missing QRIS location?</em
          >
        </p>
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Login dengan akun Google, lalu klik tombol "+" di pojok kanan bawah peta. Ikuti
          langkah-langkahnya: scan kode QR → isi nama dan deskripsi → tandai lokasi di peta →
          simpan.
          <em class="text-gray-500 dark:text-gray-400">
            / Sign in with Google, then tap the "+" button at the bottom-right of the map. Follow
            the steps: scan the QR code → enter name and description → pin the location on the map →
            save.</em
          >
        </p>
      </div>

      <!-- 9. Berkontribusi ke platform -->
      <div id="contribute-platform" class="scroll-mt-16">
        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Bagaimana jika saya ingin berkontribusi pada pengembangan platform ini?
          <em class="font-normal text-gray-500 dark:text-gray-400"
            >/ What if I want to contribute to this platform?</em
          >
        </p>
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Kami sangat terbuka untuk saran, ide fitur, atau laporan bug. Silakan buat issue di
          repositori GitHub kami di
          <a
            href="https://github.com/jarooda/infaqris"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 dark:text-blue-400 hover:underline"
            >github.com/jarooda/infaqris</a
          >.
          <em class="text-gray-500 dark:text-gray-400">
            / We welcome suggestions, feature ideas, or bug reports. Please open an issue on our
            GitHub repository at
            <a
              href="https://github.com/jarooda/infaqris"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 dark:text-blue-400 hover:underline"
              >github.com/jarooda/infaqris</a
            >.</em
          >
        </p>
      </div>

      <!-- 10. Melaporkan data tidak akurat -->
      <div id="report" class="scroll-mt-16">
        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Bagaimana cara melaporkan data yang tidak akurat jika saya tidak punya akun?
          <em class="font-normal text-gray-500 dark:text-gray-400"
            >/ How do I report inaccurate data without logging in?</em
          >
        </p>
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Klik tombol "Laporkan data tidak akurat" di halaman detail lokasi, lalu kirim email kepada
          kami dengan menyertakan nama lokasi dan detail ketidakakuratan yang Anda temukan. Hubungi
          kami di
          <a href="mailto:me@jaluwibowo.id" class="text-blue-600 dark:text-blue-400 hover:underline"
            >me@jaluwibowo.id</a
          >.
          <em class="text-gray-500 dark:text-gray-400">
            / Click the "Report inaccurate data" button on the location detail page, then email us
            with the location name and details of the inaccuracy. Reach us at
            <a
              href="mailto:me@jaluwibowo.id"
              class="text-blue-600 dark:text-blue-400 hover:underline"
              >me@jaluwibowo.id</a
            >.</em
          >
        </p>
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
const year = new Date().getFullYear()

useSeoMeta({
  title: 'FAQ — InfaQRIS',
  description:
    'Pertanyaan umum seputar InfaQRIS — platform crowdsource lokasi QRIS masjid di Indonesia.',
})

onMounted(() => {
  initTheme()
})
</script>
