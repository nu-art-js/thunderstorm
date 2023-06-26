import {TS_Object} from '../../utils/types';

export type ErrorBody<E extends TS_Object | void = void> = {
	type: string
	body: E
};

export type  ErrorResponse<E extends TS_Object | void = void> = {
	debugMessage?: string
	error?: ErrorBody<E>
}