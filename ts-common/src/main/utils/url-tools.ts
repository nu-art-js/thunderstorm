const IPV4_HOSTNAME = /^(?:\d{1,3}\.){3}\d{1,3}$/;

/**
 * Extracts the subdomain prefix from a URL origin relative to a known base host.
 *
 * Strips `baseHost` from the origin hostname and returns the remaining left-hand
 * labels. For example, with `baseHost` `beamz.dev`:
 * - `https://beta.beamz.dev` → `beta`
 * - `https://a.b.beamz.dev` → `a.b`
 * - `https://beamz.dev` → `undefined`
 *
 * IPv4 hostnames and origins that do not end with `.${baseHost}` return `undefined`.
 *
 * @param origin - The origin URL from which to extract the subdomain
 * @param baseHost - Registrable base host (e.g. `beamz.dev`, `localhost`)
 * @returns Subdomain string, or undefined if none exists or the URL is invalid
 */
export const extractSubdomain = (origin: string, baseHost: string): string | undefined => {
	try {
		const url = new URL(origin);
		const hostname = url.hostname;

		if (IPV4_HOSTNAME.test(hostname))
			return undefined;

		const host = hostname.toLowerCase();
		const base = baseHost.toLowerCase();

		if (host === base)
			return undefined;

		const suffix = `.${base}`;
		if (!host.endsWith(suffix))
			return undefined;

		const subdomain = host.slice(0, -suffix.length);
		return subdomain.length > 0 ? subdomain : undefined;
	} catch (error) {
		console.error(`Invalid origin: ${origin}`, error);
		return undefined;
	}
};
