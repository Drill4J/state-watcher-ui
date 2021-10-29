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
import React, { Dispatch, SetStateAction } from "react";
import { Button, Icons, Spinner } from "@drill4j/ui-kit";
import { sendNotificationEvent } from "@drill4j/send-notification-event";
import axios from "axios";
import "twin.macro";

import { StateWatcherLineChart, StateWatcherData } from "types";
import { roundTimeStamp } from "utils";

interface Props {
  agentId: string;
  data: StateWatcherLineChart;
  setData: Dispatch<SetStateAction<StateWatcherLineChart>>;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  size: "large" | "small";
  onClick?: () => void;
}

type Action = "STOP_RECORD" | "START_RECORD";

export const MonitoringButton = ({
  agentId, data, setData, isLoading, setIsLoading, size, onClick,
}: Props) => {
  const ACTION_TYPE = `${data.isMonitoring ? "STOP" : "START"}_RECORD` as Action;
  return (
    <Button
      style={{ minWidth: "178px" }}
      primary
      size={size}
      onClick={async () => {
        try {
          setIsLoading(true);
          const response = await axios.post(`/agents/${agentId}/plugins/stateWatcher/dispatch-action`, {
            type: ACTION_TYPE,
          });

          const responseData: StateWatcherData = response?.data?.data?.payload;

          if (ACTION_TYPE === "START_RECORD") {
            const pauseRanges = responseData.breaks.map(({ from, to }) =>
              ({
                from: roundTimeStamp(from),
                to: roundTimeStamp(to),
              })).flat();

            setData((prevState) => (
              {
                ...prevState,
                isMonitoring: responseData.isMonitoring,
                breaks: [...prevState.breaks, ...pauseRanges],
              }));
          } else {
            setData((prevState) => (
              {
                ...prevState,
                isMonitoring: responseData.isMonitoring,
              }));
          }

          onClick && onClick();
          setIsLoading(false);
        } catch ({ response: { data: { message } = {} } = {} }) {
          sendNotificationEvent({ type: "ERROR", text: message as any || "There is some issue with your action. Please try again." });
          setIsLoading(false);
        }
      }}
    >
      {isLoading && <Spinner />}
      {!isLoading && data.isMonitoring && (
        <>
          <Pause />
          Pause
        </>
      )}
      {!isLoading && !data.isMonitoring && (
        <>
          <Start />
          Start
        </>
      )}
      &nbsp;Monitoring
    </Button>
  );
};

const Pause = () => (
  <svg width="10px" height="12px" viewBox="0 0 10 12" version="1.1">
    <g id="State-Watcher" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g id="1.0.-SW.-Single-Agent.-Active-Monitoring" transform="translate(-1255.000000, -194.000000)" stroke="#FFFFFF">
        <g id="Title" transform="translate(80.000000, 160.000000)">
          <g id="Group-11-Copy-7" transform="translate(1152.000000, 24.000000)">
            <g id="Icons/16px/Play" transform="translate(23.000000, 10.000000)">
              {/* eslint-disable-next-line max-len */}
              <path d="M3.02444125,0.573013236 L3.48079269,11.0690962 L0.975558748,11.4269868 L0.519207314,0.930903799 L3.02444125,0.573013236 Z M9.02444125,0.573013236 L9.48079269,11.0690962 L6.97555875,11.4269868 L6.51920731,0.930903799 L9.02444125,0.573013236 Z" id="Combined-Shape" />
            </g>
          </g>
        </g>
      </g>
    </g>
  </svg>
);

const Start = () => (
  <svg width="14px" height="14px" viewBox="0 0 14 14" version="1.1">
    <g id="State-Watcher" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g id="1.0.-SW.-Single-Agent.-Graph-Hint" transform="translate(-1258.000000, -193.000000)" stroke="#FFFFFF">
        <g id="Title" transform="translate(80.000000, 160.000000)">
          <g id="Group-11-Copy-7" transform="translate(1152.000000, 24.000000)">
            <g id="Icons/16px/Play" transform="translate(26.000000, 9.000000)">
              {/* eslint-disable-next-line max-len */}
              <path d="M6.84188612,1.76172633 C7.3203705,1.83723623 7.39883174,1.91569748 7.4472136,2.01246118 L7.4472136,2.01246118 L12.8291796,12.7763932 C12.8909269,12.8998878 12.8967725,13.0367193 12.8563077,13.1581139 C12.8255172,13.2504851 12.7679133,13.3339185 12.6877214,13.3957374 L12.6877214,13.3957374 L1.61803399,13.5 C1.4799628,13.5 1.3549628,13.4440356 1.2644806,13.3535534 C1.19568044,13.2847532 1.14683729,13.195996 1.12737956,13.0967102 L1.12737956,13.0967102 L6.5527864,2.01246118 C6.61453372,1.88896656 6.7204915,1.8021912 6.84188612,1.76172633 Z" id="Triangle" transform="translate(7.000000, 7.000000) rotate(-270.000000) translate(-7.000000, -7.000000) " />
            </g>
          </g>
        </g>
      </g>
    </g>
  </svg>
);
