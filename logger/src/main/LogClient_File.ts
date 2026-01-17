/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import * as fs from 'fs';
import {WriteStream} from 'fs';
import {LogClient_BaseRotate} from './LogClient_BaseRotate.js';


/**
 * Log client that writes logs to rotating files on disk.
 * 
 * Creates log files in the format `{name}-{index}.txt` where index 0 is the current log.
 * When the current log exceeds maxSize, it rotates: log-0.txt → log-1.txt, log-1.txt → log-2.txt, etc.
 * The oldest log (log-{maxEntries-1}.txt) is deleted during rotation.
 * 
 * The log folder is created automatically if it doesn't exist. If a log file already
 * exists, its size is used to initialize the bufferSize counter.
 */
export class LogClient_File
	extends LogClient_BaseRotate {

	/** Directory path where log files are stored */
	private pathToFolder: string;
	/** WriteStream for the current log file */
	private buffer!: WriteStream;

	/**
	 * Creates a new file-based log client.
	 * 
	 * @param name - Log file name prefix (e.g., "app" creates "app-0.txt", "app-1.txt", etc.)
	 * @param pathToFolder - Directory path for log files (created if it doesn't exist)
	 * @param maxEntries - Maximum number of rotated log files to keep (default: 10)
	 * @param maxSize - Maximum file size in bytes before rotation (default: 1MB)
	 */
	constructor(name: string, pathToFolder: string, maxEntries = 10, maxSize = 1024 * 1024) {
		super(name, maxEntries, maxSize);
		this.pathToFolder = pathToFolder;
		if (!fs.existsSync(pathToFolder))
			fs.mkdirSync(pathToFolder, {recursive: true});

		const defaultLogfile = this.getFileName();
		if (fs.existsSync(defaultLogfile))
			this.bufferSize = fs.statSync(`${defaultLogfile}`).size;

		this.prepare();
	}

	/**
	 * Gets the filename for a log file at the given index.
	 * 
	 * @param index - Log file index (0 = current, 1+ = rotated)
	 * @returns Full path to the log file
	 */
	private getFileName(index = 0) {
		return `${this.pathToFolder}/${this.name}-${index}.txt`;
	}

	/**
	 * Writes a log message to the current log file.
	 * 
	 * @param log - Formatted log string (includes newline)
	 */
	protected printLogMessage(log: string) {
		this.buffer.write(log);
	}

	/**
	 * Rotates a log file by renaming it to the next index.
	 * 
	 * @param fromIndex - Source index
	 * @param toIndex - Destination index
	 */
	protected rotateBuffer(fromIndex: number, toIndex: number): void {
		if (fs.existsSync(this.getFileName(fromIndex))) {
			console.log(`rotating ${fromIndex} => ${toIndex}`);
			fs.renameSync(this.getFileName(fromIndex), this.getFileName(toIndex));
		}
	}

	/**
	 * Cleans up the oldest log file and closes the current write stream.
	 * 
	 * Called during rotation to delete the oldest log and prepare for a new current log.
	 */
	protected cleanup(): void {
		const fileName = this.getFileName(this.maxEntries - 1);
		if (fs.existsSync(fileName))
			fs.unlinkSync(fileName);
		this.buffer.end();
	}

	/**
	 * Prepares a new log file by creating a write stream.
	 * 
	 * Opens the current log file (index 0) in append mode.
	 */
	protected prepare(): void {
		this.buffer = fs.createWriteStream(this.getFileName(), {flags: 'a'});
	}
}