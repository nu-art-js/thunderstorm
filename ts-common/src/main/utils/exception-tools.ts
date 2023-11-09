import {
	ApiException,
	AssertionException,
	BadImplementationException, DontCallThisException,
	Exception,
	ImplementationMissingException, isErrorOfType,
	MUSTNeverHappenException,
	NotImplementedYetException, ThisShouldNotHappenException, WhoCallThisException
} from '../core/exceptions/exceptions';
import {ApiError_GeneralErrorMessage} from '../core/exceptions/types';


const allExceptions = [
	Exception,
	BadImplementationException,
	ImplementationMissingException,
	MUSTNeverHappenException,
	NotImplementedYetException,
	ThisShouldNotHappenException,
	DontCallThisException,
	WhoCallThisException,
	AssertionException,
];

export function isCustomException(e: Error) {
	return allExceptions.some(exc => !!isErrorOfType(e, exc));
}

export function BadRequest(userMessage: string, debugMessage: string = userMessage, cause?: Error) {
	return new ApiException<ApiError_GeneralErrorMessage>(400, debugMessage, cause).setErrorBody({
		type: 'error-message',
		data: {message: userMessage}
	});
}