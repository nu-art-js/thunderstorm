/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
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

import {BaseDB_ModuleBE} from '@nu-art/db-api-generator/backend';
import {FirestoreTransaction} from '@nu-art/firebase/backend';
import {ApiException, ExpressRequest} from '@nu-art/thunderstorm/backend';
import {auditBy, filterDuplicates, MUSTNeverHappenException} from '@nu-art/ts-common';
import {ModuleBE_Account} from '@nu-art/user-account/backend';
import {DB_PermissionAccessLevel, DBDef_PermissionAccessLevel, Request_CreateGroup} from '../../shared';
import {Clause_Where} from '@nu-art/firebase';
import {ModuleBE_PermissionDomain} from './ModuleBE_PermissionDomain';
import {ModuleBE_PermissionApi} from './ModuleBE_PermissionApi';
import {ModuleBE_PermissionGroup} from '../assignment/ModuleBE_PermissionGroup';


export class ModuleBE_PermissionAccessLevel_Class
    extends BaseDB_ModuleBE<DB_PermissionAccessLevel> {

    constructor() {
        // super(CollectionName_Level, LevelDB_Class._validator, 'level');
        super(DBDef_PermissionAccessLevel);
    }

    protected internalFilter(item: DB_PermissionAccessLevel): Clause_Where<DB_PermissionAccessLevel>[] {
        const {domainId, name, value} = item;
        return [{domainId, name}, {domainId, value}];
    }

    protected async preUpsertProcessing(dbInstance: DB_PermissionAccessLevel, t?: FirestoreTransaction, request?: ExpressRequest) {
        await ModuleBE_PermissionDomain.queryUnique({_id: dbInstance.domainId});

        if (request) {
            const account = await ModuleBE_Account.validateSession({}, request);
            dbInstance._audit = auditBy(account.email);
        }
    }

    protected async upsertImpl_Read(transaction: FirestoreTransaction, dbInstance: DB_PermissionAccessLevel, request: ExpressRequest): Promise<() => Promise<DB_PermissionAccessLevel>> {
        const existDbLevel = await transaction.queryUnique(this.collection, {where: {_id: dbInstance._id}});
        const groups = await ModuleBE_PermissionGroup.query({where: {accessLevelIds: {$ac: dbInstance._id}}});
        const returnWrite = await super.upsertImpl_Read(transaction, dbInstance, request);
        if (existDbLevel) {
            const callbackfn = (group: Request_CreateGroup) => {
                const index = group.accessLevelIds?.indexOf(dbInstance._id);
                if (index === undefined)
                    throw new MUSTNeverHappenException('Query said it does exists!!');

                const accessLevel = group.__accessLevels?.[index];
                if (accessLevel === undefined)
                    throw new MUSTNeverHappenException('Query said it does exists!!');

                accessLevel.value = dbInstance.value;
            };

            const asyncs = [];
            asyncs.push(...groups.map(async group => {
                await ModuleBE_PermissionGroup.validateImpl(group);
                await ModuleBE_PermissionGroup.assertUniqueness(group, transaction);
                callbackfn(group);
            }));

            const upsertGroups = await transaction.upsertAll_Read(ModuleBE_PermissionGroup.collection, groups);
            await Promise.all(asyncs);

            // --- writes part
            await upsertGroups();
        }

        return returnWrite;
    }

    protected async assertDeletion(transaction: FirestoreTransaction, dbInstance: DB_PermissionAccessLevel) {
        const groups = await ModuleBE_PermissionGroup.query({where: {accessLevelIds: {$ac: dbInstance._id}}});
        const apis = await ModuleBE_PermissionApi.query({where: {accessLevelIds: {$ac: dbInstance._id}}});

        if (groups.length || apis.length)
            throw new ApiException(403, 'You trying delete access level that associated with users/groups/apis, you need delete the associations first');
    }

    setUpdatedLevel(dbLevel: DB_PermissionAccessLevel, units: Request_CreateGroup[]) {
        units.forEach(unit => {
            let hasGroupDomainLevel = false;
            const updatedLevels = unit.__accessLevels?.map(level => {
                if (level.domainId === dbLevel.domainId) {
                    level.value = dbLevel.value;
                    hasGroupDomainLevel = true;
                }
                return level;
            }) || [];

            if (!hasGroupDomainLevel) {
                updatedLevels.push({domainId: dbLevel.domainId, value: dbLevel.value});
            }

            unit.__accessLevels = updatedLevels;
        });
    }
}

export function checkDuplicateLevelsDomain(levels: DB_PermissionAccessLevel[]) {
    const domainIds = levels.map(level => level.domainId);
    const filteredDomainIds = filterDuplicates(domainIds);
    if (filteredDomainIds.length !== domainIds.length)
        throw new ApiException(422, 'You trying test-add-data duplicate accessLevel with the same domain');
}

export const ModuleBE_PermissionAccessLevel = new ModuleBE_PermissionAccessLevel_Class();
