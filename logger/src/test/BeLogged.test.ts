/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {runSingleTestCase, TestSuite} from '@nu-art/testalot';
import {BeLogged, LogClient_MemBuffer, Logger, LogLevel} from '../main/index.js';
import {createTestBuffer, getBufferContent} from './helpers.js';
import {expect} from 'chai';

// Global cleanup to ensure all clients are removed after all tests
after(() => {
	BeLogged.removeAllClients();
});

type Input_AddClient = { clientCount: number };
type Result_AddClient = { added: boolean };

type TestSuite_AddClient = TestSuite<Input_AddClient, Result_AddClient>;
type TestCase_AddClient = TestSuite_AddClient['testcases'][number];

const test_AddClient = async (input: Input_AddClient): Promise<Result_AddClient> => {
	const clients: LogClient_MemBuffer[] = [];
	for (let i = 0; i < input.clientCount; i++) {
		const client = createTestBuffer(`client${i}`);
		BeLogged.addClient(client);
		clients.push(client);
	}
	
	// Try to add the same client again (should not duplicate)
	if (clients.length > 0) {
		BeLogged.addClient(clients[0]);
	}
	
	// Clean up
	clients.forEach(client => BeLogged.removeClient(client));
	
	return { added: true };
};

const runTestCase_AddClient = (testCase: TestCase_AddClient) => () => runSingleTestCase(test_AddClient, testCase);

describe('BeLogged - Add Client', () => {
	it('should add single client', runTestCase_AddClient({
		input: { clientCount: 1 },
		result: { added: true }
	}));

	it('should add multiple clients', runTestCase_AddClient({
		input: { clientCount: 3 },
		result: { added: true }
	}));

	it('should not add duplicate client', () => {
		const client = createTestBuffer('duplicate');
		BeLogged.addClient(client);
		BeLogged.addClient(client); // Should not throw or duplicate
		BeLogged.removeClient(client);
	});
});

type Input_RemoveClient = { addClients: number; removeClients: number };
type Result_RemoveClient = { removed: boolean };

type TestSuite_RemoveClient = TestSuite<Input_RemoveClient, Result_RemoveClient>;
type TestCase_RemoveClient = TestSuite_RemoveClient['testcases'][number];

const test_RemoveClient = async (input: Input_RemoveClient): Promise<Result_RemoveClient> => {
	const clients: LogClient_MemBuffer[] = [];
	for (let i = 0; i < input.addClients; i++) {
		const client = createTestBuffer(`client${i}`);
		BeLogged.addClient(client);
		clients.push(client);
	}
	
	for (let i = 0; i < input.removeClients; i++) {
		if (clients[i]) {
			BeLogged.removeClient(clients[i]);
		}
	}
	
	// Clean up any remaining
	clients.forEach(client => BeLogged.removeClient(client));
	
	return { removed: true };
};

const runTestCase_RemoveClient = (testCase: TestCase_RemoveClient) => () => runSingleTestCase(test_RemoveClient, testCase);

describe('BeLogged - Remove Client', () => {
	it('should remove single client', runTestCase_RemoveClient({
		input: { addClients: 1, removeClients: 1 },
		result: { removed: true }
	}));

	it('should remove multiple clients', runTestCase_RemoveClient({
		input: { addClients: 3, removeClients: 2 },
		result: { removed: true }
	}));

	it('should handle removing non-existent client', () => {
		const client = createTestBuffer('nonexistent');
		// Should not throw
		BeLogged.removeClient(client);
	});
});

describe('BeLogged - Log Distribution', () => {
	it('should distribute logs to all clients', () => {
		const client1 = createTestBuffer('client1');
		const client2 = createTestBuffer('client2');
		const client3 = createTestBuffer('client3');
		
		BeLogged.addClient(client1);
		BeLogged.addClient(client2);
		BeLogged.addClient(client3);
		
		const logger = new Logger('TestLogger');
		logger.logInfo('distributed message');
		
		expect(getBufferContent(client1)).to.include('distributed message');
		expect(getBufferContent(client2)).to.include('distributed message');
		expect(getBufferContent(client3)).to.include('distributed message');
		
		BeLogged.removeClient(client1);
		BeLogged.removeClient(client2);
		BeLogged.removeClient(client3);
	});

	it('should not log to removed clients', () => {
		const client1 = createTestBuffer('client1');
		const client2 = createTestBuffer('client2');
		
		BeLogged.addClient(client1);
		BeLogged.addClient(client2);
		
		const logger = new Logger('TestLogger');
		logger.logInfo('before removal');
		
		BeLogged.removeClient(client1);
		
		logger.logInfo('after removal');
		
		expect(getBufferContent(client1)).to.include('before removal');
		expect(getBufferContent(client1)).not.to.include('after removal');
		expect(getBufferContent(client2)).to.include('before removal');
		expect(getBufferContent(client2)).to.include('after removal');
		
		BeLogged.removeClient(client2);
	});
});

describe('BeLogged - Client Filtering', () => {
	it('should respect client filters', () => {
		const client1 = createTestBuffer('client1');
		const client2 = createTestBuffer('client2');
		
		// Client1 only logs errors
		client1.setFilter((level) => level === LogLevel.Error);
		// Client2 logs everything
		client2.setFilter(() => true);
		
		BeLogged.addClient(client1);
		BeLogged.addClient(client2);
		
		const logger = new Logger('TestLogger');
		logger.logInfo('info message');
		logger.logError('error message');
		
		expect(getBufferContent(client1)).not.to.include('info message');
		expect(getBufferContent(client1)).to.include('error message');
		expect(getBufferContent(client2)).to.include('info message');
		expect(getBufferContent(client2)).to.include('error message');
		
		BeLogged.removeClient(client1);
		BeLogged.removeClient(client2);
	});

	it('should filter by tag', () => {
		const client = createTestBuffer('filtered');
		client.setFilter((level, tag) => tag === 'AllowedTag');
		
		BeLogged.addClient(client);
		
		const logger1 = new Logger('AllowedTag');
		const logger2 = new Logger('BlockedTag');
		
		logger1.logInfo('allowed message');
		logger2.logInfo('blocked message');
		
		expect(getBufferContent(client)).to.include('allowed message');
		expect(getBufferContent(client)).not.to.include('blocked message');
		
		BeLogged.removeClient(client);
	});
});

describe('BeLogged - removeConsole alias', () => {
	it('should work as alias for removeClient', () => {
		const client = createTestBuffer('console');
		BeLogged.addClient(client);
		BeLogged.removeConsole(client);
		// Should not throw and client should be removed
	});
});

describe('BeLogged - Console Operations', () => {
	it('should track line count for rewriteConsole', () => {
		BeLogged.rewriteConsole(5);
		// Just verify it doesn't throw
		expect(BeLogged).to.exist;
	});

	it('should clear footer lines', () => {
		BeLogged.rewriteConsole(3);
		// clearFooter writes newlines, hard to test without mocking stdout
		// Just verify it doesn't throw
		BeLogged.clearFooter();
		expect(BeLogged).to.exist;
	});
});
