<template>
  <div class="min-h-dvh bg-gray-50 dark:bg-gray-900">
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
          <h1 class="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
            Kebijakan Privasi
          </h1>
          <p class="text-xs text-gray-400 dark:text-gray-500">
            <em>Privacy Policy</em>
          </p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div
      class="max-w-2xl mx-auto px-4 py-8 space-y-8 text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
    >
      <p class="text-xs text-gray-400 dark:text-gray-500">
        Terakhir diperbarui: {{ lastUpdated }} ·
        <em>Last updated: {{ lastUpdated }}</em>
      </p>

      <section class="space-y-3">
        <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">
          Data yang kami kumpulkan
          <em class="font-normal text-gray-500 dark:text-gray-400 text-sm"> / What we collect</em>
        </h2>
        <p>
          Ketika Anda login dengan akun Google, kami menyimpan <strong>alamat email</strong> Anda di
          cookie sesi yang terenkripsi untuk keperluan autentikasi. Email ini juga disimpan di
          Google Sheets sebagai identitas kontributor pada setiap entri yang Anda tambahkan.
        </p>
        <p class="text-gray-500 dark:text-gray-400">
          <em>
            When you sign in with Google, we store your <strong>email address</strong> in an
            encrypted session cookie for authentication. This email is also stored in Google Sheets
            as the contributor identity on each entry you add.
          </em>
        </p>
        <p>
          Ketika Anda menambahkan entri baru, kami menyimpan <strong>koordinat lokasi</strong> yang
          Anda tandai di peta, beserta nama dan deskripsi yang Anda tulis.
        </p>
        <p class="text-gray-500 dark:text-gray-400">
          <em>
            When you add a new entry, we store the <strong>location coordinates</strong> you pin on
            the map, along with the name and description you provide.
          </em>
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">
          Bagaimana data digunakan
          <em class="font-normal text-gray-500 dark:text-gray-400 text-sm"> / How it's used</em>
        </h2>
        <ul class="list-disc pl-5 space-y-1">
          <li>Autentikasi — memverifikasi identitas Anda sebelum menerima kontribusi</li>
          <li>
            Moderasi — admin menggunakan email kontributor untuk meninjau dan menghubungi jika
            diperlukan
          </li>
          <li>Akuntabilitas — setiap entri mencatat siapa yang menambahkan dan kapan</li>
        </ul>
        <ul class="list-disc pl-5 space-y-1 text-gray-500 dark:text-gray-400">
          <li><em>Authentication — verifying your identity before accepting contributions</em></li>
          <li>
            <em>Moderation — admins use contributor email to review and follow up if needed</em>
          </li>
          <li><em>Accountability — each entry records who added it and when</em></li>
        </ul>
        <p>
          Email Anda <strong>tidak ditampilkan</strong> kepada pengguna lain melalui API atau
          halaman publik aplikasi ini.
        </p>
        <p class="text-gray-500 dark:text-gray-400">
          <em>
            Your email is <strong>not exposed</strong> to other users via the API or any public page
            of this app.
          </em>
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">
          Di mana data disimpan
          <em class="font-normal text-gray-500 dark:text-gray-400 text-sm"> / Where it's stored</em>
        </h2>
        <p>
          Semua data lokasi dan informasi kontributor disimpan di
          <strong>Google Sheets</strong> yang dikelola oleh pengelola platform. Data ini hanya dapat
          diakses oleh admin. Tampilan publik yang ditautkan di FAQ hanya menampilkan nama lokasi,
          koordinat, dan waktu kontribusi — tanpa email.
        </p>
        <p class="text-gray-500 dark:text-gray-400">
          <em>
            All location data and contributor information is stored in
            <strong>Google Sheets</strong>
            managed by the platform owner. This data is only accessible by admins. The public view
            linked in the FAQ only shows location names, coordinates, and timestamps — no emails.
          </em>
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">
          Berapa lama data disimpan
          <em class="font-normal text-gray-500 dark:text-gray-400 text-sm"> / Retention</em>
        </h2>
        <p>
          Data disimpan selama platform ini aktif beroperasi, atau hingga Anda meminta penghapusan.
          Cookie sesi berakhir dalam 7 hari atau saat Anda logout.
        </p>
        <p class="text-gray-500 dark:text-gray-400">
          <em>
            Data is retained for as long as this platform is active, or until you request deletion.
            Session cookies expire after 7 days or when you log out.
          </em>
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">
          Hak Anda
          <em class="font-normal text-gray-500 dark:text-gray-400 text-sm"> / Your rights</em>
        </h2>
        <p>
          Anda berhak meminta penghapusan data pribadi Anda (email dan entri yang Anda
          kontribusikan) kapan saja. Hubungi kami di
          <a href="mailto:me@jaluwibowo.id" class="text-blue-600 dark:text-blue-400 hover:underline"
            >me@jaluwibowo.id</a
          >
          dengan subjek "Hapus data saya".
        </p>
        <p class="text-gray-500 dark:text-gray-400">
          <em>
            You may request deletion of your personal data (email and any entries you contributed)
            at any time. Contact us at
            <a href="mailto:me@jaluwibowo.id" class="text-blue-400 hover:underline"
              >me@jaluwibowo.id</a
            >
            with the subject "Delete my data".
          </em>
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">
          Layanan pihak ketiga
          <em class="font-normal text-gray-500 dark:text-gray-400 text-sm">
            / Third-party services</em
          >
        </h2>
        <ul class="list-disc pl-5 space-y-1">
          <li>
            <strong>Google Sign-In</strong> — digunakan untuk autentikasi; tunduk pada
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 dark:text-blue-400 hover:underline"
              >Kebijakan Privasi Google</a
            >
          </li>
          <li>
            <strong>Google Sheets API</strong> — digunakan sebagai basis data; data disimpan di
            infrastruktur Google
          </li>
          <li>
            <strong>Cloudflare Turnstile</strong> — digunakan untuk verifikasi manusia pada formulir
            tambah lokasi
          </li>
          <li>
            <strong>OpenStreetMap / CartoDB</strong> — digunakan untuk tampilan peta; tidak ada data
            pribadi yang dikirim
          </li>
        </ul>
        <ul class="list-disc pl-5 space-y-1 text-gray-500 dark:text-gray-400">
          <li>
            <em
              ><strong>Google Sign-In</strong> — used for authentication; subject to
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-400 hover:underline"
                >Google's Privacy Policy</a
              ></em
            >
          </li>
          <li>
            <em
              ><strong>Google Sheets API</strong> — used as database; data stored on Google
              infrastructure</em
            >
          </li>
          <li>
            <em
              ><strong>Cloudflare Turnstile</strong> — used for human verification on the
              add-location form</em
            >
          </li>
          <li>
            <em
              ><strong>OpenStreetMap / CartoDB</strong> — used for map rendering; no personal data
              is sent</em
            >
          </li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">
          Kontak
          <em class="font-normal text-gray-500 dark:text-gray-400 text-sm"> / Contact</em>
        </h2>
        <p>
          Pertanyaan atau permintaan terkait privasi: hubungi
          <a href="mailto:me@jaluwibowo.id" class="text-blue-600 dark:text-blue-400 hover:underline"
            >me@jaluwibowo.id</a
          >.
        </p>
        <p class="text-gray-500 dark:text-gray-400">
          <em>
            Privacy questions or requests: contact
            <a href="mailto:me@jaluwibowo.id" class="text-blue-400 hover:underline"
              >me@jaluwibowo.id</a
            >.
          </em>
        </p>
      </section>
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
const lastUpdated = 'Mei 2026 / May 2026'

useSeoMeta({
  title: 'Kebijakan Privasi — InfaQRIS',
  description:
    'Kebijakan privasi InfaQRIS — apa yang kami kumpulkan, bagaimana digunakan, dan hak Anda.',
})

onMounted(() => {
  initTheme()
})
</script>
