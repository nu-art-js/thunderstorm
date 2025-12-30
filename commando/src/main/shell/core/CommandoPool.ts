import {Constructor} from '@nu-art/ts-common';
import {CommandoInteractive} from '../interactive/CommandoInteractive.js';
import {BaseCommando} from './BaseCommando.js';
import {Commando_Basic} from '../plugins/basic.js';
import {MergeTypes} from './class-merger.js';

/** Internal pool of allocated commando instances */
const commandoPool: (CommandoInteractive & BaseCommando & Commando_Basic)[] = [];

/**
 * Pool manager for Commando instances with lifecycle management.
 * 
 * Tracks all allocated Commando instances and provides a way to kill
 * all of them at once. Useful for cleanup in long-running processes
 * or test teardown.
 * 
 * **Behavior**:
 * - All allocated commandos are stored in an internal pool
 * - `allocateCommando()` always includes Commando_Basic plugin
 * - `killAll()` terminates all tracked commandos asynchronously
 * 
 * **Use Case**: Managing multiple interactive commandos that need
 * to be cleaned up together (e.g., test suites, long-running scripts).
 */
export const CommandoPool = {
	/**
	 * Allocates a new Commando instance and adds it to the pool.
	 * 
	 * Creates a CommandoInteractive instance with the provided plugins
	 * plus Commando_Basic (always included). The instance is tracked
	 * in the pool for later cleanup.
	 * 
	 * @template T - Array of plugin constructor types
	 * @param uid - Unique identifier for this commando instance
	 * @param plugins - Plugin classes to merge with the commando
	 * @returns Merged commando instance with all plugins
	 */
	allocateCommando: <T extends Constructor<any>[]>(uid: string, ...plugins: T): MergeTypes<[...T]> & CommandoInteractive & BaseCommando & Commando_Basic => {
		const commando = CommandoInteractive.create(...plugins, Commando_Basic) as unknown as MergeTypes<[...T]> & CommandoInteractive & BaseCommando & Commando_Basic;
		commando.setUID(uid);
		commandoPool.push(commando as unknown as CommandoInteractive & BaseCommando & Commando_Basic);
		return commando;
	},
	/**
	 * Kills all allocated commando instances.
	 * 
	 * Calls `kill()` on all commandos in the pool asynchronously.
	 * Useful for cleanup in test teardown or application shutdown.
	 */
	killAll: async () => {
		await Promise.all(commandoPool.map(c => c.kill()));
	}
};
