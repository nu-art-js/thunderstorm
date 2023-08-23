"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditableDBItem = void 0;
const frontend_1 = require("@nu-art/thunderstorm/frontend");
/**
 * A utility class for editing any item of type T that can be stored in a database.
 * This class extends EditableItem and adds functionality related to database operations.
 *
 * @template T The type of the item that extends DB_Object.
 * @template Ks The keys of the T type. Default is '_id'.
 */
class EditableDBItem extends frontend_1.EditableItem {
    /**
     * Constructs an EditableDBItem instance.
     *
     * @param item The item to be edited.
     * @param module The module for database operations.
     * @param onCompleted The function to be called when the operation is completed.
     * @param onError The function to be called when an error occurs.
     */
    constructor(item, module, onCompleted, onError) {
        super(item, EditableDBItem.save(module, onCompleted, onError), (_item) => module.v1.delete(_item).executeSync());
    }
    static save(module, onCompleted, onError) {
        return async (_item) => {
            try {
                const dbItem = await module.v1.upsert(_item).executeSync();
                await (onCompleted === null || onCompleted === void 0 ? void 0 : onCompleted(dbItem));
            }
            catch (e) {
                await (onError === null || onError === void 0 ? void 0 : onError(e));
            }
        };
    }
    /**
     * Create a new instance of EditableDBItem with the same properties and behaviors as the current instance.
     *
     * @param item The item of the new instance.
     * @returns The new instance.
     */
    clone(item) {
        return super.clone(item);
    }
}
exports.EditableDBItem = EditableDBItem;
//# sourceMappingURL=EditableDBItem.js.map