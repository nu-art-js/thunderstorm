import {Module} from "@nu-art/ts-common";
import {
    DB_BugReport,
    Paths
} from "../../shared/api";

type Config = {
    projectId: string
    bucket?: string,
}

import {
    FirebaseModule,
    FirestoreCollection,
    StorageWrapper
} from "@nu-art/firebase/backend";

export class AdminBRModule_Class
    extends Module<Config> {

    bugReport!: FirestoreCollection<DB_BugReport>;
    private storage!: StorageWrapper;

    protected init(): void {
        const sessAdmin = FirebaseModule.createAdminSession();
        const firestore = sessAdmin.getFirestore();
        this.bugReport = firestore.getCollection<DB_BugReport>('bug-report',['_id']);
        this.storage = sessAdmin.getStorage();
    }

    getFilesFirebase = async () => this.bugReport.getAll();

    downloadFiles = async (path: Paths) => {
        const bucket = await this.storage.getOrCreateBucket(this.config?.bucket);
        const file = await bucket.getFile(path.path);
        return file.getReadSecuredUrl("application/zip", 600000);
    }
}

export const AdminBRModule = new AdminBRModule_Class();