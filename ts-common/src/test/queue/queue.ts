import {filterDuplicates, generateArray, sleep} from '../../main/index.js';
import {QueueItem, QueueV2} from '../../main/utils/queue-v2.js';
import {TestModel, defaultTestProcessor, DefaultTestProcessor} from '@nu-art/testalot';

type Input<T = any> = {
	filter?: (number: Readonly<QueueItem<number, any>>[]) => Readonly<QueueItem<number, any>>[]
	sort?: (number: number) => number | string
	parallel?: number
	items: number[]
}

export type TestCase_Queue = TestModel<Input, any>;

const queueProcessor: DefaultTestProcessor<undefined, any> = async (promisedResult, expectedResult, error) => {
	// The test function returns undefined, so we just wait for it to complete
	await promisedResult;
	// No result validation needed for queue test
};

export const TestCases_Queue: TestCase_Queue[] = [
	// {
	// 	description: 'queue',
	// 	result: {},
	// 	input: {
	// 		items: [4, 1, 3, 2, 5],
	// 		parallel: 2,
	// 		sort: (item: number) => item,
	// 		filter: items => filterDuplicates(items, item => item.item)
	// 	}
	// },
	{
		description: 'queue',
		result: {},
		input: {
			items: generateArray(200, () => 0.5),
			parallel: 30,
		}
	},
];

export const testQueue = async (input: Input): Promise<undefined> => {
	const queue = new QueueV2<number>('queue', async (item) => {
		console.log(`Item: ${item} - Start`);
		await sleep(item * 1000);
		console.log(`Item: ${item} - End`);
	}).setParallelCount(input.parallel ?? 1)
	  .setSorter(input.sort)
	  .setFilter(input.filter);
	console.log('adding items');
	input.items.forEach(item => queue.addItemImpl(item));
	sleep(2000).then(() => {
		console.log('adding again');
		input.items.forEach(item => queue.addItemImpl(item));
	});
	console.log('------- Started');
	await queue.executeSync();
	console.log('------- Ended');
	return undefined;
};