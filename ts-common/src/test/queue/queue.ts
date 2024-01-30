import {TestSuite} from '../../main/testing/types';
import {debounce, filterDuplicates, sleep} from '../../main';
import {QueueItem, QueueV2} from '../../main/utils/queue-v2';


type Input<T = any> = {
	filter?: (number: Readonly<QueueItem<number, any>>[]) => Readonly<QueueItem<number, any>>[]
	sort?: (number: number) => number | string
	parallel?: number
	items: number[]
}

const TestCases_Queue: TestSuite<Input, any> ['testcases'] = [
	{
		description: 'queue',
		result: {},
		input: {
			items: [4, 1, 3, 2, 5],
			parallel: 2,
			sort: (item: number) => item,
			filter: items => filterDuplicates(items, item => item.item)
		}
	},
];

export const TestSuite_Queue: TestSuite<Input, any> = {
	timeout: 100000,
	label: 'debounce',
	testcases: TestCases_Queue,
	processor: async (testCase) => {
		const queue = new QueueV2<number>(testCase.description, async (item) => {
			console.log(`Item: ${item} - Start`);
			await sleep(item * 1000);
			console.log(`Item: ${item} - End`);
		}).setParallelCount(testCase.input.parallel ?? 1)
			.setSorter(testCase.input.sort)
			.setFilter(testCase.input.filter);
		console.log('adding items');
		testCase.input.items.forEach(item => queue.addItemImpl(item));
		sleep(2000).then(() => {
			console.log('adding again');
			testCase.input.items.forEach(item => queue.addItemImpl(item));
		});
		await queue.executeSync();
	}
};