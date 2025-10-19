import {fileURLToPath} from 'node:url';
import path from 'node:path';

export const ___dirname = (metaUrl: string) =>
	path.dirname(fileURLToPath(metaUrl));

