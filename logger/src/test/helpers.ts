/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {BeLogged, LogClient_MemBuffer} from '../main/index.js';

/**
 * Creates a test buffer for capturing log output.
 * 
 * @param name - Buffer name (default: 'test')
 * @param maxBuffers - Maximum number of rotated buffers (default: 10)
 * @param maxBufferSize - Maximum buffer size in bytes (default: 1MB)
 * @returns A new LogClient_MemBuffer instance
 */
export function createTestBuffer(name = 'test', maxBuffers = 10, maxBufferSize = 1024 * 1024): LogClient_MemBuffer {
	return new LogClient_MemBuffer(name, maxBuffers, maxBufferSize);
}

/**
 * Captures logs from a callback function.
 * 
 * Adds a memory buffer client, executes the callback, then removes the client
 * and returns the captured log buffers.
 * 
 * @param callback - Function that generates logs
 * @returns Array of log buffer strings
 */
export function captureLogs(callback: () => void): string[] {
	const buffer = createTestBuffer();
	BeLogged.addClient(buffer);
	try {
		callback();
		return buffer.buffers;
	} finally {
		BeLogged.removeClient(buffer);
	}
}

/**
 * Captures logs from an async callback function.
 * 
 * @param callback - Async function that generates logs
 * @returns Array of log buffer strings
 */
export async function captureLogsAsync(callback: () => Promise<void>): Promise<string[]> {
	const buffer = createTestBuffer();
	BeLogged.addClient(buffer);
	try {
		await callback();
		return buffer.buffers;
	} finally {
		BeLogged.removeClient(buffer);
	}
}

/**
 * Gets the current log content from a buffer.
 * 
 * @param buffer - LogClient_MemBuffer instance
 * @returns Current buffer content (index 0)
 */
export function getBufferContent(buffer: LogClient_MemBuffer): string {
	return buffer.buffers[0] || '';
}

/**
 * Cleans up all log clients (useful for test teardown).
 */
export function cleanupLogClients(): void {
	// Note: BeLogged doesn't expose a way to get all clients,
	// so this is a placeholder for future enhancement
	// For now, tests should manually remove clients they add
}
