import React, { useMemo } from 'react';
import { generateQrMatrix } from '../lib/qr';

/**
 * Renders a scannable SVG QR code for a ticket code or short verification string.
 */
export default function QrCodeSvg({ value, size, className = 'size-40', quietZone = 4 }) {
    const matrix = useMemo(() => {
        if (!value) return null;
        const text = String(value);
        try {
            return generateQrMatrix(text);
        } catch {
            return generateQrMatrix(text.slice(0, 100));
        }
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
            aria-label={`QR Code ${value}`}
            shapeRendering="crispEdges"
            style={size ? { width: size, height: size } : undefined}
            className={className}
        >
            <rect width={totalSize} height={totalSize} fill="#ffffff" />
            <path d={paths.join('')} fill="#111827" />
        </svg>
    );
}
