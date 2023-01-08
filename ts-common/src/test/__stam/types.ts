export type TestModel_Compare = {
	description: string
	answer: boolean,
	input: { one: any, two: any },
}

export type TestSuitV2 = {
	testcases: TestModel_Compare[]
	label: string,
}