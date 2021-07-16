/*
 * Copyright 2020 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from "react";
import ReactDOM from "react-dom";
import singleSpaReact from "single-spa-react";
import axios from "axios";
import { BrowserRouter, Route } from "react-router-dom";

import { AgentPlugin as AgentPluginPage } from "./pages";
import { agentPluginPath } from "./common";

axios.defaults.baseURL = process.env.REACT_APP_API_HOST
  ? `http://${process.env.REACT_APP_API_HOST}/api`
  : "/api";

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");

    if (token) {
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

const ErrorBoundary = (err: Error, info: React.ErrorInfo, props: any) => (
  <ul>
    <li>err: {err}</li>
    <li>info: {info}</li>
    <li>props: {props}</li>
  </ul>
);
const AgentPluginLifecycle = singleSpaReact({
  React,
  ReactDOM,
  rootComponent: () => <BrowserRouter><Route path={agentPluginPath} component={AgentPluginPage} /></BrowserRouter>,
  errorBoundary: ErrorBoundary,
  domElementGetter: () => document.getElementById("state-watcher") || document.body,
});

export const AgentPlugin = {
  mount: [
    AgentPluginLifecycle.mount,
  ],
  unmount: [
    AgentPluginLifecycle.unmount,
  ],
  update: AgentPluginLifecycle.update,
  bootstrap: AgentPluginLifecycle.bootstrap,
};

export const AgentHUDLifecycle = singleSpaReact({
  React,
  ReactDOM,
  rootComponent: () => <div>State watcher HUD</div>,
  errorBoundary: ErrorBoundary,
});

export const AgentHUD = {
  mount: [
    AgentHUDLifecycle.mount,
  ],
  unmount: [
    AgentHUDLifecycle.unmount,
  ],
  update: AgentHUDLifecycle.update,
  bootstrap: AgentHUDLifecycle.bootstrap,
};
