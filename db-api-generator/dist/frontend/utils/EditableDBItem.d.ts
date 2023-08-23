import { EditableItem } from '@nu-art/thunderstorm/frontend';
import { DB_Object, Default_UniqueKey, PreDB } from '@nu-art/ts-common';
import { ModuleFE_BaseApi } from '../modules/ModuleFE_BaseApi';
/**
 * A utility class for editing any item of type T that can be stored in a database.
 * This class extends EditableItem and adds functionality related to database operations.
 *
 * @template T The type of the item that extends DB_Object.
 * @template Ks The keys of the T type. Default is '_id'.
 */
export declare class EditableDBItem<T extends DB_Object, Ks extends keyof PreDB<T> = Default_UniqueKey> extends EditableItem<T> {
    /**
     * Constructs an EditableDBItem instance.
     *
     * @param item The item to be edited.
     * @param module The module for database operations.
     * @param onCompleted The function to be called when the operation is completed.
     * @param onError The function to be called when an error occurs.
     */
    constructor(item: Partial<T>, module: ModuleFE_BaseApi<T, Ks>, onCompleted?: (item: T) => any | Promise<any>, onError?: (err: Error) => any | Promise<any>);
    private static save;
    /**
     * Create a new instance of EditableDBItem with the same properties and behaviors as the current instance.
     *
     * @param item The item of the new instance.
     * @returns The new instance.
     */
    clone(item?: T): EditableDBItem<T>;
}
