import {BadImplementationException} from '@nu-art/ts-common';
import {validateMetadataHost} from '../../metadata-parser.js';

/** Email domains need a dot. An org provider key is `org:<id>` and has no metadata URL when the admin uploaded a file. */
export function assertSamlProviderIdentity(domain: string, metadataUrl: string): void {
	const normalized = domain.toLowerCase().trim();
	const orgScoped = normalized.startsWith('org:') && normalized.length > 'org:'.length;
	if (!orgScoped && !normalized.includes('.'))
		throw new BadImplementationException(`Invalid domain: '${domain}'`);

	if (metadataUrl.trim())
		validateMetadataHost(metadataUrl);
}
