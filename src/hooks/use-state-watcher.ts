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
import {
  Breaks, MemoryMetrics, Series, StateWatcherData,
} from "types/state-watcher";
import { useInterval } from "./use-interval";

export function useStateWatcher(agentId: string, buildVersion: string, windowMs: number) {
  const currentDate = Date.now();
  const refreshRate = 5000;
  const pointsCount = windowMs / refreshRate;

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
  }, []);

  function fillGaps(from: number, to: number): MemoryMetrics[] {
    const length = Math.round((to - from) / refreshRate);

    const createEmptyPoints = (_: any, k: number) => {
      const step = refreshRate * k;
      return { timeStamp: from + step, memory: { heap: null } };
    };
    return Array.from({ length }, createEmptyPoints);
  }

  const sliceStart = (seriesDataLength: number) => (seriesDataLength > pointsCount ? 1 : 0);

  function addNewSeries(prevSeries: Series, newSeries: Series) {
    if (prevSeries.length === 0) return newSeries;
    return prevSeries.map(({ instanceId, data: prevSeriesData }) => {
      const concatedSeries = [
        ...prevSeriesData,
        ...(newSeries.find(
          ({ instanceId: newDataInstanceId }) => newDataInstanceId === instanceId,
        )?.data || []),
      ];

      // if (breaks.length > 0) {
      //   const seriesData = sortBy([...concatedSeries, ...breaks.map(({ from, to }) =>
      //     fillGaps(from, to))].flat(), "timeStamp");

      //   return ({
      //     instanceId,
      //     data: seriesData.slice(-pointsCount),
      //   });
      // }

      return ({
        instanceId,
        data: concatedSeries.slice(sliceStart(prevSeriesData.length)),
      });
    });
  }

  useInterval(
    () => setData((prevState) =>
      ({
        ...prevState,
        series: prevState.series.map(({ instanceId, data: prevSeriesData }) => (
          {
            instanceId,
            data: prevSeriesData.slice(sliceStart(prevSeriesData.length)),
          })),
        xTicks: [...prevState.xTicks, prevState.xTicks[prevState.xTicks.length - 1] + refreshRate].slice(1),
      })),
    refreshRate,
  );

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const response = await axios.post(
          `/agents/${agentId}/plugins/stateWatcher/dispatch-action`,
          {
            type: "RECORD_DATA",
            payload: { from: currentDate - windowMs, to: currentDate },
          },
        );
        const responseData: StateWatcherData = response.data.data;

        setData({
          ...responseData,
          series: responseData.series.map(({ instanceId, data: seriesData }) =>
            ({
              instanceId,
              data: sortBy([...seriesData, ...responseData.breaks.map(({ from, to }) =>
                fillGaps(from, to))].flat(), "timeStamp"),
            })),
          xTicks: Array.from({ length: pointsCount }, (_, k) => currentDate - windowMs + refreshRate * k),
        });

        setIsLoading(false);
      } catch ({ response: { data: { message } = {} } = {} }) {
        sendNotificationEvent({ type: "ERROR", text: message || "There is some issue with your action. Please try again." });
        setIsLoading(false);
      }
    })();
  }, [windowMs]);

  return {
    data,
    setData,
    isLoading,
    setIsLoading,
  };
}

function sortBy(arr: MemoryMetrics[], key: keyof MemoryMetrics) {
  const compare = (a: MemoryMetrics, b:MemoryMetrics) => {
    if (a[key] < b[key]) {
      return -1;
    }
    if (a[key] > b[key]) {
      return 1;
    }

    return 0;
  };
  return [...arr].sort(compare);
}
