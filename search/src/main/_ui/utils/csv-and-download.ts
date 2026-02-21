/**
 * Minimal CSV stringify and file download for search export. No thunderstorm dependency.
 */

export function objectsToCsvString<T extends Record<string, unknown>>(objects: T[], headers?: (keyof T)[]): string {
	const keys = headers ?? (objects.length ? (Object.keys(objects[0]) as (keyof T)[]) : []);
	const headerRow = keys.join(',');
	const rows = objects.map(obj => keys.map(k => String(obj[k] ?? '')).join(','));
	return [headerRow, ...rows].join('\n');
}

export function downloadFile(options: { fileName: string; content: string; mimeType: string }): void {
	const blob = new Blob([options.content], {type: options.mimeType});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = options.fileName;
	a.click();
	URL.revokeObjectURL(url);
}
