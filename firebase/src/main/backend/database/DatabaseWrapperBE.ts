/*
 * Firebase is a simpler Typescript wrapper to all of firebase services.
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

// import {FirestoreCollection} from "./FirestoreCollection";
import {Firebase_DataSnapshot, Firebase_DB, FirebaseListener} from './types';
import {BadImplementationException, calculateJsonSizeMb, TS_Object} from '@nu-art/ts-common';
import {FirebaseSession} from '../auth/firebase-session';
import {FirebaseBaseWrapper} from '../auth/FirebaseBaseWrapper';
import {getDatabase} from 'firebase-admin/database';
import firebase from 'firebase/compat';
import TransactionResult = firebase.database.TransactionResult;

/**
 * simplified interface for interacting with  Firebase
 */
export class DatabaseWrapperBE
    extends FirebaseBaseWrapper {

    private readonly database: Firebase_DB;

    constructor(firebaseSession: FirebaseSession<any>) {
        super(firebaseSession);
        this.database = getDatabase(firebaseSession.app);
    }

    public async get<T>(path: string, defaultValue?: T): Promise<T> {
        const snapshot = await this.database.ref(path).once('value');
        let toRet = defaultValue;
        if (snapshot)
            toRet = snapshot.val() as T;

        if (!toRet)
            toRet = defaultValue;

        return toRet as T;
    }

    public listen<T>(path: string, callback: (value?: T) => void): FirebaseListener {
        try {
            return this.database.ref(path).on('value', (snapshot: Firebase_DataSnapshot) => callback(snapshot ? snapshot.val() : undefined));
        } catch (e: any) {
            throw new BadImplementationException(`Error while getting value from path: ${path}`, e);
        }
    }

    public stopListening<T>(path: string, listener: FirebaseListener): void {
        try {
            this.database.ref(path).off('value', listener);
        } catch (e: any) {
            throw new BadImplementationException(`Error while getting value from path: ${path}`, e);
        }
    }

    public async set<T>(path: string, value: T) {
        try {
            return await this.database.ref(path).set(value);
        } catch (e: any) {
            throw new BadImplementationException(`Error while setting value to path: ${path}`, e);
        }
    }

    public async uploadByChunks(parentPath: string, data: TS_Object, maxSizeMB: number = 3, itemsToRef: Promise<any>[] = []) {
        for (const key in data) {
            const node = `${parentPath}/${key}`;
            if (calculateJsonSizeMb(data[key]) < maxSizeMB)
                await this.set(node, data[key]);
            else
                await this.uploadByChunks(node, data[key], maxSizeMB, itemsToRef);
        }
    }

    public async update<T>(path: string, value: T) {
        this.logWarning('update will be deprecated!! please use patch');
        return this.patch<T>(path, value);
    }

    public async patch<T>(path: string, value: Partial<T>) {
        try {
            return await this.database.ref(path).update(value);
        } catch (e: any) {
            this.logError(e);
            throw new BadImplementationException(`Error while updating value to path: ${path}`, e);
        }
    }

    public async remove<T>(path: string, assertionRegexp: string = '^/.*?/.*') {
        this.logWarning('remove will be deprecated!! please use delete');
        return this.delete(path, assertionRegexp);
    }

    public async delete<T>(path: string, assertionRegexp: string = '^/.*?/.*') {
        if (!path)
            throw new BadImplementationException(`Falsy value, path: '${path}'`);

        if (!path.match(new RegExp(assertionRegexp)))
            throw new BadImplementationException(`path: '${path}'  does not match assertion: '${assertionRegexp}'`);

        try {
            return await this.database.ref(path).remove();
        } catch (e: any) {
            throw new BadImplementationException(`Error while removing path: ${path}`, e);
        }
    }

    public async transaction<T>(path: string, func: (currentValue: T) => T): Promise<TransactionResult> {
        return this.database.ref(path).transaction(func);
    }

    public ref<T>(path: string) {
        return new FirebaseRef<T>(this, path);
    }
}

/**
 * simplified interface for interacting with  Firebase
 */
export class FirebaseRef<T> {

    private readonly db: DatabaseWrapperBE;
    private readonly path: string;

    constructor(db: DatabaseWrapperBE, path: string) {
        this.db = db;
        this.path = path;
    }

    public get(defaultValue?: T) {
        return this.db.get(this.path, defaultValue);
    }

    public set(value: T) {
        return this.db.set<T>(this.path, value);
    }

    /**
     * Updates the specified path in the database with the provided partial value.
     * @param value
     */
    public patch(value: Partial<T>) {
        return this.db.patch<T>(this.path, value);
    }

    /**
     * Deletes the specified path in the database, subject to the provided assertion regular expression.
     * @param assertionRegexp
     */
    public delete(assertionRegexp: string = '^/.*?/.*') {
        return this.db.delete<T>(this.path, assertionRegexp);
    }

    /**
     * Listens for changes at the specified path in the database and invokes the provided callback with the new value.
     * @param callback
     */
    public listen(callback: (value?: T) => void) {
        return this.db.listen<T>(this.path, callback);
    }

    /**
     * Stops listening for changes at the specified path in the database with the provided listener.
     * @param listener
     */
    public stopListening(listener: FirebaseListener): void {
        return this.db.stopListening<T>(this.path, listener);
    }

    /**
     * Executes a transaction at the specified path in the database, using the provided function to update the current value.
     * @param func
     */
    public async transaction(func: (currentValue: T) => T) {
        return this.db.transaction(this.path, func);
    }

    /**
     * Uploads a large object to the specified path in the database in chunks, with a maximum chunk size specified in MB.
     * @param value
     * @param maxSizeMB
     * @param itemsToRef
     */
    public async uploadByChunks(value: TS_Object, maxSizeMB: number = 3, itemsToRef: Promise<any>[] = []) {
        return this.db.uploadByChunks(this.path, value, maxSizeMB, itemsToRef);
    }
}
