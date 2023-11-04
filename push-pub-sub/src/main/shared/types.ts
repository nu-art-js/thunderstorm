import {DB_BaseObject, DB_Object} from '@nu-art/ts-common';


export type SubscribeProps = { [prop: string]: string | number };

export type BaseSubscriptionData = {
	props?: SubscribeProps
	pushKey: string
}

export type SubscriptionData<D = any> = BaseSubscriptionData & {
	data?: D
}

export type Request_PushRegister = FirebaseToken & PushSessionId & {
	subscriptions: BaseSubscriptionData[]
}

export type Request_ReadPush = DB_BaseObject & {
	read: boolean
}

export type Response_PushRegister = DB_Notifications[]

export type DB_PushSession = FirebaseToken & PushSessionId & {
	timestamp: number
	userId: string
}

export type DB_Notifications<D = any> = DB_Object & SubscriptionData<D> & {
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

export type MessageDef<Topic extends string, Props extends SubscribeProps, Data> = {
	topic: Topic,
	props: Props,
	data: Data
}

export type PushMessage<Def extends MessageDef<any, any, any>> = {
	topic: Def['topic']
	props: Def['props']
	data: Def['data']
}