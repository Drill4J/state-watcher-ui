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
import { useEffect, useState } from "react";
import { sendNotificationEvent } from "@drill4j/send-notification-event";
import axios from "axios";

import { stateWatcherPluginSocket } from "common";
import { Series, StateWatcherData } from "types/state-watcher";
import { fillGaps, sortBy } from "utils";
import { useInterval } from "./use-interval";
import { REFRESH_RATE } from "../constants";

export function useStateWatcher(agentId: string, buildVersion: string, windowMs: number) {
  const currentDate = Date.now();
  const pointsCount = windowMs / REFRESH_RATE;
  const start = currentDate - windowMs;

  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<StateWatcherData>({
    isMonitoring: false,
    maxHeap: 0,
    breaks: [],
    series: [],
    xTicks: [],
    hasRecord: false,
  });

  useEffect(() => {
    function handleDataChange(newData: StateWatcherData) {
      if (newData) {
        setData((prevState) => ({
          ...prevState,
          ...newData,
          series: addNewSeries(prevState.series, newData.series),
        }));
      }
    }

    function addNewSeries(prevSeries: Series, newSeries: Series) {
      if (prevSeries.length === 0) return newSeries;
      return prevSeries.map(({ instanceId, data: prevSeriesData }) => {
        const concatedSeries = [
          ...prevSeriesData,
          ...(newSeries.find(
            ({ instanceId: newDataInstanceId }) => newDataInstanceId === instanceId,
          )?.data || []),
        ];

        return ({
          instanceId,
          data: concatedSeries.slice(prevSeriesData.length >= pointsCount ? 1 : 0),
        });
      });
    }

    const unsubscribe = stateWatcherPluginSocket.subscribe(
      "/metrics/heap/update",
      handleDataChange,
      {
        agentId,
        buildVersion,
        type: "AGENT",
      },
    );

    return () => {
      unsubscribe();
    };
  }, [windowMs]);

  const delay = data.isMonitoring ? REFRESH_RATE : null;
  useInterval(
    () => setData((prevState) =>
      ({
        ...prevState,
        xTicks: [...prevState.xTicks, prevState.xTicks[prevState.xTicks.length - 1] + REFRESH_RATE].slice(1),
      })),
    delay,
  );

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const response = await axios.post(
          `/agents/${agentId}/plugins/stateWatcher/dispatch-action`,
          {
            type: "RECORD_DATA",
            payload: { from: start, to: currentDate },
          },
        );

        const responseData: StateWatcherData = response.data.data;

        setData({
          ...responseData,
          series: responseData.series.map(({ instanceId, data: seriesData }) =>
            ({
              instanceId,
              data: sortBy([...seriesData, ...responseData.breaks.map(({ from, to }) =>
                fillGaps(from < start ? start : from, to))].flat(), "timeStamp"),
            })),
          xTicks: Array.from({ length: pointsCount }, (_, k) => Date.now() - windowMs + REFRESH_RATE * k),
        });

        setIsLoading(false);
      } catch ({ response: { data: { message } = {} } = {} }) {
        sendNotificationEvent({ type: "ERROR", text: message || "There is some issue with your action. Please try again." });
        setIsLoading(false);
      }
    })();
  }, [windowMs, data.isMonitoring]);

  return {
    data,
    setData,
    isLoading,
    setIsLoading,
  };
}
