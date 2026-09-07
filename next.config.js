/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        // Applies to every route.
        source: "/:path*",
        headers: [
          // Prevents the browser from guessing content types away from what
          // the server declared - mitigates some MIME-confusion attacks.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Blocks this site from being framed by other origins (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          // Sends only the origin, not the full URL (which could contain a
          // quote's public_id), to other sites when a link is followed out.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Voice input (Phase 4) needs the microphone on our own origin;
          // everything else sensitive is denied by default.
          { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
