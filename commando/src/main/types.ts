/*
 * commando provides shell command execution framework with interactive sessions and plugin system
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

import {BaseCommando} from './core/BaseCommando.js';

/**
 * Log output types for shell commands.
 *
 * - `'out'`: Standard output (stdout)
 * - `'err'`: Standard error (stderr)
 */
export type LogTypes = 'out' | 'err';

/**
 * Function type for command blocks that operate on a Commando instance.
 *
 * Used for composing command sequences where a function receives
 * a Commando instance and builds commands on it.
 *
 * @template Commando - Commando type (must extend BaseCommando)
 */
export type CliBlock<Commando extends BaseCommando> = (cli: Commando) => void;
