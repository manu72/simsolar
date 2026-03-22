import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.glsl': { type: 'raw' },
      '*.vert': { type: 'raw' },
      '*.frag': { type: 'raw' },
    },
  },
}

export default nextConfig
