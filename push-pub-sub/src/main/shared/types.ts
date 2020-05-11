export type SubscribeProps = { [prop: string]: string | number };

export type BaseSubscriptionData = {
	props: SubscribeProps
	pushKey: string
}

export type SubscriptionData = BaseSubscriptionData & {
	data?: any
}

export type Request_PushRegister = FirebaseToken & {
	subscriptions: BaseSubscriptionData[]
}

export type DB_PushSession = FirebaseToken & {
	timestamp: number
}

export type DB_PushKeys = FirebaseToken & {
	pushKey: string
	props: SubscribeProps
}

export type FirebaseToken = {
	firebaseToken: string
}