import {DB_Prototype} from '@nu-art/db-api-shared';
import {DB_EntityDependencyV2} from '@nu-art/firebase-shared';
import {
	CollectionReference,
	DocumentData,
	DocumentReference,
	Firestore,
	Query,
	QueryDocumentSnapshot,
} from 'firebase-admin/firestore';

export type FirestoreType_Collection = CollectionReference;
export type FirestoreType_DocumentSnapshot<T = DocumentData> = QueryDocumentSnapshot<T>;
export type FirestoreType_Query = Query;
export type FirestoreType_DocumentReference<T> = DocumentReference<T>;
export type FirestoreType = Firestore;

export type CanDeleteDBEntitiesProto = {
	__canDeleteEntitiesProto: <T extends DB_Prototype>(type: T['dbKey'], itemIds: string[]) => Promise<DB_EntityDependencyV2>
}