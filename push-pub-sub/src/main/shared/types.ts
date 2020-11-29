import {DB_Object} from "@nu-art/ts-common";

export type SubscribeProps = { [prop: string]: string | number };

export type BaseSubscriptionData = {
	props?: SubscribeProps
	pushKey: string
}

export type SubscriptionData = BaseSubscriptionData & {
	data?: any
}

export type Request_PushRegister = FirebaseToken & PushSessionId & {
	subscriptions: BaseSubscriptionData[]
}

export type Request_ReadPush = DB_Object & {
	read: boolean
}

export type Response_PushRegister = DB_Notifications[]

export type DB_PushSession = FirebaseToken & PushSessionId & {
	timestamp: number
	userId: string
}

export type DB_Notifications = DB_Object & SubscriptionData & {
	userId?: string
	timestamp: number
	read: boolean
	persistent?: boolean
}

export type DB_PushKeys = PushSessionId & BaseSubscriptionData

export type FirebaseToken = {
	firebaseToken: string
}

export type PushSessionId = {
	pushSessionId: string
}

export type MessageType<S extends string, P extends SubscribeProps, D> = {}
export type IFP<Binder extends MessageType<any, any, any>> = Binder extends MessageType<infer S, any, any> ? S extends string ? S : never : never;
export type ISP<Binder extends MessageType<any, any, any>> = Binder extends MessageType<any, infer P, any> ? P extends SubscribeProps ? P : never : never;
export type ITP<Binder extends MessageType<any, any, any>> = Binder extends MessageType<any, any, infer D> ? D : never;
