/**
 * Extracts the subdomain from a URL origin.
 *
 * Parses the URL and extracts all parts of the hostname except the last part
 * (which is typically the domain and TLD). For example:
 * - `https://app.example.com` → `app`
 * - `https://api.v1.example.com` → `api.v1`
 * - `https://example.com` → `undefined`
 *
 * **Note**: This is a simple extraction and doesn't validate domain structure.
 * It assumes the last dot-separated part is the domain/TLD.
 *
 * @param origin - The origin URL from which to extract the subdomain
 * @returns Subdomain string, or undefined if no subdomain exists or URL is invalid
 */
export const extractSubdomain = (origin: string): string | undefined => {
	try {
		const url = new URL(origin);
		const hostname = url.hostname;

		const parts = hostname.split('.');
		if (parts.length > 1) {
			return parts.slice(0, -1).join('.'); // Extract subdomain (everything before the last part)
		}

		return undefined; // No subdomain
	} catch (error) {
		console.error(`Invalid origin: ${origin}`, error);
		return undefined;
	}
};