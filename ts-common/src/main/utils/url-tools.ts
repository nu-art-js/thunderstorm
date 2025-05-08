/**
 * Generic subdomain extractor.
 * @param origin - The origin URL from which to extract the subdomain.
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