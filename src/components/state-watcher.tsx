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
import { Checkbox, Icons, Stub } from "@drill4j/ui-kit";
import {
  CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart, ReferenceLine, ReferenceArea,
} from "recharts";
import tw, { styled } from "twin.macro";

import { formatBytes, lessThanTen, roundTimeStamp } from "utils";
import { useInstanceIds } from "hooks";
import { StateWatcherLineChart } from "types/state-watcher";
import { REFRESH_RATE } from "../constants";
import { StateWatcherTooltip } from "./state-watcher-tooltip";

interface Props {
  data: StateWatcherLineChart;
  instanceIds: string[];
  isActiveBuildVersion: boolean;
  height: number;
  windowMs: number;
}

export const StateWatcher = ({
  data, instanceIds, isActiveBuildVersion, height, windowMs,
}: Props) => {
  const [totalHeapLineIsVisible, setTotalHeapLineIsVisible] = useState(true);
  const { observableInstances, toggleInstanceActiveStatus } = useInstanceIds(instanceIds);
  const divisionsCount = 4;
  const yAxisStep = data.maxHeap / divisionsCount;
  const roundedYstep = yAxisStep + (1024 - (yAxisStep % 1024));
  const maxYAxisTick = roundedYstep * divisionsCount * 1.1;

  const start = roundTimeStamp() - windowMs;
  return isActiveBuildVersion ? (
    <>
      <div tw="flex justify-between py-6">
        <span tw="text-12 leading-16 text-monochrome-default font-bold uppercase">Memory usage</span>
      </div>
      <div tw="flex gap-x-6 pl-4">
        <div tw="w-full h-full">
          <ResponsiveContainer height={height} width="96%">
            <LineChart data={data.points}>
              <CartesianGrid strokeDasharray="line" strokeWidth={1} stroke="#E3E6E8" />
              {(data.hasRecord || data.isMonitoring) && (
                <XAxis
                  dataKey="timeStamp"
                  strokeWidth="1"
                  stroke="#1B191B"
                  shapeRendering="crispEdges"
                  interval={defineInterval(data.points.length)}
                  tick={({ x, y, payload }) => {
                    const date = new Date(payload.value);

                    const tick = `${lessThanTen(date.getHours())}:${lessThanTen(date.getMinutes())}:${lessThanTen(date.getSeconds())}`;
                    return (
                      <Tick x={x} y={y} dy={16} dx={-25}>{tick}</Tick>
                    );
                  }}
                />
              )}
              <YAxis
                domain={[0, maxYAxisTick]}
                ticks={[0, roundedYstep, roundedYstep * 2, roundedYstep * 3, maxYAxisTick]}
                tick={({ x, y, payload }) => (
                  <Tick
                    isLast={payload.value === maxYAxisTick}
                    x={x}
                    y={y}
                    dy={5}
                    dx={-56}
                  >
                    {formatBytes(payload.value)}
                  </Tick>
                )}
                strokeWidth={0}
              />
              {!data.hasRecord && !data.isMonitoring && (
                <ReferenceLine
                  y={yAxisStep * 2}
                  label={({ viewBox }) => (
                    <text
                      y="185"
                      textAnchor="middle"
                      fill="#A4ACB3"
                    >
                      <tspan fill="#A4ACB3" x={viewBox.width / 2}>Press &quot;Start Monitoring&quot; to begin</tspan>
                    </text>
                  )}
                  stroke="#F7D77C"
                  strokeWidth={0}
                />
              )}
              {totalHeapLineIsVisible && <ReferenceLine y={data.maxHeap} stroke="#F7D77C" strokeWidth={2} />}
              {/* below is a hack to match the design */}
              {totalHeapLineIsVisible && (
                <ReferenceLine
                  y={data.maxHeap - data.maxHeap / 128}
                  stroke="#F7D77C"
                  opacity="0.2"
                  strokeWidth={6}
                />
              )}
              {data?.breaks.map(({ from, to }) => (
                <ReferenceArea
                  key={`${from}-${to}`}
                  x1={from < start + REFRESH_RATE ? undefined : from}
                  x2={to}
                  fill="#E3E6E8"
                  label={PauseTooltip}
                  strokeOpacity={1}
                />
              ))}
              <Tooltip
                cursor={data.hasRecord}
                content={({ payload, label }) => (
                  <StateWatcherTooltip
                    payload={payload}
                    label={label}
                    maxHeap={data?.maxHeap}
                  />
                )}
              />
              {observableInstances.map(({ instanceId, color, isActive }) => (
                isActive && (
                  <Line
                    key={instanceId}
                    type="linear"
                    dataKey={instanceId}
                    stroke={color}
                    dot={false}
                    isAnimationActive={false}
                    strokeWidth={2}
                    name={instanceId}
                    connectNulls
                  />
                )
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div tw="space-y-1 pt-1 w-52">
          <label tw="flex gap-x-2" style={{ color: "#F7D77C" }}>
            <Checkbox
              checked={totalHeapLineIsVisible}
              onChange={() => setTotalHeapLineIsVisible(!totalHeapLineIsVisible)}
            />
            <Label tw="w-full flex justify-between">
              <span>Max Heap</span>
              <span>{formatBytes(data.maxHeap)}</span>
            </Label>
          </label>
          <span tw="text-10 leading-24 text-monochrome-default">Instances:</span>
          <ScrollContainer>
            {observableInstances.map(({ instanceId, color, isActive }) => (
              <label tw="flex gap-x-2" style={{ color }} key={instanceId}>
                <Checkbox onChange={() => toggleInstanceActiveStatus(instanceId)} checked={isActive} />
                <Label title={instanceId}>{instanceId}</Label>
              </label>
            ))}
          </ScrollContainer>
        </div>
      </div>
    </>
  ) : (
    <Stub
      icon={<Icons.Data width={120} height={120} />}
      title="No data available"
      message="Memory usage information can only be displayed for the last build"
    />
  );
};

const ScrollContainer = styled.div`
  height: calc(100% - 80px);
  ${tw`space-y-2 overflow-auto`};
    &::-webkit-scrollbar {
      ${tw`w-1 rounded bg-monochrome-light-tint`}
    };

    &::-webkit-scrollbar-thumb {
      ${tw`w-1 rounded bg-monochrome-medium-tint`}
    };
`;

interface TickProps {
  x: number;
  y: number;
  dx: number;
  dy: number;
  isLast?: boolean;
  children: React.ReactNode;
}

const Tick = ({
  x, y, dx, dy, isLast, children,
}: TickProps) => (
  <g>
    <text x={x + 42} y={isLast ? y - 8 : y} dy={dy} dx={dx} fill="#687481" tw="text-12 leading-16 text-right" textAnchor="end">
      {children}
    </text>
  </g>
);

const PauseTooltip = ({ viewBox }: any) => {
  const centeredX = viewBox.x + viewBox.width / 2;
  return (
    <g className="pause-tooltip invisible">
      <rect x={centeredX - 96} y="-34" width="188" height="28" fill="#1B191B" rx="4" ry="4" />
      <text x={centeredX - 76} y="-16" fill="#fff" tw="text-12 leading-16">
        The Monitoring was paused
      </text>
      <svg
        tw="text-monochrome-black h-2 w-full left-0"
        x={centeredX - 14}
        y="-10px"
      >
        <polygon tw="fill-current" points="0,0 13,13 26,0" />
      </svg>
    </g>
  );
};

const Label = styled.span`
  ${tw`text-12 leading-16 text-monochrome-default text-ellipsis`}
`;

function defineInterval(dataLength: number) {
  const desiredLabelCount = 24;
  if (dataLength < desiredLabelCount) return 0;
  return Math.ceil(dataLength / desiredLabelCount);
}
