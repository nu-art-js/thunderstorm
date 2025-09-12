import {BaseCommando} from './core/BaseCommando.js';


export type LogTypes = 'out' | 'err';

export type CliBlock<Commando extends BaseCommando> = (cli: Commando) => void;
