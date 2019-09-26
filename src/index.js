import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import registerServiceWorker from "./registerServiceWorker";
import Raven from 'raven-js';
import "./index.css";
import "bootstrap/dist/css/bootstrap.css";

Raven.config("https://c06b1cd99a5d4fc980082887814aefcc@sentry.io/1761917", {
  release: '1-0-0',
  environment: 'development-test'
}).install()

ReactDOM.render(<App />, document.getElementById("root"));
registerServiceWorker();
