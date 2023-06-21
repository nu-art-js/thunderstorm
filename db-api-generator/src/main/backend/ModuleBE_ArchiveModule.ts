import {FirestoreFunctionModule} from '@nu-art/firebase/backend';
import {batchActionParallel, currentTimeMillis, Day, DB_Object, deepClone, generateHex, Hour, removeDBObjectKeys} from '@nu-art/ts-common';
import {dbIdLength} from '../shared';
import {Storm} from '@nu-art/thunderstorm/backend';
import {ModuleBE_BaseDB} from './ModuleBE_BaseDB';

type Params = { collectionName: string, docId: string }

export const Const_ArchivedCollectionPath = '/_archived';

/**
 * This class extends FirestoreFunctionModule and handles Firestore database operations
 * with custom logic for archiving and Time-To-Live (TTL) functionality.
 */
export class ModuleBE_ArchiveModule_Class<DBType extends DB_Object>
	extends FirestoreFunctionModule<DBType> {
	private readonly TTL: number; // Time to live for each instance
	private readonly lastUpdatedTTL: number; // Time to live after last update
	private readonly moduleMapper: { [key: string]: ModuleBE_BaseDB<DBType> }; // Module mapper, mapping collection name to module

	/**
	 * Constructor initializes TTL, lastUpdatedTTL and moduleMapper.
	 */
	constructor() {
		super('{collectionName}');

		this.moduleMapper = {};
		this.lastUpdatedTTL = Day; // Default TTL for last updated is one day
		this.TTL = Hour * 2; // Default TTL is two hours
	}

	/**
	 * Initializes the `moduleMapper` by populating it with Firestore collections.
	 * Iterates through all modules obtained from the Storm instance and adds modules
	 * which are Firestore DB modules to the `moduleMapper`.
	 */
	protected init() {
		const modules = Storm.getInstance().filterModules(module => !!module);

		modules.map(module => {
			const dbModule = module as ModuleBE_BaseDB<DBType>;

			if (dbModule && dbModule.collection && dbModule.collection.name)
				// If this module is a Firestore DB module, add it to the mapper
				this.moduleMapper[dbModule.collection.name] = dbModule;
		});
	}

	/**
	 * Checks if the Time-To-Live (TTL) for a document instance has been exceeded.
	 *
	 * @param instance - The document instance to check.
	 * @param dbModule - The Firestore database module the document belongs to.
	 * @returns - A boolean indicating whether the TTL has been exceeded (true) or not (false).
	 */
	private checkTTL(instance: DBType, dbModule: ModuleBE_BaseDB<DBType>) {
		const timestamp = currentTimeMillis();
		const TTL = dbModule.dbDef.TTL || this.TTL;

		// If TTL is not set or the document is not updated, return false
		if (TTL === -1 || !instance.__updated)
			return false;

		// Check if the current time is past the document's TTL
		return timestamp > (instance.__updated + TTL);
	}

	/**
	 * Checks if the `lastUpdatedTTL` for a document instance has been exceeded.
	 * This represents a secondary TTL which is based on the last update time of the document.
	 *
	 * @param instance - The document instance to check.
	 * @param dbModule - The Firestore database module the document belongs to.
	 * @returns - A boolean indicating whether the `lastUpdatedTTL` has been exceeded (true) or not (false).
	 */
	private checkLastUpdatedTTL(instance: DBType, dbModule: ModuleBE_BaseDB<DBType>) {
		const timestamp = currentTimeMillis();
		const lastUpdatedTTL = dbModule.dbDef.lastUpdatedTTL || this.lastUpdatedTTL;

		// If lastUpdatedTTL is not set or the document is not updated, return false
		if (lastUpdatedTTL === -1 || !instance.__updated)
			return false;

		// Check if the current time is past the document's lastUpdatedTTL
		return timestamp > (instance.__updated + lastUpdatedTTL);
	}


	/**
	 * Inserts a document into the '_archived' subcollection.
	 * This function is used for archiving the previous state of the document before it was changed.
	 *
	 * @param dbModule - The Firestore database module the document belongs to.
	 * @param before - The state of the document before changes.
	 * @returns - A promise that performs the archiving operation or undefined in case of an error.
	 */
	private async insertToArchive(dbModule: ModuleBE_BaseDB<DBType>, before: DBType) {
		if (before.__hardDelete)
			return;

		try {
			// Reference to the original collection
			const collectionRef = dbModule.collection.collection;
			const timestamp = currentTimeMillis();

			// Deep clone the document before mutation
			let dbInstance = deepClone(before);

			// Reference to the _archived subcollection
			const subCollection = collectionRef.doc(dbInstance._id).collection(Const_ArchivedCollectionPath);

			// Remove the keys from the original object that shouldn't be in the archive
			dbInstance = removeDBObjectKeys(dbInstance) as DBType;

			// Record the original document ID
			dbInstance._originDocId = before._id;

			// Generate a new ID for the archived document
			dbInstance._id = generateHex(dbIdLength);
			dbInstance.__updated = timestamp;
			dbInstance.__created = timestamp;

			// Insert the archived document into the _archived subcollection
			await subCollection.doc(dbInstance._id).set(dbInstance);
		} catch (err) {
			return undefined;
		}
	}


	/**
	 * Hard deletes a document and its associated archived documents.
	 *
	 * @param instance - The instance of the document to delete.
	 * @param dbModule - The Firestore database module the document belongs to.
	 * @returns - A promise to perform the deletion operation.
	 */
	private async hardDeleteDoc(instance: DBType, dbModule: ModuleBE_BaseDB<DBType>) {
		// Get reference to the collection the document belongs to
		const collectionRef = dbModule.collection.collection;
		// Get reference to the document instance to delete
		const instanceRef = collectionRef.doc(instance._id);
		// Get reference to the archived documents collection associated with the document instance
		const archivedCollectionRef = instanceRef.collection(Const_ArchivedCollectionPath);

		// Get all archived documents
		const archivedDocs = await archivedCollectionRef.listDocuments();
		// Delete the document instance
		await instanceRef.delete();

		// Delete all archived documents associated with the document instance, performing the delete operation in chunks of 10
		return batchActionParallel(archivedDocs, 10, (docChunk) => Promise.all(docChunk.map(async doc => {
			await doc.set({__hardDelete: true}, {merge: true});
			return doc.delete();
		})));
	}

	/**
	 * Processes changes in the Firestore collection.
	 * Depending on the state of the documents, it either archives the documents,
	 * checks the Time-To-Live (TTL) or performs a hard delete operation.
	 *
	 * @param params - An object containing the collectionName and the document ID.
	 * @param before - The state of the document before changes.
	 * @param after - The state of the document after changes.
	 * @returns - A promise that performs the necessary operation based on the document states.
	 */
	async processChanges(params: Params, before: DBType | undefined, after: DBType | undefined) {
		// Get the relevant module
		const dbModule = this.moduleMapper[params.collectionName];

		// If there's no previous document state or it's marked for hard deletion, exit the function
		if (!before)
			return;

		// If the document was deleted, archive the original document
		if (!after)
			return this.insertToArchive(dbModule, before);

		// If the document is marked for hard deletion, delete the document
		if (after.__hardDelete)
			return this.hardDeleteDoc(before, dbModule);

		// If the document's TTL has been exceeded, archive the original document
		if (this.checkTTL(before, dbModule))
			return this.insertToArchive(dbModule, before);

		// If the document's lastUpdatedTTL has been exceeded, archive the original document
		if (this.checkLastUpdatedTTL(before, dbModule))
			return this.insertToArchive(dbModule, before);
	}
}

export const ModuleBE_ArchiveModule = new ModuleBE_ArchiveModule_Class();
