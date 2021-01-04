/*
 * A typescript & react boilerplate with api call example
 *
 * Copyright (C) 2020 Intuition Robotics
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

import * as emotion from 'emotion';

export const _margin = (px: number) => emotion.css`margin: ${px}px;`;
export const _marginTop = (px: number) => emotion.css`margin-top: ${px}px;`;
export const _marginBottom = (px: number) => emotion.css`margin-bottom: ${px}px;`;
export const _marginLeft = (px: number) => emotion.css`margin-left: ${px}px;`;
export const _marginRight = (px: number) => emotion.css`margin-right: ${px}px;`;
export const _padding = (px: number) => emotion.css`padding: ${px}px;`;
export const _paddingLeft = (px: number) => emotion.css`padding-left: ${px}px;`;
export const _paddingRight = (px: number) => emotion.css`padding-right: ${px}px;`;
export const _paddingTop = (px: number) => emotion.css`padding-top: ${px}px;`;
export const _paddingBottom = (px: number) => emotion.css`padding-bottom: ${px}px;`;
export const _backgroundColor = (color: string) => emotion.css`background-color: ${color};`;
