import {TestConsole_MultiLogsGrid} from './TestConsole_MultiLogsGrid';
import {LogClient_MemBuffer} from '@nu-art/ts-common';


function generateLogs(index: number): string[] {
	const logs = [];
	for (let i = 0; i < 26; i++) {
		// Generate letter from ASCII values (A = 65, B = 66, ..., Z = 90)
		const line = `line ${String.fromCharCode(65 + i)}`;
		logs.push(line);
	}
	return logs;
}

const logsToPrint = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(index => {
	return generateLogs(index);
});

// Example usage
const screen = new TestConsole_MultiLogsGrid();

let index = 1;
for (let i = 0; i < logsToPrint.length; i++) {
	setTimeout(() => {
		const appKey = `key-${i}`;
		try {
			screen.registerApp(appKey, new LogClient_MemBuffer(appKey));
		} catch (e) {
			console.error(e);
		}
	}, 2000 * index++);
}
