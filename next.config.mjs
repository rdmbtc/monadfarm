let userConfig = undefined
try {
  // try to import ESM first
  userConfig = await import('./v0-user-next.config.mjs')
} catch (e) {
  try {
    // fallback to CJS import
    userConfig = await import("./v0-user-next.config");
  } catch (innerError) {
    // ignore error
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode to prevent double-mounting issues with Phaser
  // DISABLE SSR COMPLETELY - Enable static export to make this a client-side only app
  // This resolves all React Together SSR issues by preventing server-side rendering
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  // Set standard page extensions
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Configure empty pages directory
  webpack: (config, { isServer }) => {
    // Fix compatibility issues with ethers and other libraries
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    
    // Handle document access in server components
    if (isServer) {
      config.externals.push({
        canvas: 'commonjs canvas',
      });
    }

    // Improve chunk loading for large dependencies like Phaser
    config.optimization.splitChunks = {
      ...config.optimization.splitChunks,
      chunks: 'all',
      cacheGroups: {
        ...config.optimization.splitChunks.cacheGroups,
        phaser: {
          test: /[\\/]node_modules[\\/](phaser)[\\/]/,
          name: 'phaser-vendor',
          chunks: 'all',
          priority: 10,
        },
      },
    };
    
    return config;
  },
  // Ignore specific build errors that are just warnings
  typescript: {
    // Disable type checking during production build for faster builds
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable eslint during production build for faster builds
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Required for static export
    domains: ['localhost'],
  },
  experimental: {
    // Disable all server-side features
    serverComponentsExternalPackages: [],
    // Force client-side rendering
    esmExternals: 'loose',
  },
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn'],
    },
  },
  // Remove basePath for Vercel deployment
  // ...(process.env.GITHUB_ACTIONS ? {
  //   basePath: '/nooter-s-farm',
  // } : {}),
};

if (userConfig) {
  // ESM imports will have a "default" property
  const config = userConfig.default || userConfig

  for (const key in config) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...config[key],
      }
    } else {
      nextConfig[key] = config[key]
    }
  }
}

export default nextConfig
