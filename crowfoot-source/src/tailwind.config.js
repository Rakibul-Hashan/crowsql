module.exports = {
  content: ['./src/body.html', './src/js/app.js'],
  theme: { extend: { fontFamily: {
    ui: ['"Schibsted Grotesk"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
    mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
  } } }
};
