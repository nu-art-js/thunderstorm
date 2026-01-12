/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {BeLogged, LogClient_MemBuffer, Logger} from '../main/index.js';
import {expect} from 'chai';

type Input_BufferRotation = { messageSize: number; maxSize: number; maxBuffers: number };
type Result_BufferRotation = { bufferCount: number; rotated: boolean };

type TestCase_BufferRotation = TestModel<Input_BufferRotation, Result_BufferRotation>;

const test_BufferRotation = async (input: Input_BufferRotation): Promise<Result_BufferRotation> => {
	const buffer = new LogClient_MemBuffer('test', input.maxBuffers, input.maxSize);
	BeLogged.addClient(buffer);
	
	const logger = new Logger('TestLogger');
	const message = 'x'.repeat(input.messageSize);
	const initialBufferCount = buffer.buffers.length;
	
	// For rotation test: send multiple messages to fill buffer
	// Rotation happens BEFORE adding current log, so we need to accumulate size first
	if (input.messageSize * 3 > input.maxSize) {
		// This should trigger rotation - send multiple messages
		for (let i = 0; i < 10; i++) {
			logger.logInfo(message);
			if (buffer.buffers.length > initialBufferCount)
				break; // Rotation occurred
		}
	} else {
		// This should NOT trigger rotation - send just one message
		logger.logInfo(message);
	}
	
	const bufferCount = buffer.buffers.length;
	const rotated = bufferCount > 1;
	
	BeLogged.removeClient(buffer);
	return { bufferCount, rotated };
};

const runTestCase_BufferRotation = (testCase: TestCase_BufferRotation) => () => runSingleTestCase(test_BufferRotation, testCase);

describe('LogClient_MemBuffer - Buffer Rotation', () => {
	it('should not rotate when under max size', runTestCase_BufferRotation({
		input: { messageSize: 100, maxSize: 1024, maxBuffers: 3 },
		result: { bufferCount: 1, rotated: false }
	}));

	it('should rotate when exceeding max size', runTestCase_BufferRotation({
		input: { messageSize: 200, maxSize: 500, maxBuffers: 3 },
		result: async (result) => {
			// Rotation happens before adding current log, so we need multiple messages
			// The exact count depends on prefix size and accumulated buffer
			expect(result.rotated).to.be.true;
			expect(result.bufferCount).to.be.greaterThan(1);
		}
	}));
});

describe('LogClient_MemBuffer - Log Transformer', () => {
	it('should transform log content', () => {
		const buffer = new LogClient_MemBuffer('test');
		buffer.setLogTransformer((log) => `[TRANSFORMED] ${log}`);
		
		BeLogged.addClient(buffer);
		const logger = new Logger('TestLogger');
		logger.logInfo('original message');
		
		expect(buffer.buffers[0]).to.include('[TRANSFORMED]');
		expect(buffer.buffers[0]).to.include('original message');
		
		BeLogged.removeClient(buffer);
	});

	it('should apply transformer to each log', () => {
		const buffer = new LogClient_MemBuffer('test');
		let transformCount = 0;
		buffer.setLogTransformer((log) => {
			transformCount++;
			return log.toUpperCase();
		});
		
		BeLogged.addClient(buffer);
		const logger = new Logger('TestLogger');
		logger.logInfo('message1');
		logger.logInfo('message2');
		
		expect(transformCount).to.be.greaterThan(0);
		
		BeLogged.removeClient(buffer);
	});
});

describe('LogClient_MemBuffer - Log Appended Listener', () => {
	it('should call listener when log is appended', () => {
		const buffer = new LogClient_MemBuffer('test');
		let callCount = 0;
		buffer.setLogAppendedListener(() => {
			callCount++;
		});
		
		BeLogged.addClient(buffer);
		const logger = new Logger('TestLogger');
		logger.logInfo('message1');
		logger.logInfo('message2');
		
		expect(callCount).to.be.greaterThan(0);
		
		BeLogged.removeClient(buffer);
	});
});

describe('LogClient_MemBuffer - Natural Colors', () => {
	it('should preserve natural colors when enabled', () => {
		const buffer = new LogClient_MemBuffer('test');
		buffer.keepLogsNaturalColors(true);
		
		BeLogged.addClient(buffer);
		const logger = new Logger('TestLogger');
		logger.logInfo('message');
		
		// With natural colors, ANSI codes should be preserved or handled differently
		expect(buffer.buffers[0]).to.be.a('string');
		
		BeLogged.removeClient(buffer);
	});
});

describe('LogClient_MemBuffer - Buffer Access', () => {
	it('should provide access to buffers array', () => {
		const buffer = new LogClient_MemBuffer('test', 3, 100);
		expect(buffer.buffers).to.be.an('array');
		expect(buffer.buffers.length).to.equal(1);
		expect(buffer.buffers[0]).to.equal('');
	});
});
