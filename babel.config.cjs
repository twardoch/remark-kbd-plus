module.exports = {
  presets: [['@babel/preset-env', { modules: false }]],
  plugins: [],
  env: {
    development: {
      sourceMaps: 'inline',
    },
  },
};
