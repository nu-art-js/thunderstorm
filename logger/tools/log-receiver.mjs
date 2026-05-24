#!/usr/bin/env node
/**
 * Remote log receiver for agent-assisted debugging.
 *
 * Listens on a local port and prints log entries received from LogClient_DebugRelay.
 * Run from the monorepo root: node _thunderstorm/logger/tools/log-receiver.mjs [port]
 *
 * Default port: 9999
 */
import {createServer} from 'http';

const PORT = parseInt(process.argv[2] ?? '9999', 10);

const server = createServer((req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.writeHead(204);
		res.end();
		return;
	}

	if (req.method === 'POST') {
		let body = '';
		req.on('data', chunk => body += chunk);
		req.on('end', () => {
			try {
				const {logs} = JSON.parse(body);
				for (const log of logs) {
					const level = ['---', '-V-', '-D-', '-I-', '-W-', '-E-'][log.severity] ?? '---';
					console.log(`${log.timestamp} ${level} ${log.reporter}: ${log.logContent}`);
				}
			} catch (e) {
				console.error('Parse error:', e.message);
			}
			res.writeHead(200);
			res.end('ok');
		});
		return;
	}

	res.writeHead(404);
	res.end();
});

server.listen(PORT, () => {
	console.log(`[log-receiver] Listening on http://localhost:${PORT}`);
});
