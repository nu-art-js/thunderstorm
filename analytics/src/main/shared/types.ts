
type DB_Object = {
	_id: string
}

export type DB_AnalyticEvent = DB_Object & {
	eventName: string
	timestamp: number
	user?: string
	screen?: string
	eventParams?: { [key: string]: any }
}