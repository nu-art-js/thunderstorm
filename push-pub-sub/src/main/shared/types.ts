import {DB_Object} from "@nu-art/firebase";

export type SubscribeProps = { [prop: string]: string | number };

export type SubscriptionData = Partial<DB_Object> & {
	props: SubscribeProps
	pushKey: string
}

export type PubSubSubscription = SubscriptionData

export type Request_PubSubSubscribsion = {
	subscriptions: PubSubSubscription[]
};

export type Response_PubSubSubscribsion = {
	subscriptions: PubSubSubscription[]
};

export type Request_PubSubUnsubscribe = {
	subscriptions: string[]
};

export type Request_PushRegister = {
	firebaseToken: string
	subscriptions: SubscriptionData[]
}

export type DB_PushSession = {
	firebaseToken: string
	timestamp: number
}

export type DB_PushKeys = {
	key: string
	props: SubscribeProps
	firebaseToken: string
}
