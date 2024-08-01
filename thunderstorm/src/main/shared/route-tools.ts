export const trimStartingForwardSlash = (path: string): string => {
	return path.startsWith('/') ? path.substring(1) : path;
};