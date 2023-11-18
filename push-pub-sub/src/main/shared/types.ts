import {DB_Object} from '@nu-art/ts-common';


export type SubscribeProps = { [prop: string]: string | number };

export type BaseSubscriptionData = {
	props?: SubscribeProps
	topic: string
}

export type Request_PushRegister = FirebaseToken & PushSessionId & {
	subscriptions: BaseSubscriptionData[]
}

export type DB_PushSession = FirebaseToken & PushSessionId & {
	timestamp: number
	userId: string
}

export type DB_Notifications<MessageType> = DB_Object & {
	message: MessageType
	userId?: string
	timestamp: number
	read: boolean
	persistent?: boolean
}

export type DB_PushSubscription = PushSessionId & BaseSubscriptionData

export type FirebaseToken = {
	firebaseToken: string
}

export type PushSessionId = {
	pushSessionId: string
}

export type PushMessage<Topic extends string, Props extends SubscribeProps, Data = never> = {
	topic: Topic,
	props: Props,
	data: Data
}

export type PushMessage_PayloadWrapper = {
	sessionId: string,
	payload: string // JSON.stringify(PushMessage_Payload
}

export type PushMessage_Payload<MessageType extends PushMessage<any, any, any> = PushMessage<any, any, any>> = {
	_id: string,
	timestamp: number
	message: MessageType['data']
}