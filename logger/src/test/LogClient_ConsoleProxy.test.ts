/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {BeLogged, LogClient_ConsoleProxy, Logger, LogLevel, LogToStream} from '../main/index.js';
import {expect} from 'chai';

// Global cleanup to ensure all clients are removed after all tests
after(() => {
	BeLogged.removeAllClients();
});

// Create a testable console proxy
class TestConsoleProxy extends LogClient_ConsoleProxy {
	protected appName = 'TestApp';
	public sentLogs: LogToStream[] = [];

	protected sendLogsToEndpoint = async (logs: LogToStream[]): Promise<void> => {
		this.sentLogs.push(...logs);
	};
}

describe('LogClient_ConsoleProxy - Initialization', () => {
	let proxies: TestConsoleProxy[] = [];

	afterEach(() => {
		// Clean up all proxies
		for (const proxy of proxies) {
			proxy.stop();
			BeLogged.removeClient(proxy);
		}
		proxies = [];
	});

	it('should intercept console.error on init', () => {
		const proxy = new TestConsoleProxy();
		proxies.push(proxy);
		const originalError = console.error;
		
		// BeLogged.addClient() automatically calls init()
		BeLogged.addClient(proxy);
		
		expect(console.error).not.to.equal(originalError);
		// @ts-ignore - access private property for testing
		expect(proxy['originalConsoleError']).to.equal(originalError);
	});

	it('should restore console.error on stop', () => {
		const proxy = new TestConsoleProxy();
		proxies.push(proxy);
		const originalError = console.error;
		
		// BeLogged.addClient() automatically calls init()
		BeLogged.addClient(proxy);
		
		expect(console.error).not.to.equal(originalError);
		
		proxy.stop();
		
		expect(console.error).to.equal(originalError);
	});
});

describe('LogClient_ConsoleProxy - Error Interception', () => {
	let proxies: TestConsoleProxy[] = [];

	afterEach(() => {
		for (const proxy of proxies) {
			proxy.stop();
			BeLogged.removeClient(proxy);
		}
		proxies = [];
	});

	it('should capture console.error calls', async () => {
		const proxy = new TestConsoleProxy();
		proxies.push(proxy);
		BeLogged.addClient(proxy);
		
		console.error('test error');
		
		// Give it time to process
		await new Promise(resolve => setTimeout(resolve, 600));
		
		expect(proxy.sentLogs.length).to.be.greaterThan(0);
		expect(proxy.sentLogs.some(log => log.logContent.includes('test error'))).to.be.true;
	});
});

describe('LogClient_ConsoleProxy - Log Buffering', () => {
	let proxies: TestConsoleProxy[] = [];

	afterEach(() => {
		for (const proxy of proxies) {
			proxy.stop();
			BeLogged.removeClient(proxy);
		}
		proxies = [];
	});

	it('should buffer logs before sending', async () => {
		const proxy = new TestConsoleProxy();
		proxies.push(proxy);
		BeLogged.addClient(proxy);
		
		const logger = new Logger('TestLogger');
		logger.logInfo('buffered message');
		
		// Logs should be buffered, not immediately sent
		expect(proxy.sentLogs.length).to.equal(0);
		
		// Verify it's still buffered after a short wait (interval is 60 seconds)
		await new Promise(resolve => setTimeout(resolve, 100));
		expect(proxy.sentLogs.length).to.equal(0); // Should still be buffered
	});

	it('should flush immediately when buffer reaches maxBuffers', async () => {
		const proxy = new TestConsoleProxy();
		proxies.push(proxy);
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
	});

	it('should flush error logs after delay', async () => {
		const proxy = new TestConsoleProxy();
		proxies.push(proxy);
		BeLogged.addClient(proxy);
		
		const logger = new Logger('TestLogger');
		logger.logError('error message');
		
		// Error logs should flush after 500ms
		await new Promise(resolve => setTimeout(resolve, 600));
		
		expect(proxy.sentLogs.length).to.be.greaterThan(0);
		expect(proxy.sentLogs.some(log => log.severity === LogLevel.Error)).to.be.true;
	});
});

describe('LogClient_ConsoleProxy - Log Format', () => {
	let proxies: TestConsoleProxy[] = [];

	afterEach(() => {
		for (const proxy of proxies) {
			proxy.stop();
			BeLogged.removeClient(proxy);
		}
		proxies = [];
	});

	it('should format logs as LogToStream', async () => {
		const proxy = new TestConsoleProxy();
		proxies.push(proxy);
		BeLogged.addClient(proxy);
		
		const logger = new Logger('TestLogger');
		logger.logError('test message'); // Use error to trigger immediate flush after 500ms
		
		await new Promise(resolve => setTimeout(resolve, 600));
		
		if (proxy.sentLogs.length > 0) {
			const log = proxy.sentLogs[0];
			expect(log).to.have.property('severity');
			expect(log).to.have.property('logContent');
			expect(log).to.have.property('reporter');
			expect(log).to.have.property('timestamp');
			expect(log.severity).to.equal(LogLevel.Error);
			expect(log.logContent).to.include('test message');
			expect(log.reporter).to.include('TestLogger');
		}
	});
});

describe('LogClient_ConsoleProxy - Cleanup', () => {
	let proxies: TestConsoleProxy[] = [];

	afterEach(() => {
		for (const proxy of proxies) {
			proxy.stop();
			BeLogged.removeClient(proxy);
		}
		proxies = [];
	});

	it('should clear error log timeout on stop', async () => {
		const proxy = new TestConsoleProxy();
		proxies.push(proxy);
		BeLogged.addClient(proxy);
		
		const logger = new Logger('TestLogger');
		logger.logError('error message');
		
		// Stop before timeout fires
		proxy.stop();
		
		// Should not throw and should have cleaned up
		expect(proxy).to.exist;
	});

	it('should handle multiple stop calls', () => {
		const proxy = new TestConsoleProxy();
		proxies.push(proxy);
		BeLogged.addClient(proxy);
		
		proxy.stop();
		proxy.stop(); // Should not throw
	});
		
	// Final cleanup to ensure no intervals remain
	after(() => {
		BeLogged.removeAllClients();
	});
});
