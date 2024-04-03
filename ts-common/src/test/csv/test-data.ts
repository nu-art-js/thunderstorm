type Obj = { a: number }

export type TestData = {
	id: string;
	name: string;
	innerObject: { a: number, b: string },
	innerArray: number[];
	arrayOfObjects: Obj[];
	optional?: string;
}

export type TestData_Parsed = {
	id: string;
	name: string;
	innerObject: string,
	innerArray: string;
	arrayOfObjects: string;
	optional?: string;
}

export const keysToStringify: (keyof TestData)[] = ['innerArray', 'innerObject', 'arrayOfObjects'];

export const testData: TestData[] = [
	{
		id: '0000',
		name: 'Adam',
		innerObject: {a: 10, b: 'Po'},
		innerArray: [],
		optional: 'asd',
		arrayOfObjects: [{a: 10}, {a: 20},]
	},
	{
		id: '1111',
		name: 'Matan',
		innerObject: {a: 20, b: 'Ze'},
		innerArray: [1],
		arrayOfObjects: [{a: 20}]
	},
	{
		id: '2222',
		name: 'Itay',
		innerObject: {a: 30, b: 'Zevel'},
		innerArray: [1, 2],
		arrayOfObjects: [],
	}
];