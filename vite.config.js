import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { bunny } from 'laravel-vite-plugin/fonts';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
            fonts: [
                bunny('Plus Jakarta Sans', {
                    weights: [400, 500, 600, 700, 800],
                }),
                bunny('Instrument Sans', {
                    weights: [400, 500, 600, 700],
                }),
            ],
        }),
        react(),
        tailwindcss(),
    ],
    server: {
        host: '127.0.0.1',
        warmup: {
            clientFiles: [
                './resources/js/Pages/Home.jsx',
                './resources/js/Pages/Dashboard.jsx',
                './resources/js/Pages/Eo/Dashboard.jsx',
                './resources/js/Pages/Admin/Dashboard.jsx',
            ],
        },
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
