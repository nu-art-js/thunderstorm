/*
 * A typescript & react boilerplate with api call example
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Stylable} from "@nu-art/thunderstorm/frontend";

const paddingGroup = "8px 0px 8px 0px"
const padding = "8px 8px 8px 8px"
const marginHorizontal = "0px 8px 0px 8px";
const marginVertical = "8px 0px 8px 0px";
const border = "1px solid #68678d50";

export const PlaygroundExample_HeaderStyle: Stylable = {style: {fontSize: 20, marginBottom: 8}}
export const PlaygroundExample_BodyStyle: Stylable = {className: "ll_v_c"}
export const PlaygroundExample_ResultStyle: Stylable = {style: {fontSize: 18, marginTop: 8}}
export const PlaygroundExample_GroupStyle: Stylable = {className: 'll_h_t match_width', style: {padding:paddingGroup, margin:marginVertical, justifyContent: "space-around", border}}
export const PlaygroundExample_ExampleStyle: Stylable = {style: {padding, margin: marginHorizontal, border}}
