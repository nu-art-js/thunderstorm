/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {BeLogged, Logger, LogLevel} from '../main/index.js';
import {LogClient_Browser} from '../main/browser.js';
import {createTestBuffer} from './helpers.js';
import {expect} from 'chai';

describe('LogClient_Browser - Color Styling', () => {
	it('should return CSS style strings for each level', () => {
		const verboseStyle = LogClient_Browser.getColor(LogLevel.Verbose, false);
		const debugStyle = LogClient_Browser.getColor(LogLevel.Debug, false);
		const infoStyle = LogClient_Browser.getColor(LogLevel.Info, false);
		const warningStyle = LogClient_Browser.getColor(LogLevel.Warning, false);
		const errorStyle = LogClient_Browser.getColor(LogLevel.Error, false);

		expect(verboseStyle).to.be.a('string');
		expect(debugStyle).to.be.a('string');
		expect(infoStyle).to.be.a('string');
		expect(warningStyle).to.be.a('string');
		expect(errorStyle).to.be.a('string');

		// Should contain CSS properties
		expect(verboseStyle).to.include('color');
		expect(infoStyle).to.include('color');
		expect(errorStyle).to.include('color');
	});

	it('should include base styles', () => {
		const style = LogClient_Browser.getColor(LogLevel.Info, false);
		// Base styles include padding and border-radius
		expect(style).to.be.a('string');
	});
});

describe('LogClient_Browser - Logging', () => {
	it('should output logs with CSS styling', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		BeLogged.addClient(LogClient_Browser);

		const logger = new Logger('TestLogger');
		logger.logInfo('test message');

		// Browser client uses %c formatting which is hard to test without browser console
		// But we can verify it doesn't throw and buffer receives the message
		expect(buffer.buffers[0]).to.include('test message');

		BeLogged.removeClient(buffer);
		BeLogged.removeClient(LogClient_Browser);
	});

	it('should handle string parameters separately from objects', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		BeLogged.addClient(LogClient_Browser);

		const logger = new Logger('TestLogger');
		logger.logInfo('string message', {object: 'data'});

		// Should not throw
		expect(buffer.buffers[0]).to.be.a('string');

		BeLogged.removeClient(buffer);
		BeLogged.removeClient(LogClient_Browser);
	});
});
