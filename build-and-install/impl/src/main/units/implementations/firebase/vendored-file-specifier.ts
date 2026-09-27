import {relative, resolve} from 'path';

/**
 * `file:` specifier from a vendored package.json to another copied unit.
 * Scoped names live at `.dependencies/@scope/name` (two folders). `file:../${key}`
 * is wrong: from `@app/foo` it becomes `.dependencies/@app/@nu-art/bar`.
 */
export function vendoredFileSpecifier(fromPackageDir: string, vendoredKey: string, dependenciesRoot: string): string {
	const targetDir = resolve(dependenciesRoot, vendoredKey);
	const rel = relative(fromPackageDir, targetDir).split('\\').join('/');
	const normalized = rel.startsWith('.') ? rel : `./${rel}`;
	return `file:${normalized}`;
}
