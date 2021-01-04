/*
 * Storm contains a list of utility functions.. this project
 * might be broken down into more smaller projects in the future.
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Module} from "@ir/ts-common";

import {
	Collection,
	Db,
	MongoClient,
	MongoClientOptions
} from "mongodb";

type Config = {
	host: string
	port: number
	client?: MongoClientOptions
}

export class MongoModule_Class
	extends Module<Config> {
	private mongo!: MongoClient;
	private dbs: { [key: string]: Db } = {};

	constructor() {
		super("mongo");
	}

	private async connect() {
		const url = `mongodb://${this.config.host}:${this.config.port}`;
		return this.mongo = await new MongoClient(url, this.config.client || {
			useNewUrlParser: true,
			connectTimeoutMS: 30000,
			keepAliveInitialDelay: 30000,
			reconnectTries: 10,
			reconnectInterval: 5000
		}).connect();
	}

	public async getDatabase(dbName: string): Promise<Db> {
		if (!this.mongo)
			await this.connect();

		const mongoDb = this.mongo.db(dbName);
		this.dbs[dbName] = mongoDb;
		return mongoDb;
	}

	public async getCollection<T>(dbName: string, collectionName: string): Promise<Collection<T>> {
		let db = this.dbs[dbName];
		if (!db)
			db = await this.getDatabase(dbName);

		return db.collection(collectionName);
	}

	async terminate() {
		if (!this.mongo)
			return;

		await this.mongo.close(true);
		this.logInfo("Mongo connection terminated");
	}
}

export const MongoModule = new MongoModule_Class();
