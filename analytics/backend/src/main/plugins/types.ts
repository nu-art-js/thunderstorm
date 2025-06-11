export type AnalyticsPluginBaseConfig = {
	token: string;
	eventPacketSize: number;
}

export type AnalyticPanelConfig<C> = AnalyticsPluginBaseConfig & C;