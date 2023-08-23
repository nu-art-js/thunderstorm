"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleBE_Archiving = exports.ModuleBE_ArchiveModule_Class = exports.Const_ArchivedCollectionPath = void 0;
const ts_common_1 = require("@nu-art/ts-common");
const backend_1 = require("@nu-art/thunderstorm/backend");
const apis_1 = require("../shared/archiving/apis");
const shared_1 = require("../shared");
const backend_2 = require("@nu-art/firebase/backend");
exports.Const_ArchivedCollectionPath = '/_archived';
/**
 * This class extends FirestoreFunctionModule and handles Firestore database operations
 * with custom logic for archiving and Time-To-Live (TTL) functionality.
 */
class ModuleBE_ArchiveModule_Class extends backend_2.ModuleBE_FirestoreListener {
    /**
     * Constructor initializes TTL, lastUpdatedTTL moduleMapper and sets api routes for the module.
     */
    constructor() {
        super('{collectionName}');
        /**
         * Deletes a unique document by its ID in a Firestore transaction.
         * This method first retrieves the document with the given ID.
         * If the document is found, it is marked for deletion and an upsert operation is performed.
         * The upsert operation triggers a Firestore OnUpdate event, which will delete the document and its '_archived' sub-collection.
         *
         * @param body - An object of type `RequestBody_HardDeleteUnique` containing the following fields:
         *    - _id: The ID of the document to be deleted.
         *    - collectionName: The name of the collection the document belongs to.
         *    - dbInstance: (optional) The instance of the document. If not provided, the method will attempt to retrieve it using the given ID.
         * @returns - A promise that performs the deletion operation.
         * @throws - A `BadImplementationException` if no module is found for the given collection or if no document with the provided ID is found.
         */
        this.hardDeleteUnique = async (body) => {
            const { _id, collectionName, dbInstance } = body;
            const dbModule = this.moduleMapper[collectionName];
            if (!dbModule)
                throw new ts_common_1.BadImplementationException('no module found');
            return dbModule.runTransaction(async (transaction) => {
                var _a;
                const instance = (_a = dbInstance) !== null && _a !== void 0 ? _a : await dbModule.query.unique(_id, transaction);
                // queryUnique(dbModule.collection, {where: {_id} as Clause_Where<DBType>});
                if (!instance)
                    throw new ts_common_1.BadImplementationException(`couldn't find doc with id ${_id}`);
                //make sure trigger will delete object, and it's _archived collection
                instance.__hardDelete = true;
                await dbModule.set.item(instance, transaction);
            });
        };
        /**
         * Deletes all documents in the specified collection.
         * This function first retrieves all documents in the collection.
         * It then deletes each document in the collection in parallel chunks for efficiency.
         *
         * @param queryParams - Params includes the name of the collection in which the documents will be deleted.
         * @returns - A promise that performs the deletion operation.
         * @throws - A BadImplementationException if no corresponding module is found for the given collection.
         */
        this.hardDeleteAll = async (queryParams) => {
            const dbModule = this.moduleMapper[queryParams.collectionName];
            if (!dbModule)
                throw new ts_common_1.BadImplementationException('no module found');
            const collectionItems = await dbModule.query.custom(shared_1._EmptyQuery);
            await (0, ts_common_1.batchActionParallel)(collectionItems, 10, (chunk) => Promise.all(chunk.map(item => this.hardDeleteUnique({
                _id: item._id,
                collectionName: dbModule.collection.name,
                dbInstance: item
            }))));
        };
        /**
         * Asynchronously retrieves the document history from the '_archived' collection group.
         *
         * This function takes a RequestQuery_GetHistory object as a parameter, which contains the name of the collection
         * and the ID of the document for which the history should be retrieved.
         * It then finds the respective Firestore DB module for the provided collection.
         *
         * If no module is found for the given collection, a BadImplementationException is thrown.
         *
         * The function queries the '_archived' collection group where the '_originDocId' field matches the provided
         * document ID, and orders the results by the '__created' timestamp in descending order.
         * It then maps the document snapshots to their respective data, creating an array of DBType documents, which is returned.
         *
         * @param queryParams - The request query parameters containing the collection name and the document ID.
         * @returns - An array of DBType documents representing the history of the specified document.
         * @throws - A BadImplementationException if no module is found for the given collection.
         */
        this.getDocumentHistory = async (queryParams) => {
            const { collectionName, _id } = queryParams;
            const dbModule = this.moduleMapper[collectionName];
            if (!dbModule)
                throw new ts_common_1.BadImplementationException('no db module found');
            const collectionGroup = dbModule.collection.collection.firestore.collectionGroup('_archived');
            const query = collectionGroup.where('_originDocId', '==', _id).orderBy('__created', 'desc');
            const snapshot = await query.get();
            const docs = snapshot.docs.map(doc => doc.data());
            return docs.filter((doc) => !doc.__collectionName);
        };
        this.moduleMapper = {};
        this.lastUpdatedTTL = ts_common_1.Day; // Default TTL for last updated is one day
        this.TTL = ts_common_1.Hour * 2; // Default TTL is two hours
    }
    /**
     * Initializes the `moduleMapper` by populating it with Firestore collections.
     * Iterates through all modules obtained from the Storm instance and adds modules
     * which are Firestore DB modules to the `moduleMapper`.
     */
    init() {
        super.init();
        const modules = backend_1.Storm.getInstance().filterModules(module => !!module);
        modules.map(module => {
            const dbModule = module;
            if (dbModule && dbModule.dbDef && dbModule.dbDef.dbName)
                // If this module is a Firestore DB module, add it to the mapper
                this.moduleMapper[dbModule.dbDef.dbName] = dbModule;
        });
        (0, backend_1.addRoutes)([
            (0, backend_1.createBodyServerApi)(apis_1.ApiDef_Archiving.vv1.hardDeleteUnique, this.hardDeleteUnique),
            (0, backend_1.createQueryServerApi)(apis_1.ApiDef_Archiving.vv1.hardDeleteAll, this.hardDeleteAll),
            (0, backend_1.createQueryServerApi)(apis_1.ApiDef_Archiving.vv1.getDocumentHistory, this.getDocumentHistory)
        ]);
    }
    /**
     * Checks if the Time-To-Live (TTL) for a document instance has been exceeded.
     *
     * @param instance - The document instance to check.
     * @param dbModule - The Firestore database module the document belongs to.
     * @returns - A boolean indicating whether the TTL has been exceeded (true) or not (false).
     */
    checkTTL(instance, dbModule) {
        const timestamp = (0, ts_common_1.currentTimeMillis)();
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
    checkLastUpdatedTTL(instance, dbModule) {
        const timestamp = (0, ts_common_1.currentTimeMillis)();
        const lastUpdatedTTL = dbModule.dbDef.lastUpdatedTTL || this.lastUpdatedTTL;
        // If lastUpdatedTTL is not set or the document is not updated, return false
        if (lastUpdatedTTL === -1 || !instance.__updated)
            return false;
        // Check if the current time is past the document's lastUpdatedTTL
        return timestamp > (instance.__updated + lastUpdatedTTL);
    }
    /**
     * Inserts a document into the '_archived' sub-collection.
     * This function is used for archiving the previous state of the document before it was changed.
     *
     * @param dbModule - The Firestore database module the document belongs to.
     * @param before - The state of the document before changes.
     * @returns - A promise that performs the archiving operation or undefined in case of an error.
     */
    async insertToArchive(dbModule, before) {
        if (before.__hardDelete)
            return;
        // Reference to the original collection
        const collectionRef = dbModule.collection.collection;
        const timestamp = (0, ts_common_1.currentTimeMillis)();
        // Deep clone the document before mutation
        let dbInstance = (0, ts_common_1.deepClone)(before);
        // Reference to the _archived sub-collection
        const subCollection = collectionRef.doc(dbInstance._id).collection(exports.Const_ArchivedCollectionPath);
        // Remove the keys from the original object that shouldn't be in the archive
        dbInstance = (0, ts_common_1.removeDBObjectKeys)(dbInstance);
        // Record the original document ID
        dbInstance._originDocId = before._id;
        // Generate a new ID for the archived document
        dbInstance._id = (0, ts_common_1.generateHex)(ts_common_1.dbIdLength);
        dbInstance.__updated = timestamp;
        dbInstance.__created = timestamp;
        // Insert the archived document into the _archived sub-collection
        await subCollection.doc(dbInstance._id).set(dbInstance);
    }
    /**
     * Hard deletes a document and its associated archived documents.
     *
     * @param instance - The instance of the document to delete.
     * @param dbModule - The Firestore database module the document belongs to.
     * @returns - A promise to perform the deletion operation.
     */
    async hardDeleteDoc(instance, dbModule) {
        // Get reference to the collection the document belongs to
        const collectionRef = dbModule.collection.collection;
        // Get reference to the document instance to delete
        const instanceRef = collectionRef.doc(instance._id);
        // Get reference to the archived documents collection associated with the document instance
        const archivedCollectionRef = instanceRef.collection(exports.Const_ArchivedCollectionPath);
        // Get all archived documents
        const archivedDocs = await archivedCollectionRef.listDocuments();
        // Delete the document instance
        await instanceRef.delete();
        // Delete all archived documents associated with the document instance, performing the delete operation in chunks of 10
        return (0, ts_common_1.batchActionParallel)(archivedDocs, 10, (docChunk) => Promise.all(docChunk.map(async (doc) => {
            await doc.set({ __hardDelete: true }, { merge: true });
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
    async processChanges(params, before, after) {
        // Get the relevant module
        const dbModule = this.moduleMapper[params.collectionName];
        if (!dbModule)
            throw new ts_common_1.BadImplementationException('no db module found');
        // If there's no previous document state, or it's marked for hard deletion, exit the function
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
exports.ModuleBE_ArchiveModule_Class = ModuleBE_ArchiveModule_Class;
exports.ModuleBE_Archiving = new ModuleBE_ArchiveModule_Class();
//# sourceMappingURL=ModuleBE_Archiving.js.map