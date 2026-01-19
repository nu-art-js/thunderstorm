/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {BeLogged, LogClient_Function, Logger} from '../main/index.js';
import {createTestBuffer} from './helpers.js';
import {expect} from 'chai';

describe('LogClient_Function - Type Handling', () => {
	it('should handle string parameters', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		BeLogged.addClient(LogClient_Function);
		
		const logger = new Logger('TestLogger');
		logger.logInfo('string message');
		
		expect(buffer.buffers[0]).to.include('string message');
		
		BeLogged.removeClient(buffer);
		BeLogged.removeClient(LogClient_Function);
	});

	it('should handle number parameters', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		BeLogged.addClient(LogClient_Function);
		
		const logger = new Logger('TestLogger');
		logger.logInfo(42);
		
		expect(buffer.buffers[0]).to.include('42');
		
		BeLogged.removeClient(buffer);
		BeLogged.removeClient(LogClient_Function);
	});

	it('should handle boolean parameters', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		BeLogged.addClient(LogClient_Function);
		
		const logger = new Logger('TestLogger');
		logger.logInfo(true, false);
		
		expect(buffer.buffers[0]).to.include('true');
		expect(buffer.buffers[0]).to.include('false');
		
		BeLogged.removeClient(buffer);
		BeLogged.removeClient(LogClient_Function);
	});

	it('should handle object parameters', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		BeLogged.addClient(LogClient_Function);
		
		const logger = new Logger('TestLogger');
		logger.logInfo({ key: 'value' });
		
		expect(buffer.buffers[0]).to.include('key');
		expect(buffer.buffers[0]).to.include('value');
		
		BeLogged.removeClient(buffer);
		BeLogged.removeClient(LogClient_Function);
	});

	it('should handle Error objects with stack traces', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		BeLogged.addClient(LogClient_Function);
		
		const error = new Error('Test error');
		error.stack = 'Error: Test error\n    at test.js:1:1';
		
		const logger = new Logger('TestLogger');
		logger.logError(error);
		
		expect(buffer.buffers[0]).to.include('Test error');
		
		BeLogged.removeClient(buffer);
		BeLogged.removeClient(LogClient_Function);
	});

	it('should handle undefined, function, symbol, bigint', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		BeLogged.addClient(LogClient_Function);
		
		const logger = new Logger('TestLogger');
		logger.logInfo(undefined);
		logger.logInfo(() => {});
		logger.logInfo(Symbol('test'));
		logger.logInfo(BigInt(123));
		
		// Should not throw and should log type names
		expect(buffer.buffers[0]).to.be.a('string');
		
		BeLogged.removeClient(buffer);
		BeLogged.removeClient(LogClient_Function);
	});
});

describe('LogClient_Function - Prefix Format', () => {
	it('should use simplified prefix format', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		BeLogged.addClient(LogClient_Function);
		
		const logger = new Logger('TestLogger');
		logger.logInfo('message');
		
		// Function client uses format: "Level Tag: " (may include ANSI codes from MemBuffer)
		expect(buffer.buffers[0]).to.include('TestLogger');
		expect(buffer.buffers[0]).to.include('message');
		
		BeLogged.removeClient(buffer);
		BeLogged.removeClient(LogClient_Function);
	});
});
