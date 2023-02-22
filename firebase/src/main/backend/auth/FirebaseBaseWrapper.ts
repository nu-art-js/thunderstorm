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

import {FirebaseSession} from './firebase-session';
import {Logger} from '@nu-art/ts-common';

/**
 * base wrapper
 */
export abstract class FirebaseBaseWrapper
    extends Logger {

    public readonly firebaseSession: FirebaseSession<any>;

    /**
     * Constructor that takes a FirebaseSession object and assigns it to this.firebaseSession.
     * @param firebaseSession
     * @protected
     */
    protected constructor(firebaseSession: FirebaseSession<any>) {
        super();
        this.firebaseSession = firebaseSession;
    }

    /**
     * Returns true if the user associated with this FirebaseSession is an admin, false otherwise.
     */
    isAdmin() {
        return this.firebaseSession.isAdmin();
    }
}