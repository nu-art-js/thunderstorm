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
import {addItemToArray, removeItemFromArray, sortArray} from './array-tools.js';


/**
 * Structure for queue items with callbacks.
 */
export  type QueueItem<InputType, OutputType> = {
	/** Optional callback for successful completion */
	onCompleted?: (output: OutputType) => void
	/** Optional callback for errors */
	onError?: (error: Error) => void
	/** The item to process */
	item: InputType
}

/**
 * Enhanced queue implementation with sorting, filtering, and cancellation support.
 *
 * Similar to `Queue` but with additional features:
 * - Generic item/runner pattern (separates data from execution logic)
 * - Sorting support (process items in a specific order)
 * - Filtering support (modify queue before execution)
 * - Cancellation support (stop processing)
 * - Items are frozen (immutable) to prevent mutation
 *
 * @template ItemType - Type of items in the queue
 * @template OutputType - Type returned by the runner function
 */
export class QueueV2<ItemType, OutputType = any>
	extends Logger {

	/** Maximum number of operations that can run in parallel */
	private allowedParallelOperationsCount = 1;
	/** Current number of operations currently executing */
	private runningOperationsCount = 0;
	/** Flag indicating if processing should be cancelled */
	private cancelled: boolean = false;
	/** Queue of pending items (frozen to prevent mutation) */
	private queue: Readonly<QueueItem<ItemType, OutputType>>[] = [];
	/** Optional callback invoked when queue becomes empty */
	private onQueueEmpty?: () => void;
	/** Promise resolver for executeSync() */
	private finalResolve?: (value?: unknown) => void;
	/** Function that processes each queue item */
	private readonly runner: (queueItem: ItemType) => Promise<OutputType>;
	/** Optional function to sort items before processing */
	private sorter?: (item: ItemType) => (string | number);
	/** Optional function to filter items before processing */
	private filter?: (item: Readonly<QueueItem<ItemType, OutputType>>[]) => (Readonly<QueueItem<ItemType, OutputType>>[]);

	/**
	 * Creates a new QueueV2 instance.
	 *
	 * @param name - Logger tag name
	 * @param runner - Function that processes each queue item
	 */
	constructor(name: string, runner: (queueItem: ItemType) => Promise<OutputType>) {
		super(name);
		this.runner = runner;
	}

	/**
	 * Gets the current queue length.
	 */
	getLength = () => this.queue.length;

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
	 * Adds an item to the queue and starts execution.
	 *
	 * @param toExecute - Item to process
	 * @param onCompleted - Optional callback for successful completion
	 * @param onError - Optional callback for errors
	 * @returns This instance for method chaining
	 */
	addItem(toExecute: ItemType, onCompleted?: (output: OutputType) => void, onError?: (error: Error) => void) {
		this.addItemImpl(toExecute, onCompleted, onError);
		this.execute();
		return this;
	}

	/**
	 * Adds an item to the queue without triggering execution.
	 *
	 * The item is frozen (Object.freeze) to prevent mutation.
	 *
	 * @param item - Item to add
	 * @param onCompleted - Optional callback for successful completion
	 * @param onError - Optional callback for errors
	 * @returns This instance for method chaining
	 */
	addItemImpl(item: ItemType, onCompleted?: (output: OutputType) => void, onError?: (error: Error) => void) {
		addItemToArray(this.queue, Object.freeze({onCompleted: onCompleted, onError: onError, item}));
		return this;
	}

	/**
	 * Sets a sorting function for queue items.
	 *
	 * Items are sorted before processing. The sorter function should return
	 * a string or number that will be used for comparison.
	 *
	 * @param sorter - Function that returns a sort key for each item
	 * @returns This instance for method chaining
	 */
	setSorter(sorter?: (item: ItemType) => string | number) {
		this.sorter = sorter;
		return this;
	}

	/**
	 * Sets a filter function for queue items.
	 *
	 * The filter is applied before sorting and execution. Can be used to
	 * remove items, reorder them, or modify the queue dynamically.
	 *
	 * @param filter - Function that filters/modifies the queue array
	 * @returns This instance for method chaining
	 */
	setFilter(filter?: (item: Readonly<QueueItem<ItemType, OutputType>>[]) => Readonly<QueueItem<ItemType, OutputType>>[]) {
		this.filter = filter;
		return this;
	}

	/**
	 * Handles promise rejection and resets cancellation flag.
	 */
	private ignore = () => {
		this.cancelled = false;
	};

	/**
	 * Executes queued operations with sorting, filtering, and cancellation support.
	 *
	 * **Execution flow**:
	 * 1. Checks if queue is empty → invokes callbacks
	 * 2. Applies filter (if set) to modify queue
	 * 3. Applies sorter (if set) to order items
	 * 4. Processes items up to parallel limit
	 * 5. Each completion triggers `execute()` again (recursive pattern)
	 *
	 * **Cancellation**: If `cancelAll()` was called, stops processing new items
	 * but allows currently running items to complete.
	 */
	execute = () => {
		if (this.queue.length === 0 && this.runningOperationsCount === 0) {
			this.onQueueEmpty?.();
			return this.finalResolve?.();
		}

		if (this.filter)
			this.queue = this.filter(this.queue);

		const sorter = this.sorter;
		if (sorter)
			this.queue = sortArray(this.queue, (queueItem) => sorter(queueItem.item));

		for (let i = 0; this.runningOperationsCount < this.allowedParallelOperationsCount && i < this.queue.length; i++) {
			if (this.cancelled) {
				this.cancelled = false;
				return;
			}
			const toExecute = this.queue[0];
			removeItemFromArray(this.queue, toExecute);

			this.runningOperationsCount++;
			new Promise<void>((resolve, reject) => {
				if (this.cancelled) {
					this.cancelled = false;
					this.runningOperationsCount = 0;
					return;
				}

				this.runner(toExecute.item).then(output => {
					toExecute.onCompleted?.(output);
					this.runningOperationsCount--;
					resolve(); // Recursively call execute to process next item
				}).catch(e => {
					try {
						toExecute.onError?.(e);
					} catch (e1: any) {
						this.logError('Error while calling onError');
						this.logError('--- Original: ', e);
						this.logError('-- Secondary: ', e1);
						reject(e);
					} finally {
						this.runningOperationsCount--;
						resolve(); // Recursively call execute to process next item
					}
				});
			}).then(this.execute)
				.catch(this.ignore);
		}
		if (this.cancelled)
			this.cancelled = false;
	};

	/**
	 * Executes all queued operations and waits for completion.
	 *
	 * @returns Promise that resolves when queue is empty
	 */
	async executeSync() {
		await new Promise(resolve => {
			this.finalResolve = resolve;
			this.execute();
		});
	}

	/**
	 * Cancels all pending operations and clears the queue.
	 *
	 * Sets a cancellation flag that prevents new items from starting.
	 * Currently running operations are allowed to complete. The queue
	 * is cleared immediately.
	 */
	public cancelAll = () => {
		if (this.runningOperationsCount > 0)
			this.cancelled = true;
		this.queue = [];
	};
}
