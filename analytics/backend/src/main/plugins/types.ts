export type AnalyticsPluginBaseConfig = {
	active: boolean;
	token: string;
	eventPacketSize: number;
}

export type AnalyticPanelConfig<C> = AnalyticsPluginBaseConfig & C;