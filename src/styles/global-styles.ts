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
import { createGlobalStyle } from "styled-components";
import tw from "twin.macro";

export const GlobalStyle = createGlobalStyle`
  svg[class="recharts-surface"] {
    ${tw`overflow-visible`};

    g[class="recharts-layer recharts-cartesian-axis recharts-xAxis xAxis"] {
      g {
        g {
          line {
            ${tw`invisible`}
          }
        }
      }
    }

    path[class="recharts-rectangle recharts-reference-area-rect"]:hover + .pause-tooltip {
      ${tw`visible`}
    }
  }
`;
