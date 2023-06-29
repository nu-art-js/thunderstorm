import {Logger} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';


export type ActionProcessor = (logger: Logger, mem: MemStorage, data?: any) => Promise<void>;

export type ActionDeclaration = {
	key: string;
	processor: ActionProcessor;
	description: string;
	group: string;
}