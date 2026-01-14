import {BaseCommando} from '../main/core/BaseCommando.js';
import {CommandoInteractive} from '../main/index.js';
import {Commando_Basic} from '../main/plugins/basic.js';

export * from '../main/index.js';
export * from '../main/plugins/basic.js';
export * from '../main/plugins/git.js';
export * from '../main/plugins/nvm.js';
export * from '../main/core/BaseCommando.js';
export * from '../main/core/CliError.js';
export * from '../main/interactive/InteractiveShell.js';

export type SimpleTestCommando = BaseCommando & CommandoInteractive & Commando_Basic;
