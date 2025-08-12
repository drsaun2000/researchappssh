export const buildOptimizations = {
  // Bundle splitting strategy
  splitChunks: {
    chunks: "all" as const,
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: "vendors",
        chunks: "all" as const,
        priority: 10,
        enforce: true,
      },
      ui: {
        test: /[\\/]components[\\/]ui[\\/]/,
        name: "ui-components",
        chunks: "all" as const,
        priority: 20,
        enforce: true,
      },
      aceternity: {
        test: /[\\/]components[\\/]aceternity-inspired[\\/]/,
        name: "aceternity",
        chunks: "all" as const,
        priority: 15,
        enforce: true,
      },
      common: {
        minChunks: 2,
        chunks: "all" as const,
        name: "common",
        priority: 5,
        enforce: true,
      },
    },
  },

  // Tree shaking optimizations
  usedExports: true,
  sideEffects: false,

  // Minification settings
  minimize: true,
  minimizer: [
    "...",
    {
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ["console.log", "console.info", "console.debug"],
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
      },
    },
  ],
}

export const performanceOptimizations = {
  // Preload critical resources
  preloadCriticalAssets: ["/fonts/plus-jakarta-sans.woff2", "/images/logo.png"],

  // Resource hints
  resourceHints: {
    preconnect: ["https://fonts.googleapis.com", "https://fonts.gstatic.com"],
    prefetch: ["/api/health"],
  },

  // Cache strategies
  cacheStrategies: {
    static: "public, max-age=31536000, immutable",
    api: "no-store, must-revalidate",
    pages: "public, max-age=3600, stale-while-revalidate=86400",
  },
}
