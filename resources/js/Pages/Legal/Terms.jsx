import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, FileText, Mail, ShieldCheck } from 'lucide-react';
import Navbar from '../../Components/Navbar';

const TERMS_SECTIONS = [
    { id: 'definisi', title: '1. Definisi & Ruang Lingkup' },
    { id: 'akun', title: '2. Akun & Keamanan' },
    { id: 'pemesanan', title: '3. Pemesanan & Pembayaran' },
    { id: 'etiket', title: '4. E-Tiket & Check-In' },
    { id: 'refund', title: '5. Pembatalan & Refund' },
    { id: 'kewajiban-eo', title: '6. Kewajiban Event Organizer' },
    { id: 'moderasi', title: '7. Konten Terlarang & Moderasi' },
    { id: 'tanggung-jawab', title: '8. Batasan Tanggung Jawab' },
    { id: 'hukum', title: '9. Hukum yang Berlaku' },
    { id: 'kontak', title: '10. Kontak & Bantuan' },
];

export default function Terms({ auth }) {
    return (
        <>
            <Head title="Ketentuan Layanan - Hajirin" />

            <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
                <Navbar auth={auth} />

                <header className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-blue transition mb-4"
                        >
                            <ArrowLeft className="size-3.5" aria-hidden="true" />
                            <span>Kembali ke Beranda</span>
                        </Link>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div className="space-y-2 max-w-2xl">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-brand-blue">
                                    <FileText className="size-3.5" aria-hidden="true" />
                                    Dokumen Legal Platform
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-navy">
                                    Ketentuan Layanan Hajirin
                                </h1>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Ketentuan ini mengatur hak, kewajiban, dan tanggung jawab Pengguna, Peserta, Penyelenggara Event (EO), serta Administrator dalam menggunakan layanan manajemen acara dan e-ticketing Hajirin.
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 shrink-0">
                                <CalendarDays className="size-4 text-slate-400" aria-hidden="true" />
                                <span>Terakhir diperbarui: 24 November 2026</span>
                            </div>
                        </div>
                    </div>
                </header>

                <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Daftar Isi */}
                        <aside className="lg:col-span-4 lg:sticky lg:top-24">
                            <nav
                                aria-label="Daftar isi Ketentuan Layanan"
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3"
                            >
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Daftar Isi
                                </p>
                                <ul className="space-y-1.5 text-sm">
                                    {TERMS_SECTIONS.map((section) => (
                                        <li key={section.id}>
                                            <a
                                                href={`#${section.id}`}
                                                className="block rounded-lg px-2.5 py-1.5 text-slate-600 hover:bg-blue-50 hover:text-brand-blue transition font-medium"
                                            >
                                                {section.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>

                                <div className="pt-3 border-t border-slate-100">
                                    <Link
                                        href="/kebijakan-privasi"
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:underline"
                                    >
                                        <ShieldCheck className="size-4" aria-hidden="true" />
                                        <span>Baca Kebijakan Privasi</span>
                                    </Link>
                                </div>
                            </nav>
                        </aside>

                        {/* Isi Pasal */}
                        <article className="lg:col-span-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-2xs space-y-10 text-sm leading-relaxed text-slate-700">
                            <section id="definisi" className="scroll-mt-24 space-y-3">
                                <h2 className="text-xl font-bold text-navy">1. Definisi &amp; Ruang Lingkup Layanan</h2>
                                <p>
                                    Dengan mengakses, mendaftar, atau melakukan transaksi di platform <strong>Hajirin</strong>, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh isi Ketentuan Layanan ini.
                                </p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li><strong>Platform:</strong> Situs web dan sistem e-ticketing Hajirin yang memfasilitasi publikasi acara, pemesanan tiket digital, manajemen peserta, dan validasi kehadiran berbasis QR Code.</li>
                                    <li><strong>Peserta (User):</strong> Pengguna terdaftar yang menjelajahi katalog, menyimpan bookmark, membeli tiket, dan menggunakan e-tiket untuk menghadiri acara.</li>
                                    <li><strong>Event Organizer (EO):</strong> Pihak individu, komunitas, atau badan hukum yang telah melalui proses verifikasi dokumen oleh Administrator untuk menyelenggarakan acara dan menjual tiket di Hajirin.</li>
                                    <li><strong>Staff Check-In:</strong> Akun panitia yang ditugaskan secara terbatas oleh EO untuk memindai dan memverifikasi kehadiran peserta pada event tertentu.</li>
                                </ul>
                            </section>

                            <section id="akun" className="scroll-mt-24 space-y-3">
                                <h2 className="text-xl font-bold text-navy">2. Pendaftaran Akun &amp; Keamanan</h2>
                                <p>
                                    Untuk membeli tiket, mengajukan status EO, atau mengelola acara, Anda wajib membuat akun dengan informasi yang benar, akurat, dan terkini (nama lengkap, alamat email aktif, serta nomor telepon bila diperlukan).
                                </p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>Anda bertanggung jawab penuh atas kerahasiaan kata sandi dan seluruh aktivitas yang terjadi melalui akun Anda.</li>
                                    <li>Satu alamat email hanya dapat digunakan untuk satu akun terdaftar.</li>
                                    <li>Segera gunakan fitur <em>Lupa Kata Sandi</em> atau hubungi Administrator apabila Anda menduga terjadi akses tidak sah pada akun Anda.</li>
                                    <li>Administrator berhak menangguhkan (<em>suspend</em>) akun yang terbukti melanggar ketentuan atau melakukan aktivitas penipuan.</li>
                                </ul>
                            </section>

                            <section id="pemesanan" className="scroll-mt-24 space-y-3">
                                <h2 className="text-xl font-bold text-navy">3. Pemesanan, Kuota, &amp; Pembayaran Tiket</h2>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>Harga, kuota, jadwal penjualan, dan batas maksimal pembelian per transaksi ditetapkan sepenuhnya oleh masing-masing Event Organizer.</li>
                                    <li>Setiap pesanan berstatus <strong>PENDING</strong> memiliki batas waktu pembayaran selama <strong>15 menit</strong>. Apabila melewati batas waktu tersebut tanpa pelunasan, pesanan akan otomatis kedaluwarsa (<strong>EXPIRED</strong>) dan kuota tiket dikembalikan ke sistem.</li>
                                    <li>Tiket gratis (Rp0) akan terkonfirmasi secara langsung setelah formulir pemesanan diselesaikan.</li>
                                    <li>Pesanan yang telah lunas (<strong>PAID</strong>) akan menghasilkan nomor referensi pesanan resmi serta rincian invoice yang dapat diakses kapan saja melalui halaman Dashboard Akun.</li>
                                </ul>
                            </section>

                            <section id="etiket" className="scroll-mt-24 space-y-3">
                                <h2 className="text-xl font-bold text-navy">4. E-Tiket Digital &amp; Validasi Check-In</h2>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>Setiap lembar tiket memiliki kode unik dan QR Code yang bersifat rahasia dan hanya berlaku untuk <strong>satu kali check-in</strong>.</li>
                                    <li>Peserta wajib menjaga kerahasiaan kode QR e-tiket. Hajirin tidak bertanggung jawab atas penyalahgunaan tiket akibat penggandaan atau penyebaran QR Code oleh pemilik tiket.</li>
                                    <li>Saat check-in diverifikasi oleh EO atau Staff Check-In, status tiket berubah dari <strong>ACTIVE</strong> menjadi <strong>USED</strong> secara permanen disertai pencatatan waktu dan petugas pemeriksa.</li>
                                    <li>Untuk acara daring (<em>online event</em>), tautan akses acara hanya diberikan kepada pemegang tiket yang sah sesuai ketentuan penyelenggara.</li>
                                </ul>
                            </section>

                            <section id="refund" className="scroll-mt-24 space-y-3">
                                <h2 className="text-xl font-bold text-navy">5. Pembatalan Event &amp; Kebijakan Pengembalian Dana (Refund)</h2>
                                <p>
                                    Peserta dapat mengajukan permohonan pengembalian dana melalui halaman Detail Pesanan dengan syarat dan ketentuan berikut:
                                </p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>Pengajuan refund hanya berlaku untuk pesanan berbayar (nominal lebih dari Rp0) dengan status <strong>PAID</strong>.</li>
                                    <li>Tiket pada pesanan tersebut <strong>belum pernah digunakan</strong> untuk check-in (tidak ada tiket berstatus <strong>USED</strong>).</li>
                                    <li>Setiap pengajuan refund akan ditinjau oleh Administrator platform. Apabila disetujui, seluruh e-tiket pada pesanan terkait akan otomatis dibatalkan (<strong>CANCELLED</strong>), status pesanan diperbarui, dan kuota dikembalikan ke event.</li>
                                    <li>Apabila pengajuan refund ditolak, Administrator akan menyertakan catatan evaluasi dan peserta dapat mengajukan ulang apabila terdapat informasi tambahan yang relevan.</li>
                                    <li>Jika suatu acara dibatalkan secara sepihak oleh EO atau diturunkan oleh Administrator, peserta akan menerima notifikasi resmi di dalam platform dan berhak mengajukan pengembalian dana penuh.</li>
                                </ul>
                            </section>

                            <section id="kewajiban-eo" className="scroll-mt-24 space-y-3">
                                <h2 className="text-xl font-bold text-navy">6. Kewajiban Event Organizer (EO) &amp; Panitia</h2>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>Calon EO wajib melampirkan dokumen legalitas/identitas organisasi yang sah saat mengajukan pendaftaran akun EO.</li>
                                    <li>Setiap event baru atau perubahan substantif harus melalui proses peninjauan (<em>review</em>) oleh Administrator sebelum tampil di katalog publik.</li>
                                    <li>EO bertanggung jawab penuh atas pelaksanaan acara, keakuratan informasi jadwal, lokasi/tautan daring, fasilitas tiket, serta keselamatan peserta di lokasi acara.</li>
                                    <li>EO wajib menjaga kerahasiaan data peserta yang diperoleh melalui fitur daftar peserta, ekspor CSV, dan portal Staff Check-In, serta hanya menggunakannya untuk keperluan operasional acara tersebut.</li>
                                    <li>Fitur <em>Broadcast Pengumuman</em> hanya boleh digunakan untuk menyampaikan informasi relevan terkait acara (seperti perubahan jadwal, akses lokasi, atau tautan sesi) dan dilarang digunakan untuk spam atau promosi pihak ketiga tanpa izin.</li>
                                </ul>
                            </section>

                            <section id="moderasi" className="scroll-mt-24 space-y-3">
                                <h2 className="text-xl font-bold text-navy">7. Konten Terlarang &amp; Hak Moderasi</h2>
                                <p>Pengguna dan EO dilarang mempublikasikan atau mendistribusikan acara maupun konten yang:</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>Melanggar hukum yang berlaku di Republik Indonesia, mengandung penipuan, perjudian, ujaran kebencian, atau konten asusila.</li>
                                    <li>Melanggar hak cipta, merek dagang, atau hak kekayaan intelektual milik pihak lain.</li>
                                    <li>Memuat informasi fiktif terkait tanggal, lokasi, pembicara, atau harga tiket.</li>
                                </ul>
                                <p>
                                    Administrator berhak menolak pengajuan event, menarik (<em>take down</em>) event yang sedang tayang, mencabut hak akses EO, atau menangguhkan akun tanpa pemberitahuan sebelumnya apabila ditemukan pelanggaran berat.
                                </p>
                            </section>

                            <section id="tanggung-jawab" className="scroll-mt-24 space-y-3">
                                <h2 className="text-xl font-bold text-navy">8. Hak Kekayaan Intelektual &amp; Batasan Tanggung Jawab</h2>
                                <p>
                                    Seluruh desain antarmuka, logo, kode sumber, dan merek <strong>Hajirin</strong> merupakan milik pengelola platform. Banner dan materi publikasi acara tetap menjadi tanggung jawab dan hak milik masing-masing EO yang mengunggahnya.
                                </p>
                                <p>
                                    Hajirin berperan sebagai penyedia infrastruktur teknologi e-ticketing. Hajirin tidak bertanggung jawab atas kerugian tidak langsung, pembatalan mendadak akibat keadaan kahar (<em>force majeure</em>), maupun insiden fisik di lokasi acara yang diselenggarakan oleh EO.
                                </p>
                            </section>

                            <section id="hukum" className="scroll-mt-24 space-y-3">
                                <h2 className="text-xl font-bold text-navy">9. Hukum yang Berlaku &amp; Perubahan Ketentuan</h2>
                                <p>
                                    Ketentuan Layanan ini tunduk dan ditafsirkan berdasarkan hukum Negara Kesatuan Republik Indonesia. Hajirin dapat memperbarui ketentuan ini sewaktu-waktu seiring perkembangan fitur; tanggal pembaruan terbaru akan selalu dicantumkan di bagian atas halaman ini.
                                </p>
                            </section>

                            <section id="kontak" className="scroll-mt-24 space-y-3">
                                <h2 className="text-xl font-bold text-navy">10. Kontak &amp; Layanan Bantuan</h2>
                                <p>
                                    Jika Anda memiliki pertanyaan terkait Ketentuan Layanan, kendala transaksi tiket, atau pelaporan acara mencurigakan, silakan hubungi tim pengelola Hajirin:
                                </p>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-brand-blue">
                                            <Mail className="size-5" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-navy">Tim Dukungan Hajirin</p>
                                            <p className="text-xs text-slate-500">admin@hajirin.com (Senin - Jumat, 09.00 - 17.00 WIB)</p>
                                        </div>
                                    </div>
                                    <Link
                                        href="/kebijakan-privasi"
                                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-navy hover:bg-slate-100 transition"
                                    >
                                        Lihat Kebijakan Privasi
                                    </Link>
                                </div>
                            </section>
                        </article>
                    </div>
                </main>

                <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-500">
                    © 2026 Hajirin - Platform Manajemen Event &amp; E-Ticketing Indonesia.
                </footer>
            </div>
        </>
    );
}
