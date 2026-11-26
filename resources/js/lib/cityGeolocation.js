/**
 * Koordinat pusat kota-kota utama di Indonesia untuk pencocokan kota terdekat 100% di sisi klien.
 * Koordinat GPS pengguna tidak pernah dikirim ke server atau layanan pihak ketiga.
 */
const INDONESIA_CITIES = [
    { name: 'Jakarta', lat: -6.2088, lng: 106.8456 },
    { name: 'Tangerang', lat: -6.1783, lng: 106.6319 },
    { name: 'Bekasi', lat: -6.2383, lng: 106.9756 },
    { name: 'Depok', lat: -6.4025, lng: 106.7942 },
    { name: 'Bogor', lat: -6.5971, lng: 106.806 },
    { name: 'Bandung', lat: -6.9175, lng: 107.6191 },
    { name: 'Cirebon', lat: -6.732, lng: 108.5523 },
    { name: 'Semarang', lat: -6.9667, lng: 110.4167 },
    { name: 'Solo', lat: -7.5755, lng: 110.8243 },
    { name: 'Yogyakarta', lat: -7.7956, lng: 110.3695 },
    { name: 'Surabaya', lat: -7.2575, lng: 112.7521 },
    { name: 'Malang', lat: -7.9666, lng: 112.6326 },
    { name: 'Bali', lat: -8.6705, lng: 115.2126 },
    { name: 'Denpasar', lat: -8.6705, lng: 115.2126 },
    { name: 'Medan', lat: 3.5952, lng: 98.6722 },
    { name: 'Palembang', lat: -2.9761, lng: 104.7754 },
    { name: 'Padang', lat: -0.9471, lng: 100.4172 },
    { name: 'Pekanbaru', lat: 0.5071, lng: 101.4478 },
    { name: 'Batam', lat: 1.0456, lng: 104.0305 },
    { name: 'Bandar Lampung', lat: -5.45, lng: 105.2667 },
    { name: 'Makassar', lat: -5.1477, lng: 119.4327 },
    { name: 'Manado', lat: 1.4748, lng: 124.8421 },
    { name: 'Balikpapan', lat: -1.2379, lng: 116.8529 },
    { name: 'Samarinda', lat: -0.5022, lng: 117.1536 },
    { name: 'Banjarmasin', lat: -3.3194, lng: 114.5908 },
    { name: 'Pontianak', lat: -0.0263, lng: 109.3425 },
    { name: 'Mataram', lat: -8.5833, lng: 116.1167 },
    { name: 'Jayapura', lat: -2.5916, lng: 140.669 },
];

function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
}

/**
 * Hitung jarak lingkaran besar (Haversine) dalam kilometer antara dua titik koordinat.
 */
export function haversineDistanceKm(lat1, lng1, lat2, lng2) {
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
}

/**
 * Temukan kota terdekat dari koordinat GPS perangkat terhadap daftar kota yang tersedia.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {string[]} availableCities
 * @returns {{ city: string, distanceKm: number } | null}
 */
export function findNearestCity(lat, lng, availableCities = []) {
    const normalizedAvailable = availableCities
        .filter((city) => city && city.toLowerCase() !== 'semua kota')
        .map((city) => ({
            original: city,
            lower: city.trim().toLowerCase(),
        }));

    // Prioritaskan kota-kota yang ada dalam daftar filter aktif bila memiliki koordinat dikenal
    const candidateCities = [];
    for (const item of normalizedAvailable) {
        const matched = INDONESIA_CITIES.find(
            (c) =>
                c.name.toLowerCase() === item.lower ||
                item.lower.includes(c.name.toLowerCase()) ||
                c.name.toLowerCase().includes(item.lower)
        );
        if (matched) {
            candidateCities.push({
                name: item.original,
                lat: matched.lat,
                lng: matched.lng,
            });
        }
    }

    const pool = candidateCities.length > 0 ? candidateCities : INDONESIA_CITIES;

    let nearest = null;
    for (const candidate of pool) {
        const distanceKm = haversineDistanceKm(lat, lng, candidate.lat, candidate.lng);
        if (!nearest || distanceKm < nearest.distanceKm) {
            nearest = {
                city: candidate.name,
                distanceKm: Math.round(distanceKm),
            };
        }
    }

    return nearest;
}
