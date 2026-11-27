import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, FileText, Lock, Mail, ShieldCheck } from 'lucide-react';
import UserLayout from '../../Layouts/UserLayout';

const PRIVACY_SECTIONS = [
    { id: 'komitmen', title: '1. Komitmen Pelindungan Data' },
    { id: 'data-dikumpulkan', title: '2. Data yang Kami Kumpulkan' },
    { id: 'tujuan', title: '3. Tujuan Pemrosesan Data' },
    { id: 'pembagian', title: '4. Pembagian Data dengan EO' },
    { id: 'keamanan', title: '5. Penyimpanan & Keamanan' },
    { id: 'hak-pengguna', title: '6. Hak Subjek Data' },
    { id: 'cookie', title: '7. Cookie & Sesi Masuk' },
    { id: 'kontak-privasi', title: '8. Perubahan & Kontak Privasi' },
];

export default function Privacy({ auth }) {
    return (
        <>
            <Head title="Kebijakan Privasi - Hajirin" />

            <UserLayout auth={auth} className="bg-[#F8FAFC] text-slate-800">

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
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                                    Pelindungan Data Pribadi
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-navy">
                                    Kebijakan Privasi Hajirin
                                </h1>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Kebijakan Privasi ini menjelaskan bagaimana Hajirin mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi Anda sesuai prinsip Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
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
                                aria-label="Daftar isi Kebijakan Privasi"
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3"
                            >
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Daftar Isi
                                </p>
                                <ul className="space-y-1.5 text-sm">
                                    {PRIVACY_SECTIONS.map((section) => (
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
                                        href="/syarat-ketentuan"
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:underline"
                                    >
                                        <FileText className="size-4" aria-hidden="true" />
                                        <span>Baca Ketentuan Layanan</span>
                                    </Link>
                                </div>
                            </nav>
                        </aside>

                        {/* Isi Kebijakan */}
                        <article className="lg:col-span-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-2xs space-y-10 text-sm leading-relaxed text-slate-700">
                            <section id="komitmen" className="scroll-mt-24 space-y-3">
                                <h2 className="text-xl font-bold text-navy">1. Komitmen Pelindungan Data Pribadi</h2>
                                <p>
                                    Privasi Anda sangat penting bagi kami. Hajirin hanya mengumpulkan data pribadi yang secara wajar dibutuhkan untuk menyelenggarakan layanan pemesanan tiket, pengelolaan event, verifikasi penyelenggara, dan keamanan transaksi di platform kami. Kami tidak pernah memperjualbelikan data pribadi pengguna kepada pihak ketiga.
                                </p>
                            </section>

                            <section id="data-dikumpulkan" className="scroll-mt-24 space-y-3">
                                <h2 className="text-xl font-bold text-navy">2. Data Pribadi yang Kami Kumpulkan</h2>
                                <p>Jenis data yang kami proses bergantung pada fitur yang Anda gunakan:</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li><strong>Data Akun Pengguna:</strong> Nama lengkap, alamat email, nomor telepon (opsional), foto profil (avatar), serta kata sandi yang disimpan dalam bentuk terenkripsi (<em>hashed</em>).</li>
                                    <li><strong>Data Pemesanan &amp; E-Tiket:</strong> Nama peserta, email peserta, nomor telepon peserta, jenis tiket yang dipesan, metode pembayaran, referensi transaksi, riwayat refund, serta waktu check-in.</li>
                                    <li><strong>Data Pengajuan Event Organizer (EO):</strong> Nama organisasi, nomor kontak penanggung jawab (PIC), tautan portofolio, alasan pengajuan, dan dokumen verifikasi/legalitas yang diunggah.</li>
                                    <li><strong>Data Interaksi &amp; Preferensi:</strong> Daftar event yang disimpan (<em>bookmark</em>), status baca notifikasi, serta log aktivitas keamanan untuk mencegah penyalahgunaan.</li>
                                </ul>
                            </section>

                            <section id="tujuan" className="scroll-mt-24 space-y-3">
                                <h2 className="text-xl font-bold text-navy">3. Tujuan Pemrosesan Data Pribadi</h2>
                                <p>Kami memproses data pribadi Anda secara terbatas untuk:</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>Memverifikasi identitas akun, menerapkan kontrol akses berbasis peran (RBAC), dan memproses pengaturan ulang kata sandi.</li>
                                    <li>Memproses pemesanan tiket, menerbitkan e-tiket digital dengan kode QR unik, serta memvalidasi kehadiran di lokasi acara.</li>
                                    <li>Meninjau kelayakan akun Event Organizer (EO) dan moderasi publikasi event oleh Administrator.</li>
                                    <li>Memproses permohonan pengembalian dana (refund) serta mengirimkan notifikasi penting terkait transaksi dan pengumuman resmi dari penyelenggara event.</li>
                                    <li>Menyusun laporan statistik teragregasi dan melindungi sistem dari spam, penyalahgunaan, serta percobaan akses ilegal.</li>
                                </ul>
                            </section>

                            <section id="pembagian" className="scroll-mt-24 space-y-3">
                                <h2 className="text-xl font-bold text-navy">4. Pembagian Data dengan Penyelenggara Event (EO) &amp; Pihak Terkait</h2>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>Ketika Anda membeli tiket suatu acara, data peserta pada tiket (nama, email, nomor telepon, kategori tiket, dan status check-in) dibagikan kepada <strong>Event Organizer</strong> penyelenggara acara tersebut demi kelancaran registrasi dan komunikasi acara.</li>
                                    <li><strong>Staff Check-In</strong> yang ditugaskan EO hanya dapat melihat data validasi kehadiran peserta pada event yang ditugaskan dan tidak diberikan akses terhadap data finansial platform.</li>
                                    <li>Dokumen verifikasi pengajuan EO disimpan secara privat di server dan hanya dapat diakses oleh Administrator berwenang melalui tautan bertanda tangan berbatas waktu (<em>temporary signed URL</em>).</li>
                                    <li>Kami dapat mengungkapkan data apabila diwajibkan oleh peraturan perundang-undangan atau perintah resmi aparat penegak hukum yang sah.</li>
                                </ul>
                            </section>

                            <section id="keamanan" className="scroll-mt-24 space-y-3">
                                <h2 className="text-xl font-bold text-navy">5. Penyimpanan, Keamanan, &amp; Retensi Data</h2>
                                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 flex items-start gap-3">
                                    <Lock className="size-5 text-brand-blue shrink-0 mt-0.5" aria-hidden="true" />
                                    <p className="text-xs text-slate-700 leading-relaxed">
                                        Seluruh kata sandi diamankan menggunakan algoritma hashing kriptografi (Bcrypt), formulir dilindungi token CSRF, pembatasan laju permintaan (<em>rate limiting</em>) diterapkan pada titik sensitif, dan akses ke berkas privat diverifikasi di sisi server.
                                    </p>
                                </div>
                                <p>
                                    Kami menyimpan data akun selama akun Anda aktif. Data transaksi tiket, invoice, dan riwayat refund disimpan sesuai kebutuhan audit dan kewajiban hukum yang berlaku, meskipun Anda tidak lagi aktif menggunakan layanan.
                                </p>
                            </section>

                            <section id="hak-pengguna" className="scroll-mt-24 space-y-3">
                                <h2 className="text-xl font-bold text-navy">6. Hak Anda sebagai Subjek Data</h2>
                                <p>Sesuai ketentuan UU PDP, Anda memiliki hak untuk:</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li><strong>Mengakses &amp; Memperbarui Data:</strong> Melihat riwayat transaksi serta mengubah nama, nomor telepon, foto profil, dan kata sandi secara langsung melalui halaman Dashboard Akun.</li>
                                    <li><strong>Meminta Koreksi atau Penghapusan:</strong> Mengajukan koreksi data yang tidak akurat atau permintaan penghapusan akun kepada Administrator (sepanjang tidak terikat kewajiban transaksi aktif).</li>
                                    <li><strong>Menarik Persetujuan:</strong> Menghentikan penggunaan layanan atau mencabut bookmark dan notifikasi kapan saja.</li>
                                </ul>
                            </section>

                            <section id="cookie" className="scroll-mt-24 space-y-3">
                                <h2 className="text-xl font-bold text-navy">7. Cookie &amp; Sesi Autentikasi</h2>
                                <p>
                                    Hajirin menggunakan cookie teknis esensial untuk menjaga sesi login Anda tetap aktif, melindungi formulir dari serangan CSRF (<code>XSRF-TOKEN</code>), dan menyimpan preferensi navigasi dasar. Kami tidak memasang pelacak iklan pihak ketiga lintas situs.
                                </p>
                            </section>

                            <section id="kontak-privasi" className="scroll-mt-24 space-y-3">
                                <h2 className="text-xl font-bold text-navy">8. Perubahan Kebijakan &amp; Kontak Pengaduan Privasi</h2>
                                <p>
                                    Kebijakan Privasi ini dapat diperbarui sewaktu-waktu untuk menyesuaikan perubahan layanan atau regulasi. Jika Anda ingin menggunakan hak subjek data atau memiliki pertanyaan mengenai privasi di Hajirin, hubungi kami melalui:
                                </p>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                            <Mail className="size-5" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-navy">Petugas Pelindungan Data Hajirin</p>
                                            <p className="text-xs text-slate-500">privacy@hajirin.com / admin@hajirin.com</p>
                                        </div>
                                    </div>
                                    <Link
                                        href="/syarat-ketentuan"
                                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-navy hover:bg-slate-100 transition"
                                    >
                                        Lihat Ketentuan Layanan
                                    </Link>
                                </div>
                            </section>
                        </article>
                    </div>
                </main>

                <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-500">
                    © 2026 Hajirin - Platform Manajemen Event &amp; E-Ticketing Indonesia.
                </footer>
            </UserLayout>
        </>
    );
}
