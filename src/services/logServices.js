import Raven from 'raven-js';

function init() {
  Raven.config("https://c06b1cd99a5d4fc980082887814aefcc@sentry.io/1761917", {
    release: '1-0-0',
    environment: 'development-test'
  }).install()
}

function log(error) {
  Raven.captureException(error);
}

export default {
  init,
  log
}