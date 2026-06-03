import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const socialPreviewPath = '/logo-gcm-preview.png';

function getPublicSiteUrl() {
  const rawUrl =
    process.env.VITE_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    '';

  if (!rawUrl) {
    return '';
  }

  const withProtocol = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
  return withProtocol.replace(/\/$/, '');
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'social-preview-image-url',
      transformIndexHtml(html) {
        const siteUrl = getPublicSiteUrl();
        const imageUrl = siteUrl ? `${siteUrl}${socialPreviewPath}` : socialPreviewPath;

        return html.replaceAll('__SOCIAL_PREVIEW_IMAGE__', imageUrl);
      },
    },
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
