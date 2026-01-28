/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * Stub for HttpClient.createRequest used by ApiCaller unit tests.
 */

export type RequestRecorder = {
	setUrlParamsCalled: boolean;
	setBodyAsJsonCalled: boolean;
	params: unknown;
	body: unknown;
};

export function createRequestStub<R = unknown>(response: R) {
	const recorder: RequestRecorder = {
		setUrlParamsCalled: false,
		setBodyAsJsonCalled: false,
		params: undefined,
		body: undefined
	};
	const request = {
		setUrlParams: (p: unknown) => {
			recorder.setUrlParamsCalled = true;
			recorder.params = p;
			return request;
		},
		setBodyAsJson: (b: unknown) => {
			recorder.setBodyAsJsonCalled = true;
			recorder.body = b;
			return request;
		},
		execute: () => Promise.resolve(response),
		getRawResponse: () => ({data: response, status: 200, statusText: 'OK', headers: {}, config: {}})
	};
	return {request, recorder};
}
