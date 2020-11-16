import { BaseDB_ApiGeneratorCaller } from "@nu-art/db-api-generator/frontend";
import { ThunderDispatcher } from "@nu-art/thunderstorm/frontend";
import { DB_AnalyticEvent } from "../..";
export interface OnAnalyticsQuery {
    __onAnalyticsQuery: () => void;
}
export declare const dispatch_onAnalyticsQuery: ThunderDispatcher<OnAnalyticsQuery, "__onAnalyticsQuery">;
export declare const PAGE_MOUNT = "page_mount";
export declare const VIEW_TIME = "view_time";
export declare const TIME = "time";
export declare class AnalyticsModule_Class extends BaseDB_ApiGeneratorCaller<DB_AnalyticEvent> {
    private items?;
    private screenStart?;
    private currentScreen?;
    private start?;
    private user?;
    getItems(): DB_AnalyticEvent[] | undefined;
    pageMount(): void;
    visibilityStart(): void;
    visibilityStop(): void;
    setUser(user: string): void;
    setCurrentScreen(screen: string): void;
    logEvent(eventName: string, eventParams?: {
        [key: string]: any;
    }): void;
    protected onEntryCreated(response: DB_AnalyticEvent): Promise<void>;
    protected onEntryDeleted(response: DB_AnalyticEvent): Promise<void>;
    protected onEntryUpdated(response: DB_AnalyticEvent): Promise<void>;
    protected onGotUnique(response: DB_AnalyticEvent): Promise<void>;
    onQueryReturned(response: DB_AnalyticEvent[]): Promise<void>;
    currentTimeMillies(): number;
}
export declare const AnalyticsModule: AnalyticsModule_Class;
