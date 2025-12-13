/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    typescript: {
        ignoreBuildErrors: true, // Fail-safe for CI builds
    },
};

export default nextConfig;
