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
  Series, StateWatcherData, StateWatcherLineChart, Point,
} from "types";
import { fillGaps, sortBy } from "utils";
import { REFRESH_RATE } from "../constants";

export function useStateWatcher(agentId: string, buildVersion: string, windowMs: number) {
  const currentDate = roundedTimeStamp();
  const start = currentDate - windowMs;
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<StateWatcherLineChart>({
    isMonitoring: false,
    maxHeap: 0,
    breaks: [],
    series: [],
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

    function addNewSeries(prevSeries: Point[], newSeries: Series) {
      const newPoint = newSeries.reduce((acc, point, pointIndex, points) => {
        const prevTimeStamp = prevSeries[prevSeries.length - 1]?.timeStamp;
        const currentPointTs = points[pointIndex].data[0]?.timeStamp;
        const currentPointHeap = points[pointIndex].data[0]?.memory?.heap;

        if ((prevTimeStamp + (REFRESH_RATE / 2)) > currentPointTs) {
          return ({ ...acc, timeStamp: prevTimeStamp, [point.instanceId]: currentPointHeap });
        }

        return ({
          ...acc,
          timeStamp: prevTimeStamp + REFRESH_RATE,
          [point.instanceId]: currentPointHeap,
        });
      }, {} as Point);
      return [...prevSeries, newPoint].slice(prevSeries.length >= windowMs / REFRESH_RATE ? 1 : 0);
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

        const pointsCount = Math.max(...responseData.series.map(({ data: points }) => points.length));
        const xTicks = Array.from({ length: pointsCount }, (_, k) => currentDate - windowMs + REFRESH_RATE * k);

        setData({
          ...responseData,
          series: xTicks.map((timeStamp, timeStampIndex, timeStampArray) =>
            responseData.series.map(({ instanceId, data: seriesData }) =>
              ({
                instanceId,
                data: sortBy([...seriesData, ...responseData.breaks.map(({ from, to }) =>
                  fillGaps(from < start ? start : from, to))].flat(), "timeStamp"),
              })).reduce((acc, point, pointIndex, points) => {
              const currentPointTs = points[pointIndex].data[timeStampIndex]?.timeStamp;
              const currentPointHeap = points[pointIndex].data[timeStampIndex]?.memory?.heap;

              if ((timeStamp + (REFRESH_RATE / 2)) > currentPointTs) {
                return ({ ...acc, timeStamp, [point.instanceId]: currentPointHeap });
              }

              return ({
                ...acc,
                timeStamp: timeStampArray.length - 1 === timeStampIndex
                  ? timeStamp + REFRESH_RATE
                  : timeStamp,
                [point.instanceId]: currentPointHeap,
              });
            }, {} as Point)),
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

function roundedTimeStamp() {
  const now = Date.now();
  const divisionRemainder = now % 5000;
  const diff = 5000 - divisionRemainder;
  return diff < divisionRemainder ? now + diff : now - divisionRemainder;
}
