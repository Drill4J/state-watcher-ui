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

import { MemoryMetrics } from "types/state-watcher";
import { REFRESH_RATE } from "../constants";

export function fillGaps(from: number, to: number): MemoryMetrics[] {
  const length = Math.round((to - from) / REFRESH_RATE);

  const createEmptyPoints = (_: any, k: number) => {
    const step = REFRESH_RATE * k;

    if (k === 0) return { timeStamp: from, memory: { heap: 0 } };
    if (k === length - 1) return { timeStamp: to, memory: { heap: 0 } };

    return { timeStamp: from + step, memory: { heap: null } };
  };
  return Array.from({ length }, createEmptyPoints);
}
