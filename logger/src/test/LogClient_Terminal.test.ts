/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {LogClient_Terminal, LogLevel, NoColor, BeLogged, Logger} from '../main/index.js';
import {createTestBuffer, getBufferContent} from './helpers.js';
import {expect} from 'chai';

describe('LogClient_Terminal - Color Codes', () => {
	it('should return ANSI color codes for each level', () => {
		expect(LogClient_Terminal.getColor(LogLevel.Verbose)).to.include('\x1b[90m');
		expect(LogClient_Terminal.getColor(LogLevel.Debug)).to.include('\x1b[34m');
		expect(LogClient_Terminal.getColor(LogLevel.Info)).to.include('\x1b[32m');
		expect(LogClient_Terminal.getColor(LogLevel.Warning)).to.include('\x1b[33m');
		expect(LogClient_Terminal.getColor(LogLevel.Error)).to.include('\x1b[31m');
	});

	it('should add bold code when bold is true', () => {
		const color = LogClient_Terminal.getColor(LogLevel.Info, true);
		expect(color).to.include('\x1b[1m');
	});

	it('should have NoColor constant', () => {
		expect(NoColor).to.equal('\x1b[0m');
	});
});

describe('LogClient_Terminal - Logging', () => {
	it('should output logs with color codes', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		BeLogged.addClient(LogClient_Terminal);
		
		const logger = new Logger('TestLogger');
		logger.logInfo('test message');
		
		// Terminal client should add color codes
		// We can't easily test console output, but we can verify it doesn't throw
		expect(buffer.buffers[0]).to.include('test message');
		
		BeLogged.removeClient(buffer);
		BeLogged.removeClient(LogClient_Terminal);
	});

	it('should handle natural colors setting', () => {
		LogClient_Terminal.keepLogsNaturalColors(true);
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		BeLogged.addClient(LogClient_Terminal);
		
		const logger = new Logger('TestLogger');
		logger.logInfo('test');
		
		// Should not throw
		expect(buffer.buffers[0]).to.be.a('string');
		
		LogClient_Terminal.keepLogsNaturalColors(false);
		BeLogged.removeClient(buffer);
		BeLogged.removeClient(LogClient_Terminal);
	});
});
