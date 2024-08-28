import {Logger, ResolvableContent} from '@thunder-storm/common';


export type ActionProcessor = (logger: Logger, data?: any) => Promise<void>;

export type ActionDeclaration = {
	label?: string;
	visible?: ResolvableContent<boolean>
	key: string;
	processor: ActionProcessor;
	description: string;
	group: string;
}