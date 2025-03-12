export default {
    external: [
      // Core Node.js modules
      'fs', 'path', 'os', 'util', 'events', 'stream', 'assert', 'url', 'crypto',
      // Mark esbuild as external - this is the critical part
      'esbuild'
    ]
  };