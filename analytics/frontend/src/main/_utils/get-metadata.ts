import {TSAnalyticsEventMetadata} from '@nu-art/analytics-shared';
import {Thunder} from '@nu-art/thunderstorm/frontend';

export function getBaseAnalyticsMetadata(): TSAnalyticsEventMetadata {
	return {
		env: Thunder.getInstance().getConfig().label,

	};
}