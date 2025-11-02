import {Constructor} from '@nu-art/ts-common';
import {CommandoInteractive} from '../interactive/CommandoInteractive.js';
import {BaseCommando} from './BaseCommando.js';
import {Commando_Basic} from '../plugins/basic.js';
import {MergeTypes} from './class-merger.js';

const commandoPool: (CommandoInteractive & BaseCommando & Commando_Basic)[] = [];

export const CommandoPool = {
	allocateCommando: <T extends Constructor<any>[]>(uid: string, ...plugins: T): MergeTypes<[...T]> & CommandoInteractive & BaseCommando & Commando_Basic => {
		const commando = CommandoInteractive.create(...plugins, Commando_Basic) as unknown as MergeTypes<[...T]> & CommandoInteractive & BaseCommando & Commando_Basic;
		commando.setUID(uid);
		commandoPool.push(commando as unknown as CommandoInteractive & BaseCommando & Commando_Basic);
		return commando;
	},
	killAll: async () => {
		await Promise.all(commandoPool.map(c => c.kill()));
	}
};
