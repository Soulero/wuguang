/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['localhost', 'generativelanguage.googleapis.com'],
    },
};

module.exports = nextConfig;
