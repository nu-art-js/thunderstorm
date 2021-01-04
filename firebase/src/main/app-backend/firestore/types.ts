/*
 * Firebase is a simpler Typescript wrapper to all of firebase services.
 *
 * Copyright (C) 2020 Intuition Robotics
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

import * as admin from "firebase-admin";

export type FirestoreType_Collection = admin.firestore.CollectionReference ;
export type FirestoreType_DocumentSnapshot = admin.firestore.QueryDocumentSnapshot ;
export type FirestoreType_Query = admin.firestore.Query;
export type FirestoreType_DocumentReference = admin.firestore.DocumentReference ;
export type FirestoreType = admin.firestore.Firestore ;
export type FirestoreType_Transaction = admin.firestore.Transaction;

// export type FirestoreType_Collection = admin.firestore.CollectionReference | firebase.firestore.CollectionReference;
// export type FirestoreType_DocumentSnapshot = admin.firestore.QueryDocumentSnapshot | firebase.firestore.QueryDocumentSnapshot;
// export type FirestoreType_Query = (admin.firestore.Query | firebase.firestore.Query) & { select?: (...field: string[]) => FirestoreType_Query };
// export type FirestoreType_DocumentReference = admin.firestore.DocumentReference | firebase.firestore.DocumentReference;
// export type FirestoreType = (admin.firestore.Firestore | firebase.firestore.Firestore) & ({ listCollections?: () => Promise<FirestoreType_Collection[]> });
// export type FirestoreType_Transaction = admin.firestore.Transaction | firebase.firestore.Transaction;
//
