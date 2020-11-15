
import {BaseDB_ApiGeneratorCaller} from "@nu-art/db-api-generator/frontend";

import {ThunderDispatcher} from "@nu-art/thunderstorm/frontend";
import {
	currentTimeMillies
} from "@nu-art/ts-common";
import {DB_AnalyticEvent} from "../..";

export interface OnAnalyticsQuery {
	__onAnalyticsQuery: () => void;
}

export const dispatch_onAnalyticsQuery = new ThunderDispatcher<OnAnalyticsQuery, '__onAnalyticsQuery'>('__onAnalyticsQuery');
export const PAGE_MOUNT = "page_mount"
export const VIEW_TIME = "view_time"
export const TIME = "time"

export class AnalyticsModule_Class extends BaseDB_ApiGeneratorCaller<DB_AnalyticEvent> {

	private items?: DB_AnalyticEvent[] = undefined;
	private screenStart?: number = undefined
	private currentScreen?: string;
	private start?: number
	private user?: string

	public getItems() {
		return this.items;
	}

	pageMount(){
		this.logEvent(PAGE_MOUNT)
		this.start = currentTimeMillies()
	}

	visibilityStart(){
		this.start = currentTimeMillies()
	}

	visibilityStop(){
		if(!this.start)
			return
		const delta = currentTimeMillies() - this.start
		this.logEvent(VIEW_TIME, {time: delta})
	}

	setUser(user: string){
		this.user = user
	}

	setCurrentScreen(screen: string){
		const now = currentTimeMillies()
		if(this.screenStart && this.currentScreen){
			const start = this.screenStart
			const delta = now - start
			this.logEvent("screen_view_time", {screen: this.currentScreen, time: delta})
		}
		this.currentScreen = screen
		this.screenStart = now
	}

	public logEvent(eventName: string, eventParams?: { [key: string]: any}){
		const timestamp = currentTimeMillies()
		this.create({
			            eventName,
			            eventParams,
			            timestamp,
			            user: this.user,
			            screen: this.currentScreen
		            })
	}

	protected onEntryCreated(response: DB_AnalyticEvent): Promise<void> {
		return Promise.resolve(undefined);
	}

	protected onEntryDeleted(response: DB_AnalyticEvent): Promise<void> {
		return Promise.resolve(undefined);
	}

	protected onEntryUpdated(response: DB_AnalyticEvent): Promise<void> {
		return Promise.resolve(undefined);
	}

	protected onGotUnique(response: DB_AnalyticEvent): Promise<void> {
		return Promise.resolve(undefined);
	}

	async onQueryReturned(response: DB_AnalyticEvent[]): Promise<void> {
		this.items = response
		dispatch_onAnalyticsQuery.dispatchUI([]);
	}

	currentTimeMillies() {
		const date = new Date();
		return date.getTime();
	}

}

export const AnalyticsModule = new AnalyticsModule_Class({key: "analytic", relativeUrl: "/v1/analytic"});
