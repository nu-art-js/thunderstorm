export type TestModel_Compare = {
	description: string
	answer: boolean,
	input: { one: any, two: any },
}

export type TestSuitV2 = {
	testcases: TestModel_Compare[]
	label: string,
}


export type TestModel_merge = {
	description: string
	answer: any
	input: {one: any, two: any},
}

export type TestSuitV3 = {
	testcases: TestModel_merge[]
	label: string,
}


