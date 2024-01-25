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

import {Logger} from '../core/logger/Logger';
import {addItemToArray, removeItemFromArray, sortArray} from './array-tools';


export  type QueueItem<InputType, OutputType> = {
	onCompleted?: (output: OutputType) => void
	onError?: (error: Error) => void
	item: InputType
}

export class QueueV2<ItemType, OutputType = any>
	extends Logger {

	private allowedParallelOperationsCount = 1;
	private runningOperationsCount = 0;
	private queue: Readonly<QueueItem<ItemType, OutputType>>[] = [];
	private onQueueEmpty?: () => void;
	private finalResolve?: (value?: unknown) => void;
	private readonly runner: (queueItem: ItemType) => Promise<OutputType>;
	private sorter?: (item: ItemType) => (string | number);
	private filter?: (item: Readonly<QueueItem<ItemType, OutputType>>[]) => (Readonly<QueueItem<ItemType, OutputType>>[]);

	constructor(name: string, runner: (queueItem: ItemType) => Promise<OutputType>) {
		super(name);
		this.runner = runner;
	}

	setParallelCount(parallelCount: number) {
		this.allowedParallelOperationsCount = parallelCount;
		return this;
	}

	setOnQueueEmpty(onQueueEmpty: () => void) {
		this.onQueueEmpty = onQueueEmpty;
		return this;
	}

	addItem(toExecute: ItemType, onCompleted?: (output: OutputType) => void, onError?: (error: Error) => void) {
		this.addItemImpl(toExecute, onCompleted, onError);
		this.execute();
		return this;
	}

	addItemImpl(item: ItemType, onCompleted?: (output: OutputType) => void, onError?: (error: Error) => void) {
		addItemToArray(this.queue, Object.freeze({onCompleted: onCompleted, onError: onError, item}));
		return this;
	}

	setSorter(sorter?: (item: ItemType) => string | number) {
		this.sorter = sorter;
		return this;
	}

	setFilter(filter?: (item: Readonly<QueueItem<ItemType, OutputType>>[]) => Readonly<QueueItem<ItemType, OutputType>>[]) {
		this.filter = filter;
		return this;
	}

	private ignore = () => {
	};

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
			const toExecute = this.queue[0];
			removeItemFromArray(this.queue, toExecute);

			this.runningOperationsCount++;
			new Promise<void>((resolve, reject) => {
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
	};

	async executeSync() {
		await new Promise(resolve => {
			this.finalResolve = resolve;
			this.execute();
		});
	}
}
