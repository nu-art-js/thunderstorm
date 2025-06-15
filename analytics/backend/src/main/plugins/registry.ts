import {AnalyticsPlugin_Logger, pluginKey_Logger} from './AnalyticsPlugin_Logger';
import {AnalyticsPlugin_MixedPanels, pluginKey_MixedPanels} from './AnalyticsPlugin_MixedPanels';

export type AnalyticsPluginRegistry = {
	[pluginKey_Logger]: AnalyticsPlugin_Logger,
	[pluginKey_MixedPanels]: AnalyticsPlugin_MixedPanels;
}