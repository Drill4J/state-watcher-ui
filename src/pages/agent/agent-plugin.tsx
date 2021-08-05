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
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import "twin.macro";

import {
  StateWatcher, MonitoringButton, MonitoringIndicator, MonitoringTimeDropdown,
} from "components";
import { useAgent, useStateWatcher } from "hooks";
import { GlobalStyle } from "../../styles/global-styles";
import { Header } from "./header";
import "../../index.css";

export const AgentPlugin = () => {
  const { agentId = "", buildVersion = "" } = useParams<{ agentId: string; buildVersion: string; }>();
  const { buildVersion: activeBuildVersion = "", instanceIds = [] } = useAgent(agentId) || {};

  const [timeStamp, setTimeStamp] = useState(3600000);

  const {
    data, setData, isLoading, setIsLoading,
  } = useStateWatcher(agentId, buildVersion, timeStamp);

  const isActiveBuildVersion = buildVersion === activeBuildVersion;
  const haveData = data.series.some(({ data: seriesData }) => seriesData.length > 0);
  return (
    <>
      <GlobalStyle />
      <div tw="w-full h-full">
        <Header
          items={(
            <div tw="flex gap-x-6 items-center">
              <div tw="flex gap-x-4 items-center">
                <MonitoringTimeDropdown timeStamp={timeStamp} setTimeStamp={setTimeStamp} disable={!haveData} />
                <div tw="h-12 border-r border-monochrome-medium-tint" />
                <MonitoringIndicator active={data.isMonitoring} />
              </div>
              <MonitoringButton
                agentId={agentId}
                size="large"
                data={data}
                setData={setData}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </div>
          )}
        />
        <StateWatcher
          data={data}
          instanceIds={instanceIds}
          isActiveBuildVersion={isActiveBuildVersion}
          height={400}
        />
      </div>
    </>
  );
};
