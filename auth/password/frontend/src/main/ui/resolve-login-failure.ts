import {formatTimestamp} from '@nu-art/ts-common';
import {ErrorType_LoginBlocked} from '@nu-art/password-auth-shared';
import {HttpException} from '@nu-art/http-client';

export const LoginFailureMessage_Credentials = 'Email or password incorrect';
export const LoginFailureMessage_Unavailable = 'Could not sign in — please try again';

export type LoginFailureUi = {
	errorMessages: string[];
	blockedUntil?: number;
};

type LoginErrorBody = {
	type?: string;
	data?: { blockedUntil?: number };
};

type ErrorEnvelope = {
	error?: LoginErrorBody;
	debugMessage?: unknown;
};

const readLoginErrorBody = (err: unknown): LoginErrorBody | undefined => {
	if (!(err instanceof HttpException))
		return undefined;

	const wrapped = err.errorResponse as ErrorEnvelope | undefined;
	if (wrapped?.error)
		return wrapped.error;

	const debug = wrapped?.debugMessage;
	if (debug && typeof debug === 'object' && debug !== null && 'error' in debug)
		return (debug as ErrorEnvelope).error;

	return undefined;
};

export const resolveLoginFailure = (err: unknown): LoginFailureUi => {
	const body = readLoginErrorBody(err);
	const blockedUntil = body?.type === ErrorType_LoginBlocked ? body.data?.blockedUntil : undefined;
	if (typeof blockedUntil === 'number')
		return {
			blockedUntil,
			errorMessages: [`Login blocked until ${formatTimestamp('DD/MM/YYYY HH:mm', blockedUntil)}`],
		};

	const status = err instanceof HttpException ? err.responseCode : undefined;
	if (status !== undefined && (status >= 500 || status === 0))
		return {errorMessages: [LoginFailureMessage_Unavailable]};

	return {errorMessages: [LoginFailureMessage_Credentials]};
};
