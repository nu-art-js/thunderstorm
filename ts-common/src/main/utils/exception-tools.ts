import {
	AssertionException,
	BadImplementationException,
	DontCallThisException,
	Exception,
	ImplementationMissingException,
	isErrorOfType,
	MUSTNeverHappenException,
	NotImplementedYetException,
	ThisShouldNotHappenException,
	WhoCallThisException
} from '../core/exceptions/exceptions';


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
