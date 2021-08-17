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
import {
  fillGaps, findClossestPoint, sortBy, roundedTimeStamp,
} from "utils";

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
            setData((prevState) => (
              {
                ...prevState,
                isMonitoring: responseData.isMonitoring,
                breaks: responseData.breaks,
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
          sendNotificationEvent({ type: "ERROR", text: message || "There is some issue with your action. Please try again." });
          setIsLoading(false);
        }
      }}
    >
      {isLoading && <Spinner />}
      {!isLoading && data.isMonitoring && (
        <>
          <Icons.Pause />
          Pause
        </>
      )}
      {!isLoading && !data.isMonitoring && (
        <>
          <Icons.Play />
          Start
        </>
      )}
      &nbsp;Monitoring
    </Button>
  );
};
