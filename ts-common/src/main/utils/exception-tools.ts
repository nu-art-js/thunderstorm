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
} from '../core/exceptions/exceptions.js';


/**
 * List of all custom exception types in the nu-art exception hierarchy.
 */
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

/**
 * Checks if an error is a custom exception from the nu-art exception hierarchy.
 * 
 * Tests the error against all known custom exception types to determine if it's
 * a framework exception rather than a standard JavaScript Error.
 * 
 * @param e - Error to check
 * @returns true if the error is a custom exception, false otherwise
 */
export function isCustomException(e: Error) {
	return allExceptions.some(exc => !!isErrorOfType(e, exc));
}
