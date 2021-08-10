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
import "twin.macro";

import { useAdminConnection } from "hooks";
import { Agent } from "@drill4j/types-admin";
import { Header } from "./header";
import { AgentStateWatcherLineChart } from "./agent-state-watcher-line-chart";
import { GlobalStyle } from "../../styles/global-styles";
import "../../index.css";

export const GroupPlugin = () => {
  const agentsList = useAdminConnection<Agent[]>("/api/agents") || [];

  return (
    <div tw="w-full h-full">
      <GlobalStyle />
      <Header />
      {agentsList.map(({
        id = "", buildVersion = "", instanceIds = [], group = "",
      }) => (
        group && (
          <AgentStateWatcherLineChart
            key={id}
            id={id}
            buildVersion={buildVersion}
            instanceIds={instanceIds}
          />
        )
      ))}
    </div>
  );
};
