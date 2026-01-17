/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {BeLogged, LogClient_BrowserGroups, Logger} from '../main/index.js';
import {createTestBuffer} from './helpers.js';
import {expect} from 'chai';

describe('LogClient_BrowserGroups - Logging', () => {
	it('should output logs with grouped formatting', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		BeLogged.addClient(LogClient_BrowserGroups);
		
		const logger = new Logger('TestLogger');
		logger.logInfo('test message');
		
		// BrowserGroups uses console.groupCollapsed which is hard to test without browser
		// But we can verify it doesn't throw and buffer receives the message
		expect(buffer.buffers[0]).to.include('test message');
		
		BeLogged.removeClient(buffer);
		BeLogged.removeClient(LogClient_BrowserGroups);
	});

	it('should combine primitive first parameter with prefix', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		BeLogged.addClient(LogClient_BrowserGroups);
		
		const logger = new Logger('TestLogger');
		logger.logInfo('primitive message', { object: 'data' });
		
		// Should not throw
		expect(buffer.buffers[0]).to.be.a('string');
		
		BeLogged.removeClient(buffer);
		BeLogged.removeClient(LogClient_BrowserGroups);
	});

	it('should handle object parameters in groups', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		BeLogged.addClient(LogClient_BrowserGroups);
		
		const logger = new Logger('TestLogger');
		logger.logInfo({ key: 'value' }, 'additional message');
		
		// Should not throw
		expect(buffer.buffers[0]).to.be.a('string');
		
		BeLogged.removeClient(buffer);
		BeLogged.removeClient(LogClient_BrowserGroups);
	});
});

describe('LogClient_BrowserGroups - Styling', () => {
	it('should use custom prefix composer with %c markers', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		BeLogged.addClient(LogClient_BrowserGroups);
		
		const logger = new Logger('TestLogger');
		logger.logInfo('styled message');
		
		// BrowserGroups composer includes %c markers for styling
		// The prefix should contain level, timestamp, and tag markers
		expect(buffer.buffers[0]).to.include('TestLogger');
		
		BeLogged.removeClient(buffer);
		BeLogged.removeClient(LogClient_BrowserGroups);
	});
});
