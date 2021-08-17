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
import { transformObjectsArrayToObject } from "@drill4j/common-utils";
import axios from "axios";

import { stateWatcherPluginSocket } from "common";
import {
  Series, StateWatcherData, StateWatcherLineChart, Point,
} from "types";
import {
  fillGaps, findClossestPoint, sortBy, roundedTimeStamp,
} from "utils";
import { REFRESH_RATE } from "../constants";

export function useStateWatcher(agentId: string, buildVersion: string, windowMs: number) {
  const closest = (arr: number[], n:number) => arr.reduce((prev, curr) => (Math.abs(curr - n) < Math.abs(prev - n) ? curr : prev));

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
      if (newData.series.length > 0) {
        setData((prevState) => ({
          ...prevState,
          ...newData,
          series: addNewSeries(prevState.series, newData.series),
        }));
      }
    }

    function addNewSeries(prevSeries: Point[], newSeries: Series) {
      const newPoint = newSeries.reduce((acc, instance) => {
        const prevTimeStamp = prevSeries[prevSeries.length - 1]?.timeStamp;
        const currentPointTs = instance.data[0]?.timeStamp;
        const currentPointHeap = instance.data[0]?.memory?.heap;

        return ({
          ...acc,
          timeStamp: closest([prevTimeStamp, prevTimeStamp + REFRESH_RATE], currentPointTs),
          [instance.instanceId]: currentPointHeap,
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
    const currentDate = roundedTimeStamp();
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

        const xTicks = Array
          .from({ length: windowMs / REFRESH_RATE }, (_, k) => start + REFRESH_RATE * k);

        const seriesPoints = responseData.series.reduce((acc, instance, index) => {
          const mappedTimeStamps = instance.data.map(({ timeStamp: currentPointTs, memory }) =>
            ({ timeStamp: closest(xTicks, currentPointTs), [instance.instanceId]: memory.heap }));

          return index === 0 ? [...acc, ...mappedTimeStamps] : acc.map((point, i) => ({ ...point, ...mappedTimeStamps[i] }));
        }, [] as Point[]);

        const pauseRanges =
          responseData.breaks.map(({ from, to }) =>
            ({
              from: closest(xTicks, from),
              to: closest(xTicks, to),
            })).flat();

        setData({
          ...responseData,
          series: seriesPoints,
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
