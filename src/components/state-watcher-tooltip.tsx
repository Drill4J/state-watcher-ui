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
import { Icons } from "@drill4j/ui-kit";
import "twin.macro";

import { formatBytes, lessThanTen } from "utils";

interface Props {
  payload?: any[];
  label: string | number;
  maxHeap: number;
}

export const StateWatcherTooltip = ({ payload = [], label, maxHeap = 0 }: Props) => {
  const Label = ({ name, value = 0, color }: { name: string, value?: number, color: string}) => (
    <div tw="grid gap-x-2 grid-cols-[8px 110px 60px] items-center">
      <div tw="block rounded-full w-2 h-2" style={{ backgroundColor: color }} />
      <span style={{ maxWidth: "120px" }} tw="text-ellipsis">{name}</span>
      <span tw="grid font-bold place-items-end">{formatBytes(value)}</span>
    </div>
  );
  const date = new Date(label);
  return (
    Array.isArray(payload) ? (
      <div tw="relative mx-2 text-12 leading-16">
        <div tw="space-y-3 bg-monochrome-black text-monochrome-white rounded p-4">
          <div tw="flex flex-col gap-y-1">
            <Label name="Total memory" value={maxHeap} color="#F7D77C" />
            <span tw="text-10 leading-24 text-monochrome-medium-tint">Instances:</span>
            {payload.map(({ name, value, color }: any) => <Label name={name} value={value} color={color} />)}
          </div>
          <div tw="flex items-center gap-x-2 text-monochrome-dark-tint">
            <Icons.Clock />
            {`${date.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
            })} ${lessThanTen(date.getHours())}:${lessThanTen(date.getMinutes())}:${lessThanTen(date.getSeconds())}`}
          </div>
        </div>
      </div>
    ) : null
  );
};
