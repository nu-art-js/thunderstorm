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
