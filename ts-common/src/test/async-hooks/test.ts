// import * as async_hooks from 'async_hooks';
// import {expect} from 'chai';
// import {timeout} from '../../main';
//
//
// class AsyncResource {
// 	private resources: Map<number, { type: string, triggerAsyncId: number }> = new Map();
// 	private asyncHook: async_hooks.AsyncHook;
//
// 	constructor() {
// 		this.asyncHook = async_hooks.createHook({
// 			init: this.init.bind(this),
// 			destroy: this.destroy.bind(this)
// 		});
// 	}
//
// 	init(asyncId: number, type: string, triggerAsyncId: number) {
// 		this.resources.set(asyncId, {type, triggerAsyncId});
// 	}
//
// 	destroy(asyncId: number) {
// 		this.resources.delete(asyncId);
// 	}
//
// 	enable() {
// 		this.asyncHook.enable();
// 	}
//
// 	disable() {
// 		this.asyncHook.disable();
// 	}
//
// 	getResource(asyncId: number) {
// 		return this.resources.get(asyncId);
// 	}
// }
//
// // Your tests
// describe('AsyncResource', () => {
// 	it('should track async operations correctly', async () => {
// 		return new Promise<void>((resolve) => {
// 			const asyncResource = new AsyncResource();
// 			asyncResource.enable();
//
//
// 			setTimeout(() => {
// 				// After the async operation, let's check if the resource has been correctly tracked.
// 				const resource = asyncResource.getResource(async_hooks.executionAsyncId());
// 				expect(resource).to.not.be.undefined;
// 				expect(resource?.type).to.equal('Timeout');
//
// 				asyncResource.disable();
// 				resolve();
// 			}, 100);
// 		});
// 	});
// });
