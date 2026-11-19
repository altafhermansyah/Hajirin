import React, { useMemo } from 'react';
import { generateQrMatrix } from '../lib/qr';

/**
 * Renders a scannable SVG QR code for a ticket code or short verification string.
 */
export default function QrCodeSvg({ value, className = 'size-40', quietZone = 4 }) {
    const matrix = useMemo(() => {
        if (!value) return null;
        return generateQrMatrix(value);
    }, [value]);

    if (!matrix) {
        return null;
    }

    const totalSize = matrix.size + quietZone * 2;
    const paths = [];

    for (let r = 0; r < matrix.size; r++) {
        for (let c = 0; c < matrix.size; c++) {
            if (matrix.modules[r][c] === 1) {
                paths.push(`M${c + quietZone},${r + quietZone}h1v1h-1z`);
            }
        }
    }

    return (
        <svg
            viewBox={`0 0 ${totalSize} ${totalSize}`}
            role="img"
            aria-label={`QR Code tiket ${value}`}
            shapeRendering="crispEdges"
            className={className}
        >
            <rect width={totalSize} height={totalSize} fill="#ffffff" />
            <path d={paths.join('')} fill="#111827" />
        </svg>
    );
}
