export type StreamTest_Type1 = {
	id: string;
	name: string;
}

export type StreamTest_Type2 = {
	id: string;
	name1: string;
}

export const StreamTest_Items: StreamTest_Type1[] = [
	{id: '0000', name: 'Adam'},
	{id: '1111', name: 'Matan'},
	{id: '2222', name: 'Itay'},
	{id: '3333', name: 'Yuval'},
	{id: '4444', name: 'Harel'}
];

export const StreamTest_ToTransformed = (data: any) => {
	const item = data as StreamTest_Type1;
	return {id: item.id, name1: item.name} as StreamTest_Type2;
};

export const StreamTest_FromTransformed = (data: any) => {
	const item = data as StreamTest_Type2;
	return {id: item.id, name: item.name1} as StreamTest_Type1;
};