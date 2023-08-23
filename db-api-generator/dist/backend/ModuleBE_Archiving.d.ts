import { DB_Object } from '@nu-art/ts-common';
import { RequestBody_HardDeleteUnique, RequestQuery_DeleteAll, RequestQuery_GetHistory } from '../shared/archiving/apis';
import { ModuleBE_BaseDBV2 } from './ModuleBE_BaseDBV2';
import { ModuleBE_FirestoreListener } from '@nu-art/firebase/backend';
type Params = {
    collectionName: string;
    docId: string;
};
export declare const Const_ArchivedCollectionPath = "/_archived";
/**
 * This class extends FirestoreFunctionModule and handles Firestore database operations
 * with custom logic for archiving and Time-To-Live (TTL) functionality.
 */
export declare class ModuleBE_ArchiveModule_Class<DBType extends DB_Object> extends ModuleBE_FirestoreListener<DBType> {
    private readonly TTL;
    private readonly lastUpdatedTTL;
    protected readonly moduleMapper: {
        [key: string]: ModuleBE_BaseDBV2<DBType>;
    };
    /**
     * Constructor initializes TTL, lastUpdatedTTL moduleMapper and sets api routes for the module.
     */
    constructor();
    /**
     * Initializes the `moduleMapper` by populating it with Firestore collections.
     * Iterates through all modules obtained from the Storm instance and adds modules
     * which are Firestore DB modules to the `moduleMapper`.
     */
    protected init(): void;
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
    hardDeleteUnique: (body: RequestBody_HardDeleteUnique) => Promise<void>;
    /**
     * Deletes all documents in the specified collection.
     * This function first retrieves all documents in the collection.
     * It then deletes each document in the collection in parallel chunks for efficiency.
     *
     * @param queryParams - Params includes the name of the collection in which the documents will be deleted.
     * @returns - A promise that performs the deletion operation.
     * @throws - A BadImplementationException if no corresponding module is found for the given collection.
     */
    hardDeleteAll: (queryParams: RequestQuery_DeleteAll) => Promise<void>;
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
    getDocumentHistory: (queryParams: RequestQuery_GetHistory) => Promise<DBType[]>;
    /**
     * Checks if the Time-To-Live (TTL) for a document instance has been exceeded.
     *
     * @param instance - The document instance to check.
     * @param dbModule - The Firestore database module the document belongs to.
     * @returns - A boolean indicating whether the TTL has been exceeded (true) or not (false).
     */
    private checkTTL;
    /**
     * Checks if the `lastUpdatedTTL` for a document instance has been exceeded.
     * This represents a secondary TTL which is based on the last update time of the document.
     *
     * @param instance - The document instance to check.
     * @param dbModule - The Firestore database module the document belongs to.
     * @returns - A boolean indicating whether the `lastUpdatedTTL` has been exceeded (true) or not (false).
     */
    private checkLastUpdatedTTL;
    /**
     * Inserts a document into the '_archived' sub-collection.
     * This function is used for archiving the previous state of the document before it was changed.
     *
     * @param dbModule - The Firestore database module the document belongs to.
     * @param before - The state of the document before changes.
     * @returns - A promise that performs the archiving operation or undefined in case of an error.
     */
    private insertToArchive;
    /**
     * Hard deletes a document and its associated archived documents.
     *
     * @param instance - The instance of the document to delete.
     * @param dbModule - The Firestore database module the document belongs to.
     * @returns - A promise to perform the deletion operation.
     */
    private hardDeleteDoc;
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
    processChanges(params: Params, before: DBType | undefined, after: DBType | undefined): Promise<void | FirebaseFirestore.WriteResult[]>;
}
export declare const ModuleBE_Archiving: ModuleBE_ArchiveModule_Class<DB_Object>;
export {};
