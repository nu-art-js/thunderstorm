import {BaseCommando} from '../main/shell/core/BaseCommando.js';
import {CommandoInteractive} from '../main/shell/index.js';
import {Commando_Basic} from '../main/shell/plugins/basic.js';

export * from '../main/shell/index.js';
export * from '../main/shell/plugins/basic.js';
export * from '../main/shell/plugins/git.js';
export * from '../main/shell/plugins/nvm.js';
export * from '../main/shell/core/BaseCommando.js';
export * from '../main/shell/core/CliError.js';
export * from '../main/shell/interactive/InteractiveShell.js';

export type SimpleTestCommando = BaseCommando & CommandoInteractive & Commando_Basic;
