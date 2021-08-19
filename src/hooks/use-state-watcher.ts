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
/* eslint-disable no-return-assign */
import { useEffect, useState } from "react";
import { sendNotificationEvent } from "@drill4j/send-notification-event";
import axios from "axios";

import { stateWatcherPluginSocket } from "common";
import {
  Series, StateWatcherData, StateWatcherLineChart, Point,
} from "types";
import { fillGaps, roundTimeStamp, sortBy } from "utils";
import { REFRESH_RATE, RESOLUTION } from "../constants";

export function useStateWatcher(agentId: string, buildVersion: string, windowMs: number) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<StateWatcherLineChart>({
    isMonitoring: false,
    maxHeap: 0,
    breaks: [],
    points: [],
    hasRecord: false,
  });

  useEffect(() => {
    function handleDataChange(newData: StateWatcherData) {
      if (Array.isArray(newData?.series) && newData.series.length > 0) {
        setData((prevState) => ({
          ...prevState,
          ...newData,
          points: addNewSeries(prevState.points, newData.series),
        }));
      }
    }

    function addNewSeries(prevPoints: Point[], newSeries: Series) {
      const newPoints = mapSeriesToXticks(newSeries, windowMs, roundTimeStamp() - windowMs);

      return [...prevPoints, ...newPoints].slice(prevPoints.length >= windowMs / REFRESH_RATE ? 1 : 0);
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

  useEffect(() => {
    const currentDate = roundTimeStamp();
    const start = currentDate - windowMs;
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

        const pauseRanges =
          responseData.breaks.map(({ from, to }) =>
            ({
              from: roundTimeStamp(from),
              to: roundTimeStamp(to),
            })).flat();

        setData({
          ...responseData,
          points: sortBy(
            [
              ...mapSeriesToXticks(responseData.series, windowMs, start),
              ...fillGaps(pauseRanges),
            ], "timeStamp",
          ),
          breaks: pauseRanges,
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

function mapSeriesToXticks(series: Series, windowMs: number, start: number) {
  const xTicks = Array
    .from({ length: (windowMs / RESOLUTION) + 1 }, (_, k) => start + RESOLUTION * k);

  const points = series.reduce((acc, instance, index) => {
    const mappedPoints = instance.data.map(({ timeStamp: currentPointTs, memory }) =>
      ({ timeStamp: roundTimeStamp(currentPointTs), [instance.instanceId]: memory.heap }));

    return index === 0 ? mappedPoints : acc.map((point, i) => ({ ...point, ...mappedPoints[i] }));
  }, [] as Point[]);

  return xTicks.map((tick) => points.find(({ timeStamp }) => timeStamp === tick) || ({ timeStamp: tick }));
}
