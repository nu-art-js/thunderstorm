/*
 * ts-common is the basic building blocks of our typescript projects
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

import {Logger} from '../core/logger/index.js';
import {addItemToArray, removeItemFromArray} from './array-tools.js';


/**
 * Queue for executing async operations with concurrency control.
 * 
 * Manages a queue of async operations and executes them with a configurable
 * level of parallelism. Operations are executed in FIFO order, with up to
 * `allowedParallelOperationsCount` running simultaneously.
 * 
 * **Features**:
 * - Concurrency control (limit parallel operations)
 * - Callbacks for completion and errors
 * - Queue empty callback
 * - Synchronous execution mode (`executeSync()`)
 * 
 * **Note**: Errors in `onError` callbacks are caught and logged but don't stop execution.
 */
export class Queue
	extends Logger {

	/** Maximum number of operations that can run in parallel */
	private allowedParallelOperationsCount = 1;
	/** Current number of operations currently executing */
	private runningOperationsCount = 0;
	/** Queue of pending operations (wrapped as promise resolvers) */
	private queue: (() => Promise<void>)[] = [];
	/** Optional callback invoked when queue becomes empty */
	private onQueueEmpty?: () => void;
	/** Promise resolver for executeSync() */
	private finalResolve?: (value?: unknown) => void;

	constructor(name: string) {
		super(name);
	}

	/**
	 * Sets the maximum number of parallel operations.
	 * 
	 * @param parallelCount - Maximum parallel operations (default: 1)
	 * @returns This instance for method chaining
	 */
	setParallelCount(parallelCount: number) {
		this.allowedParallelOperationsCount = parallelCount;
		return this;
	}

	/**
	 * Sets a callback to be invoked when the queue becomes empty.
	 * 
	 * @param onQueueEmpty - Function to call when queue is empty
	 * @returns This instance for method chaining
	 */
	setOnQueueEmpty(onQueueEmpty: () => void) {
		this.onQueueEmpty = onQueueEmpty;
		return this;
	}

	/**
	 * Adds an operation to the queue and starts execution.
	 * 
	 * Binds callbacks to `this` context and immediately triggers execution.
	 * 
	 * @param toExecute - Async function to execute
	 * @param onCompleted - Optional callback for successful completion
	 * @param onError - Optional callback for errors
	 */
	addItem<T>(toExecute: () => Promise<T>, onCompleted?: (output: T) => void, onError?: (error: Error) => void) {
		this.addItemImpl(toExecute.bind(this), onCompleted?.bind(this), onError?.bind(this));

		this.execute();
	}

	/**
	 * Internal method to add an operation to the queue.
	 * 
	 * Wraps the operation in a promise resolver that handles execution,
	 * completion callbacks, error handling, and queue continuation.
	 * 
	 * @param toExecute - Async function to execute
	 * @param onCompleted - Optional callback for successful completion
	 * @param onError - Optional callback for errors
	 */
	addItemImpl<T>(toExecute: () => Promise<T>, onCompleted?: (output: T) => void, onError?: (error: Error) => void) {
		addItemToArray(this.queue, async (resolve: () => void) => {
			this.runningOperationsCount++;
			try {
				const output: T = await toExecute();
				onCompleted && onCompleted(output);
			} catch (e: any) {
				try {
					onError && onError(e);
				} catch (e1: any) {
					this.logError('Error while calling onError');
					this.logError('--- Original: ', e);
					this.logError('-- Secondary: ', e1);
				}
			}
			this.runningOperationsCount--;
			resolve();
			this.execute();
		});
	}

	/** Empty function used as promise handler (ignores results) */
	ignore = () => {
	};

	/**
	 * Executes queued operations up to the parallel limit.
	 * 
	 * Processes the queue by:
	 * 1. Checking if queue is empty and all operations completed → invokes callbacks
	 * 2. Starting new operations up to the parallel limit
	 * 3. Each operation, when complete, calls `execute()` again to process more
	 * 
	 * This creates a recursive execution pattern where operations trigger
	 * the next batch when they complete.
	 */
	execute() {
		if (this.queue.length === 0 && this.runningOperationsCount === 0) {
			this.onQueueEmpty && this.onQueueEmpty();
			return this.finalResolve?.();
		}

		for (let i = 0; this.runningOperationsCount < this.allowedParallelOperationsCount && i < this.queue.length; i++) {
			const toExecute = this.queue[0];
			removeItemFromArray(this.queue, toExecute);
			new Promise(toExecute.bind(this))
				.then(this.ignore)
				.catch(this.ignore);
		}
	}

	/**
	 * Executes all queued operations and waits for completion.
	 * 
	 * Returns a Promise that resolves when the queue is empty and all
	 * operations have completed.
	 * 
	 * @returns Promise that resolves when queue is empty
	 */
	async executeSync() {
		await new Promise(resolve => {
			this.finalResolve = resolve;
			this.execute();
		});
	}
}
