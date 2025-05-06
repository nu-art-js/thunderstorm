import {BaseCommando} from '../main/shell/core/BaseCommando';
import {CommandoInteractive} from '../main/shell';
import {Commando_Basic} from '../main/shell/plugins/basic';

export * from '../main/shell';
export * from '../main/shell/plugins/basic';
export * from '../main/shell/plugins/git';
export * from '../main/shell/plugins/nvm';
export * from '../main/shell/core/BaseCommando';
export * from '../main/shell/core/CliError';
export * from '../main/shell/interactive/InteractiveShell';

export type SimpleTestCommando = BaseCommando & CommandoInteractive & Commando_Basic;
