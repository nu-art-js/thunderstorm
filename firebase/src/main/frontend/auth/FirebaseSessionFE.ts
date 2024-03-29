/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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

/**
 * Created by tacb0ss on 19/09/2018.
 */
import {Logger, ThisShouldNotHappenException} from '@nu-art/ts-common';
import {FirebaseConfig} from '../../index';
import {MessagingWrapperFE} from '../messaging/MessagingWrapperFE';
import {AnalyticsWrapperFE} from '../analytics/AnalyticsWrapperFE';
import {DatabaseWrapperFE} from '../database/DatabaseWrapperFE';
import {getAuth, signInWithCustomToken, signOut} from 'firebase/auth';
import {FirebaseApp, initializeApp} from 'firebase/app';

// import auth = firebase.auth;

export class FirebaseSessionFE
    extends Logger {
    app!: FirebaseApp;

    protected config: FirebaseConfig;
    protected sessionName: string;
    protected messaging?: MessagingWrapperFE;
    protected analytics?: AnalyticsWrapperFE;
    protected database?: DatabaseWrapperFE;

    constructor(sessionName: string, config: FirebaseConfig) {
        super(`firebase: ${sessionName}`);
        this.sessionName = sessionName;
        this.config = config;
    }

    public connect(): void {
        this.app = initializeApp(this.config, this.sessionName);
    }

    /**
     * Returns an instance of the MessagingWrapperFE class if it exists, or creates and returns a new instance if it does not
     */
    getMessaging() {
        if (this.messaging)
            return this.messaging;

        return this.messaging = new MessagingWrapperFE(this.app);
    }

    /**
     * Returns an instance of the AnalyticsWrapperFE class if it exists, or creates and returns a new instance if it does not
     */
    getAnalytics() {
        if (this.analytics)
            return this.analytics;

        return this.analytics = new AnalyticsWrapperFE(this.app);
    }

    /**
     * Returns an instance of the DatabaseWrapperFE class if it exists, or creates and returns a new instance if it does not
     */
    getDatabase() {
        if (this.database)
            return this.database;

        return this.database = new DatabaseWrapperFE(this.app);
    }

    /**
     * Authenticates the user with the given token
     * @param token
     */
    async signInWithToken(token: string) {
        return signInWithCustomToken(getAuth(this.app), token);
    }

    /**
     * Signs out the currently authenticated user
     */
    async signOut() {
        return signOut(getAuth(this.app));
    }

    getProjectId(): string {
        if (!this.config)
            throw new ThisShouldNotHappenException('Missing config. Probably init not resolved yet!');

        if (!this.config.projectId)
            throw new ThisShouldNotHappenException('Could not deduce project id from session config.. if you need the functionality.. add it to the config!!');

        return this.config.projectId;
    }
}

