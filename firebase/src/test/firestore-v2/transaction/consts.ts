import {
	CollectionTest,
	firestore,
	id_inner1,
	id_inner2,
	id_inner3,
	id_inner4,
	id_outer1,
	innerQueryCollection,
	outerQueryCollection
} from '../_core/consts';
import {expect} from 'chai';
import {compare, currentTimeMillis, exists, filterInstances} from '@nu-art/ts-common';
import {DB_Type_Complex} from '../_core/types';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';


const transaction_addInner4 = (collectionOuter: FirestoreCollectionV2<DB_Type_Complex>, now: number) => {
	return firestore.firestore.runTransaction(async (transaction) => {
		console.log(`pah1 ${currentTimeMillis() - now}`);

		const outerItem = await collectionOuter.query.unique(id_outer1, transaction);
		expect(true).to.eql(exists(outerItem));

		outerItem.refs.push(id_inner4);

		await collectionOuter.update.item(outerItem, transaction);
		console.log(`zevel1 ${currentTimeMillis() - now}`);
	});
};
const transaction_removeInner2 = (collectionOuter: FirestoreCollectionV2<DB_Type_Complex>, now: number) => {
	return firestore.firestore.runTransaction(async (transaction) => {
		console.log(`pah2 ${currentTimeMillis() - now}`);

		const outerItem = await collectionOuter.query.unique(id_outer1, transaction);
		expect(true).to.eql(exists(outerItem));

		outerItem.refs = outerItem.refs.filter(id => id !== id_inner2);

		await collectionOuter.update.item(outerItem, transaction);
		console.log(`zevel2 ${currentTimeMillis() - now}`);
	});

};
const transaction_removeInner3 = (collectionOuter: FirestoreCollectionV2<DB_Type_Complex>, now: number) => {
	return firestore.firestore.runTransaction(async (transaction) => {
		console.log(`pah3 ${currentTimeMillis() - now}`);

		const outerItem = await collectionOuter.query.unique(id_outer1, transaction);
		expect(true).to.eql(exists(outerItem));

		outerItem.refs = outerItem.refs.filter(id => id !== id_inner3);

		await collectionOuter.update.item(outerItem, transaction);

		console.log(`zevel3 ${currentTimeMillis() - now}`);
	});
};


export const transactionTestCases: CollectionTest['testcases'] = []
export const transactionTestCases1: CollectionTest['testcases'] = [
	{
		description: 'transaction update',
		result: [],
		input: {
			outerCollection: outerQueryCollection,
			innerCollection: innerQueryCollection,
			check: async (collectionOuter, collectionInner) => {
				const originalReferencedInnerItems = await collectionInner.query.custom({where: {parentId: id_outer1}});
				expect(originalReferencedInnerItems.length).to.eql(5); // we know there are 5 items

				await firestore.firestore.runTransaction(async (transaction) => {
					const outerItem = await collectionOuter.query.unique(id_outer1);

					expect(true).to.eql(exists(outerItem));

					const toUpdateInnerItems = filterInstances(await collectionInner.query.all(outerItem.refs));
					expect(toUpdateInnerItems.length).to.eql(3);

					toUpdateInnerItems.forEach(item => item.parentId = id_outer1);
					await collectionInner.update.all(toUpdateInnerItems);
				});
				const updatedReferencedInnerItems = await collectionInner.query.custom({where: {parentId: id_outer1}});
				expect(updatedReferencedInnerItems.length).to.eql(6); // out of the 3 inner items updated in the transaction, 2 already had the parentId.
			}
		}
	}, {
		description: 'transaction promise.all',
		result: [],
		input: {
			outerCollection: outerQueryCollection,
			innerCollection: innerQueryCollection,
			check: async (collectionOuter, collectionInner) => {
				const now = currentTimeMillis();
				await Promise.all([
					transaction_addInner4(collectionOuter, now),
					transaction_removeInner2(collectionOuter, now),
				]);

				const outerItem = await collectionOuter.query.unique(id_outer1);
				expect(true).to.eql(compare(outerItem.refs.sort(), [id_inner1, id_inner3, id_inner4].sort()));
			}
		}
	},
	{
		description: 'transaction promise.all2',
		result: [],
		input: {
			outerCollection: outerQueryCollection,
			innerCollection: innerQueryCollection,
			check: async (collectionOuter, collectionInner) => {
				const now = currentTimeMillis();
				await Promise.all([
					transaction_addInner4(collectionOuter, now),
					transaction_removeInner2(collectionOuter, now),
					transaction_removeInner3(collectionOuter, now),

				]);

				const outerItem = await collectionOuter.query.unique(id_outer1);
				expect(true).to.eql(compare(outerItem.refs.sort(), [id_inner1, id_inner4].sort()));
			}
		}
	},
	{
		description: 'transaction promise.all on two ',
		result: [],
		input: {
			outerCollection: outerQueryCollection,
			innerCollection: innerQueryCollection,
			check: async (collectionOuter, collectionInner) => {
				const now = currentTimeMillis();
				await Promise.all([
					transaction_addInner4(collectionOuter, now),
					transaction_removeInner2(collectionOuter, now),
					transaction_removeInner3(collectionOuter, now),

				]);

				const outerItem = await collectionOuter.query.unique(id_outer1);
				expect(true).to.eql(compare(outerItem.refs.sort(), [id_inner1, id_inner4].sort()));
			}
		}
	}
];