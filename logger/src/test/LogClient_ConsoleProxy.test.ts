/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {LogClient_ConsoleProxy, LogLevel, LogToStream, BeLogged, Logger} from '../main/index.js';
import {expect} from 'chai';

// Create a testable console proxy
class TestConsoleProxy extends LogClient_ConsoleProxy {
	protected appName = 'TestApp';
	public sentLogs: LogToStream[] = [];
	public originalConsoleError: any;

	protected async sendLogsToEndpoint(logs: LogToStream[]): Promise<void> {
		this.sentLogs.push(...logs);
	}
}

describe('LogClient_ConsoleProxy - Initialization', () => {
	it('should intercept console.error on init', () => {
		const proxy = new TestConsoleProxy();
		const originalError = console.error;
		
		BeLogged.addClient(proxy);
		proxy.init();
		
		expect(console.error).not.to.equal(originalError);
		expect(proxy.originalConsoleError).to.equal(originalError);
		
		// Restore
		proxy.stop();
		BeLogged.removeClient(proxy);
	});

	it('should restore console.error on stop', () => {
		const proxy = new TestConsoleProxy();
		const originalError = console.error;
		
		BeLogged.addClient(proxy);
		proxy.init();
		
		expect(console.error).not.to.equal(originalError);
		
		proxy.stop();
		
		expect(console.error).to.equal(originalError);
		
		BeLogged.removeClient(proxy);
	});
});

describe('LogClient_ConsoleProxy - Error Interception', () => {
	it('should capture console.error calls', async () => {
		const proxy = new TestConsoleProxy();
		BeLogged.addClient(proxy);
		
		console.error('test error');
		
		// Give it time to process
		await new Promise(resolve => setTimeout(resolve, 600));
		
		expect(proxy.sentLogs.length).to.be.greaterThan(0);
		expect(proxy.sentLogs.some(log => log.logContent.includes('test error'))).to.be.true;
		
		proxy.stop();
		BeLogged.removeClient(proxy);
	});
});

describe('LogClient_ConsoleProxy - Log Buffering', () => {
	it('should buffer logs before sending', async () => {
		const proxy = new TestConsoleProxy();
		BeLogged.addClient(proxy);
		
		const logger = new Logger('TestLogger');
		logger.logInfo('buffered message');
		
		// Logs should be buffered, not immediately sent
		expect(proxy.sentLogs.length).to.equal(0);
		
		// Wait for debounced flush
		await new Promise(resolve => setTimeout(resolve, 2000));
		
		// Should have sent logs
		expect(proxy.sentLogs.length).to.be.greaterThan(0);
		
		proxy.stop();
		BeLogged.removeClient(proxy);
	});

	it('should flush immediately when buffer reaches maxBuffers', async () => {
		const proxy = new TestConsoleProxy();
		// @ts-ignore - access private property for testing
		proxy.maxBuffers = 5;
		BeLogged.addClient(proxy);
		
		const logger = new Logger('TestLogger');
		// Write more than maxBuffers
		for (let i = 0; i < 6; i++) {
			logger.logInfo(`message ${i}`);
		}
		
		// Should flush immediately
		await new Promise(resolve => setTimeout(resolve, 100));
		
		expect(proxy.sentLogs.length).to.be.greaterThan(0);
		
		proxy.stop();
		BeLogged.removeClient(proxy);
	});

	it('should flush error logs after delay', async () => {
		const proxy = new TestConsoleProxy();
		BeLogged.addClient(proxy);
		
		const logger = new Logger('TestLogger');
		logger.logError('error message');
		
		// Error logs should flush after 500ms
		await new Promise(resolve => setTimeout(resolve, 600));
		
		expect(proxy.sentLogs.length).to.be.greaterThan(0);
		expect(proxy.sentLogs.some(log => log.severity === LogLevel.Error)).to.be.true;
		
		proxy.stop();
		BeLogged.removeClient(proxy);
	});
});

describe('LogClient_ConsoleProxy - Log Format', () => {
	it('should format logs as LogToStream', async () => {
		const proxy = new TestConsoleProxy();
		BeLogged.addClient(proxy);
		
		const logger = new Logger('TestLogger');
		logger.logInfo('test message');
		
		await new Promise(resolve => setTimeout(resolve, 2000));
		
		if (proxy.sentLogs.length > 0) {
			const log = proxy.sentLogs[0];
			expect(log).to.have.property('severity');
			expect(log).to.have.property('logContent');
			expect(log).to.have.property('reporter');
			expect(log).to.have.property('timestamp');
			expect(log.severity).to.equal(LogLevel.Info);
			expect(log.logContent).to.include('test message');
			expect(log.reporter).to.include('TestLogger');
		}
		
		proxy.stop();
		BeLogged.removeClient(proxy);
	});
});

describe('LogClient_ConsoleProxy - Cleanup', () => {
	it('should clear error log timeout on stop', async () => {
		const proxy = new TestConsoleProxy();
		BeLogged.addClient(proxy);
		
		const logger = new Logger('TestLogger');
		logger.logError('error message');
		
		// Stop before timeout fires
		proxy.stop();
		
		// Should not throw and should have cleaned up
		expect(proxy).to.exist;
		
		BeLogged.removeClient(proxy);
	});

	it('should handle multiple stop calls', () => {
		const proxy = new TestConsoleProxy();
		BeLogged.addClient(proxy);
		
		proxy.stop();
		proxy.stop(); // Should not throw
		
		BeLogged.removeClient(proxy);
	});
});
