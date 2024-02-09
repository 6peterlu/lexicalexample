/** @type {import('next').NextConfig} */
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const nextConfig = {
  productionBrowserSourceMaps: true,
  webpack: (
    config,
    {
      buildId,
      dev,
      isServer,
      defaultLoaders,
      nextRuntime,
      webpack
    }
  ) => {
    if (!dev && !isServer) {
      config.optimization.minimizer = [
        new TerserPlugin({
          parallel: false
        })
      ];
    }
    config.resolve.alias = {
      yjs: path.resolve(__dirname, 'node_modules/yjs'),
      ...config.resolve.alias
    };
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack']
    });
    return config;
  },
  experimental: {
    esmExternals: false
  }
};

module.exports = nextConfig;
