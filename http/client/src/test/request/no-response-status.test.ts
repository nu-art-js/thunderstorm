/*
 * @nu-art/http-client - A dropped socket is not a server 500
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {HttpStatus_NoResponse, httpStatusFromTransportError} from '../../main/core/no-response-status.js';

describe('httpStatusFromTransportError', () => {
	it('uses 496 when the socket drops and keeps a real 500', () => {
		expect(httpStatusFromTransportError(undefined)).to.equal(496);
		expect(HttpStatus_NoResponse).to.equal(496);
		expect(httpStatusFromTransportError(500)).to.equal(500);
	});
});
