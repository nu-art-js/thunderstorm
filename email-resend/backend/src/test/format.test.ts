/*
 * @nu-art/email-resend-backend - Transactional email through Resend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import type {EmailAddress} from '../main/types.js';
import {formatResendAddress} from '../main/format.js';

type TestCase = TestModel<EmailAddress, string>;
const run = (testCase: TestCase) => () => runSingleTestCase(async (input: EmailAddress) => formatResendAddress(input), testCase);

describe('email-resend - formatResendAddress', () => {
	it('keeps a bare address', run({input: {email: 'guest@example.com'}, result: 'guest@example.com'}));
	it('quotes a display name', run({input: {email: 'noreply@example.com', name: 'Calendar Booking'}, result: '"Calendar Booking" <noreply@example.com>'}));
	it('escapes quotes and backslashes in the name', run({input: {email: 'a@b.c', name: 'A "B" \\ C'}, result: '"A \\"B\\" \\\\ C" <a@b.c>'}));
	it('removes line breaks from name and address', run({input: {email: 'a@b.c\r\nBcc: x@y.z', name: 'Evil\r\nBcc: x@y.z'}, result: '"Evil  Bcc: x@y.z" <a@b.cBcc: x@y.z>'}));
	it('treats a blank name as absent', run({input: {email: 'a@b.c', name: '  '}, result: 'a@b.c'}));
});
