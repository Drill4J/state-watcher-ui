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
import { Breaks, Point } from "types";
import { REFRESH_RATE } from "../constants";

export const fillGaps = (breaks: Breaks): Point[] => breaks.map(({ from, to }) => {
  const length = (to - from) / REFRESH_RATE;
  const createEmptyPoints = (_: any, k: number) => {
    const step = REFRESH_RATE * k;

    if (k === 0) return { timeStamp: from, "1a6794f7-f4f6-4279-afe5-2a48c6489ae6": null };
    if (k === length - 1) return { timeStamp: to, "1a6794f7-f4f6-4279-afe5-2a48c6489ae6": null };

    return { timeStamp: from + step, "1a6794f7-f4f6-4279-afe5-2a48c6489ae6": null };
  };
  return Array.from({ length }, createEmptyPoints);
}).flat();

// if (length < 3) {
//   return [
//     { timeStamp: from, memory: { heap: null } },
//     { timeStamp: from + (to - from) / 2, memory: { heap: null } },
//     { timeStamp: to, memory: { heap: null } },
//   ];
// }
