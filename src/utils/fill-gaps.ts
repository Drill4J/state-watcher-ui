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
import { RESOLUTION } from "../constants";

export const fillGaps = (breaks: Breaks): Point[] => breaks.map(({ from, to }) => {
  const length = (to - from) / RESOLUTION;
  const createEmptyPoints = (_: any, k: number) => {
    const step = RESOLUTION * k;

    if (k === 0) return { timeStamp: from };
    if (k === length - 1) return { timeStamp: to };

    return { timeStamp: from + step };
  };
  return Array.from({ length }, createEmptyPoints);
}).flat();
