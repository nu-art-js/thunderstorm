import {ModuleBE_Firebase} from '../../../main/backend';


describe('Sss', () => {
		const db = ModuleBE_Firebase.createAdminSession().getDatabase();
		if (clean) {
			const config = await db.get('/_config');
			await db.delete('/', '/');
			config && await db.set('/_config', config);
		}
	}
);