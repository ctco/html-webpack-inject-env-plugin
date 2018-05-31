/**
 * InjectEnvHtmlWebpackPlugin injects env, that is filtered by mask, into html.
 * Depends on HtmlWebpackPlugin.
 */
'use strict';

const defaultOptions = Object.freeze({
  mask: 'WEB_APP_', // take the only env vars starts with mask provided
  name: 'env',      // under what name to be available inside 'window' object.
});

const understand = value => {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  // Int
  if (/^[+-]?\d+$/.test(value)) {
    return Number.parseInt(value);
  }
  // just String. Even floats. Obey.
  return value;
}

const clean = mask => env => Object.keys(env)
  .filter(name => name.startsWith(mask))
  .reduce((env0, name) => ({ ...env0, [name]: understand(env[name]) }), {});

const injectionFrom = name => env => `<script>
Object.defineProperty(window, '${name}', {
  configurable: false,
  enumerable: true,
  writable: false,
  value: Object.freeze(${JSON.stringify(env)}),
})
</script>`;

const injection = ({ mask, name }) => env =>
  [clean(mask), injectionFrom(name)].reduce((value, fn) => fn(value), env);

class HtmlWebpackInjectEnvPlugin {
  constructor(options = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  apply(compiler) {
    compiler.plugin('compilation', (compilation) => {
  
      compilation.plugin(
        'html-webpack-plugin-before-html-processing',
        (data, cb) => {
          data.html = data.html.replace(
            /(?=<\/head>)/,
            injection(this.options)(process.env)
          );
          cb(null, data);
        }
      );

    });
  }
}

module.exports = HtmlWebpackInjectEnvPlugin;