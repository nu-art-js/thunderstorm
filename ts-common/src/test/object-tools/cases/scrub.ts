import {expect} from 'chai';
import {compare, scrub, ScrubConfig, TestSuite} from '../../_main';

type Input = {
	item: any
	config?: Partial<ScrubConfig>;
}

const simpleObject1 = {
	a: 'property A',
	b: true,
	c: 42,
};

const simpleObject2 = {
	d: 'property D',
	e: false,
	f: 360,
};

const compoundObject1 = {
	one: simpleObject1,
	two: simpleObject2,
	strArr: ['asd1', 'asd2'],
	objArr: [simpleObject1, simpleObject2],
};

const config_FullScrub: Partial<ScrubConfig> = {
	emptyObjects: true,
	emptyArrays: true,
	emptyStrings: true,
};

const TestCase_scrub: TestSuite<Input, any> ['testcases'] = [
	{
		description: 'Simple Object - No scrub',
		input: {
			item: simpleObject1,
			config: config_FullScrub
		},
		result: simpleObject1,
	},
	{
		description: 'Simple Object - Empty String',
		input: {
			item: {...simpleObject1, a: ''},
			config: config_FullScrub,
		},
		result: {
			b: true,
			c: 42,
		}
	},
	{
		description: 'Simple Object - Undefined Property',
		input: {
			item: {...simpleObject2, d: undefined},
			config: config_FullScrub,
		},
		result: {
			e: false,
			f: 360,
		}
	},
	{
		description: 'Simple Object - Null Property',
		input: {
			item: {...simpleObject2, d: null},
			config: config_FullScrub,
		},
		result: {
			e: false,
			f: 360,
		}
	},
	{
		description: 'Compound Object - No Scrub',
		input: {
			item: compoundObject1,
			config: config_FullScrub,
		},
		result: compoundObject1
	},
	{
		description: 'Compound Object - Undefined Property',
		input: {
			item: {...compoundObject1, three: undefined},
			config: config_FullScrub,
		},
		result: compoundObject1,
	},
	{
		description: 'Compound Object - Null Property',
		input: {
			item: {...compoundObject1, three: null},
			config: config_FullScrub,
		},
		result: compoundObject1,
	},
	{
		description: 'Compound Object - Inner prop with empty string',
		input: {
			item: {...compoundObject1, one: {...simpleObject1, a: ''}},
			config: config_FullScrub,
		},
		result: {
			one: {
				b: true,
				c: 42,
			},
			two: simpleObject2,
			strArr: ['asd1', 'asd2'],
			objArr: [simpleObject1, simpleObject2],
		}
	},
	{
		description: 'Compound Object - Empty string in string array',
		input: {
			item: {...compoundObject1, strArr: [...compoundObject1.strArr, '']},
			config: config_FullScrub,
		},
		result: compoundObject1
	},
	{
		description: 'Compound Object - Undefined in obj array',
		input: {
			item: {...compoundObject1, objArr: [...compoundObject1.objArr, undefined]},
			config: config_FullScrub,
		},
		result: compoundObject1
	},
	{
		description: 'Compound Object - Empty obj in obj array',
		input: {
			item: {...compoundObject1, objArr: [...compoundObject1.objArr, {}]},
			config: config_FullScrub,
		},
		result: compoundObject1
	},
	{
		description: 'Compound Object - Empty prop in object in obj array',
		input: {
			item: {...compoundObject1, objArr: [...compoundObject1.objArr, {a: ''}]},
			config: config_FullScrub,
		},
		result: compoundObject1
	},
	{
		description: 'Compound Object - Super Complex',
		input: {
			item: {
				'kaki': 'cf931ac531a50dfb8d18d84a9f632963',
				'zevel': false,
				'data': {
					'821648d51c7f1238aff85caff362f95b': {
						'0b51ea0f2bac437138757e09077f0d44': [
							{
								'kishkush': '821648d51c7f1238aff85caff362f95b',
								'balabush': {
									'91dd392b9f5155089d32b288be6f239f': [
										'ba40e19ea773738bae8352ee4be6e614'
									]
								}
							}
						]
					},
					'83ecf4334cdbfb320025e06a336a5461': {},
				}
			},
			config: config_FullScrub,
		},
		result: {
			'kaki': 'cf931ac531a50dfb8d18d84a9f632963',
			'zevel': false,
			'data': {
				'821648d51c7f1238aff85caff362f95b': {
					'0b51ea0f2bac437138757e09077f0d44': [
						{
							'kishkush': '821648d51c7f1238aff85caff362f95b',
							'balabush': {
								'91dd392b9f5155089d32b288be6f239f': [
									'ba40e19ea773738bae8352ee4be6e614'
								]
							}
						}
					]
				},
			}
		},
	},
];

export const TestSuite_scrub: TestSuite<Input, any> = {
	label: 'scrub',
	testcases: TestCase_scrub,
	processor: async (testCase) => {
		const scrubbed = scrub(testCase.input.item, testCase.input.config);
		const result = compare(scrubbed, testCase.result);
		if (!result) {
			console.log(`########## Faild test - ${testCase.description} ##########`);
			console.log('Expected:', testCase.result);
			console.log('Got:', scrubbed);
		}
		expect(result).to.deep.equals(true);
	}
};