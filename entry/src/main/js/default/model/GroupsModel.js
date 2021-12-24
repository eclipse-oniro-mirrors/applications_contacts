/**
 * @file: 群组model
 */
/**
 * Copyright (c) 2021 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http:// www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import LOG from '../utils/ContactsLog.js';
import CONSTANTS from '../common/constants/Constants.js';
import ohosDataAbility from '@ohos.data.dataability';
import contactModel from './ContactDetailModel.js';
import backgroundColor from '../common/constants/color.js';

var TAG = 'groupsModel';
export default {

    /**
     * 添加群组
     *
     * @param {string} DAHelper 数据库路径
     * @param {string} title 群组title
     * @param {Object} callback 返回数据
     */
    addGroup: function (DAHelper, title, callback) {
        this.isSameGroupName(DAHelper, title, data => {
            if (data) {
                // 重名
                callback(-2);
            } else {
                var group = {
                    'group_name': title,
                    'account_id': 1
                };
                DAHelper.insert(
                    CONSTANTS.uri.GROUPS_URI,
                    group
                ).then(data => {
                    LOG.info(TAG + 'addGroup' + 'addGroup result is .' + data);
                    callback(data);
                }).catch(error => {
                    LOG.error(TAG + 'addGroup' + 'insert contact error:' + error);
                });
            }
        });
    },

    /**
     * 查询群组列表
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} actionData 查询数据
     * @param {Object} callback 返回数据
     */
    queryGroups: async function (DAHelper, actionData, callback) {
        var resultColumns = [
            'id AS groupId',
            'group_name AS title'
        ];
        var condition = new ohosDataAbility.DataAbilityPredicates();
        LOG.info(TAG + 'queryGroups' + 'start queryGroups condition 0');
        condition.orderByAsc('group_name');
        condition.offsetAs(actionData.page * actionData.limit).limitAs(actionData.limit);
        var queryUri = CONSTANTS.uri.GROUPS_URI;
        var resultSet = await DAHelper.query(queryUri, resultColumns, condition);
        LOG.info(TAG + 'queryGroups' + 'start deal groups resultSet' + resultSet.length);
        var groups = [];
        if (resultSet.rowCount > 0) {
            if (resultSet.goToFirstRow()) {
                do {
                    var groupId = resultSet.getString(resultSet.getColumnIndex('groupId'));
                    var title = resultSet.getString(resultSet.getColumnIndex('title'));
                    var group = {
                        groupId: groupId,
                        title: title
                    };
                    groups.push(group);
                } while (resultSet.goToNextRow());
            }
        }
        resultSet.close();
        if (groups.length > 0) {
            groups.forEach((group, index) => {
                this.queryGroupContacts(DAHelper, group, groups, index, callback);
            });
        }
    },

    /**
     * 查询群组成员id
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} group 群组value
     * @param {Array} groups 群组value
     * @param {number} i 查询value
     * @param {Object} callback 返回数据
     */
    queryGroupContacts: async function (DAHelper, group, groups, i, callback) {
        try {
            var resultColumns = [
                'detail_info AS groupId',
                'raw_contact_id AS contactId'
            ];
            var typeText = 'group_membership';
            var condition = new ohosDataAbility.DataAbilityPredicates();
            condition.equalTo('content_type', typeText).equalTo('is_deleted', '0')
                .equalTo('detail_info', group.groupId + '');
            var queryUri = CONSTANTS.uri.CONTACT_DATA_URI;
            var resultSet = await DAHelper.query(queryUri, resultColumns, condition);
            group.contactCount = resultSet.rowCount;
            resultSet.close();
            LOG.info(TAG + 'queryGroupContacts' + '--------------groups length is ' + groups.length);
            if (i == Number(groups.length - 1)) {
                callback(groups);
            }
        } catch (e) {
            LOG.error(TAG + 'queryGroupContacts' + 'queryGroupContacts error. e ' + e.getMessage());
        }
    },
    async isSameGroupName(DAHelper, newGroupName, callback) {
        var resultColumns = [
            'id AS groupId',
            'group_name AS title'
        ];
        var condition = new ohosDataAbility.DataAbilityPredicates();
        var queryUri = CONSTANTS.uri.GROUPS_URI;
        var resultSet = await DAHelper.query(queryUri, resultColumns, condition);
        var exist = false;
        if (resultSet.rowCount > 0) {
            if (resultSet.goToFirstRow()) {
                do {
                    var title = resultSet.getString(resultSet.getColumnIndex('title'));
                    if (title == newGroupName) {
                        LOG.error(TAG + 'isSameGroupName' + 'Group name already exists.');
                        exist = true;
                    }
                } while (resultSet.goToNextRow());
            }
        }
        callback(exist);
    },

    /**
     * 更新群组
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} actionData 群组Value
     * @param {Object} callback 返回数据
     */
    updateGroup: function (DAHelper, actionData, callback) {
        this.isSameGroupName(DAHelper, actionData.title, data => {
            if (data) {
                // 重名
                callback(-2);
            } else {
                var condition = new ohosDataAbility.DataAbilityPredicates();
                condition.equalTo('id', actionData.groupId);

                var group = {
                    'group_name': actionData.title
                };
                DAHelper.update(
                    CONSTANTS.uri.GROUPS_URI,
                    group,
                    condition
                ).then(data => {
                    LOG.info(TAG + 'updateGroup' + 'updateGroup result is .' + data);
                    callback(data);
                    LOG.info(TAG + 'updateGroup' + 'end updateGroup.');
                }).catch(error => {
                    LOG.error(TAG + 'updateGroup' + 'updateGroup contact error:' + error);
                });
            }
        });
    },

    /**
     * 删除群组
     *
     * @param {string} DAHelper 数据库路径
     * @param {Array} groupIds 群组ID
     * @param {Object} callback 返回结果
     */
    deleteGroups: async function (DAHelper, groupIds, callback) {
        // 删除群组
        var conditionArgs = new ohosDataAbility.DataAbilityPredicates();
        conditionArgs.in('id', groupIds);
        var result = await DAHelper.delete(CONSTANTS.uri.GROUPS_URI, conditionArgs);
        LOG.info(TAG + 'deleteGroups' + 'deleteGroups delete result = ' + result.length);


        // 删除群组联系人
        var typeText = 'group_membership';
        var condition = new ohosDataAbility.DataAbilityPredicates();
        condition.equalTo('content_type', typeText).in('detail_info', groupIds);
        await DAHelper.delete(CONSTANTS.uri.CONTACT_DATA_URI, condition);
        LOG.info(TAG + 'deleteGroups' + 'delete group contact result = ' + result.length);
        callback(result);
    },

    /**
     * 查询群组成员ID
     *
     * @param {string} DAHelper 数据库路径
     * @param {number} groupId 群组ID
     */
    queryGroupMemberIds: async function (DAHelper, groupId) {
        // 从DATA表查询出来群组成员ID
        var resultColumns = [
            'detail_info AS groupId',
            'raw_contact_id AS contactId'
        ];
        var typeText = 'group_membership';
        var condition = new ohosDataAbility.DataAbilityPredicates();
        condition.equalTo('content_type', typeText).equalTo('is_deleted', '0').equalTo('detail_info', groupId + '');
        var resultSet = await DAHelper.query(CONSTANTS.uri.CONTACT_DATA_URI, resultColumns, condition);
        var contactIds = [];
        if (resultSet.rowCount > 0) {
            if (resultSet.goToFirstRow()) {
                do {
                    var contactId = resultSet.getString(resultSet.getColumnIndex('contactId'));
                    contactIds.push(contactId);
                } while (resultSet.goToNextRow());
            }

        } else {
            LOG.info(TAG + 'queryGroupMemberIds' + 'getOutOfGroupMembers: groupMembers is null.');
        }
        return contactIds;
    },

    /**
     * 查询群组内成员列表
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} actionData 查询Value值
     * @param {Object} callback 返回值
     */
    queryGroupMembers: async function (DAHelper, actionData, callback) {
        // 从DATA表查询出来群组成员ID
        var resultColumns = [
            'detail_info AS groupId',
            'raw_contact_id AS contactId'
        ];
        var typeText = 'group_membership';
        var condition = new ohosDataAbility.DataAbilityPredicates();
        condition.equalTo('content_type', typeText).equalTo('detail_info', actionData.groupId + '');
        var resultSet = await DAHelper.query(CONSTANTS.uri.CONTACT_DATA_URI, resultColumns, condition);
        var contactIds = [];
        if (resultSet.rowCount > 0) {
            if (resultSet.goToFirstRow()) {
                do {
                    var contactId = resultSet.getString(resultSet.getColumnIndex('contactId'));
                    contactIds.push(contactId);
                } while (resultSet.goToNextRow());
            }

        } else {
            LOG.info(TAG + 'queryGroupMembers' + 'getOutOfGroupMembers: groupMembers is null.');
        }
        // 查询contact表
        var result = {
            code: 0,
            resultList: [],
            totalCount: 0
        };
        if (contactIds.length == 0) {
            callback(result);
        } else {
            var resultColumns = [
                'id AS contactId',
                'display_name AS emptyNameData',
                'sort_first_letter AS namePrefix', // 字母序列
                'photo_first_name AS nameSuffix', // 头像里的汉字
                'company AS company',
                'position AS position',
            ];
            var typeText = 'group_membership';
            var condition = new ohosDataAbility.DataAbilityPredicates();
            condition.equalTo('is_deleted', '0').in('name_raw_contact_id', contactIds);
            condition.offsetAs(actionData.page * actionData.limit).limitAs(actionData.limit);

            var queryUri = CONSTANTS.uri.CONTACT_URI;
            var resultSet = await DAHelper.query(queryUri, resultColumns, condition);
            if (resultSet.rowCount > 0) {
                var contacts = [];
                if (resultSet.goToFirstRow()) {
                    do {
                        var contactId = resultSet.getString(resultSet.getColumnIndex('contactId'));
                        var contact = {
                            groupId: resultSet.getString(resultSet.getColumnIndex('groupId')),
                            contactId: contactId,
                            emptyNameData: resultSet.getString(resultSet.getColumnIndex('emptyNameData')),
                            namePrefix: resultSet.getString(resultSet.getColumnIndex('namePrefix')),
                            nameSuffix: resultSet.getString(resultSet.getColumnIndex('nameSuffix')),
                            company: resultSet.getString(resultSet.getColumnIndex('company')),
                            position: resultSet.getString(resultSet.getColumnIndex('position')),
                            portraitColor: backgroundColor.Color[contactId % 6],
                            favorite: false,
                            show: false,
                            checked: false
                        };
                        contacts.push(contact);
                    } while (resultSet.goToNextRow());
                }
                result.resultList = contacts;
                resultSet.close();

                // 查询群组联系人数量
                LOG.info(TAG + 'queryGroupMembers' + 'start queryGroupContacts count.');
                var resultColumns = [
                    'detail_info AS groupId',
                    'raw_contact_id AS contactId'
                ];
                var params = new ohosDataAbility.DataAbilityPredicates();
                params.equalTo('content_type', typeText).equalTo('is_deleted', '0')
                    .equalTo('detail_info', actionData.groupId + '');
                var res = await DAHelper.query(CONSTANTS.uri.CONTACT_DATA_URI, resultColumns, params);
                result.totalCount = res.rowCount;
                res.close();
            } else {
                LOG.info(TAG + 'queryGroupMembers' + 'groupMembers is null.');
            }
            callback(result);
        }
    },

    /**
     * 查询多个群组内成员列表
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} actionData 查看Value值
     */
    queryGroupsMembers: async function (DAHelper, actionData) {
        LOG.info(TAG + 'queryGroupsMembers' + 'start queryGroupsMembers.');
        var result = {
            code: 0
        };
        var resultColumns = [
            'contact_id AS contactId'
        ];
        var typeText = 'group_membership';
        var condition = new ohosDataAbility.DataAbilityPredicates();
        condition.equalTo('content_type', typeText).equalTo('is_deleted', '0').in('detail_info', actionData.groupIds);
        var queryUri = CONSTANTS.uri.CONTACT_DATA_URI;
        var resultSet = await DAHelper.query(queryUri, resultColumns, condition);
        if (resultSet.rowCount > 0) {
            var contactIds = [];
            if (resultSet.goToFirstRow()) {
                do {
                    var contactId = resultSet.getString(resultSet.getColumnIndex('contactId'));
                    contactIds.push(contactId);
                } while (resultSet.goToNextRow());
            }
            result.contactIds = contactIds;
            resultSet.close();
        } else {
            LOG.info(TAG + 'queryGroupsMembers' + 'groupsMembers is null.');
        }
        return result;
    },

    /**
     * 添加群组成员
     *
     * @param {string} DAHelper 数据库名称
     * @param {Object} actionData 添加key/value值
     * @param {Object} callback 回调
     */
    addGroupMembers: function (DAHelper, actionData, callback) {
        LOG.info(TAG + 'addGroupMembers' + 'start addGroupMembers');
        var contactDataItem = {
            'content_type': 'group_membership',
            'detail_info': actionData.groupId,
        };

        if (actionData.isOperationAll) {
            // 反选的数据
            let queryParams = {
                page: 0,
                limit: 2000,
                groupId: actionData.groupId
            };
            var unCheckContactIds = [];
            // 正选数据
            actionData.contactBeans.forEach((contact) => {
                unCheckContactIds.push(contact.contactId);
            });
            this.getOutOfGroupMembers(DAHelper, queryParams, allOutOfGroupMembers => {
                var allOutOfGroupMembersIds = [];
                allOutOfGroupMembers.resultList.forEach((member) => {
                    allOutOfGroupMembersIds.push(member.contactId);
                });
                LOG.info(TAG + 'addGroupMembers' + 'addGroupMembers ' + allOutOfGroupMembers.length);
                var addContactIds = [];
                allOutOfGroupMembersIds.forEach((member) => {
                    if (unCheckContactIds.indexOf(member) == -1) {
                        addContactIds.push(member);
                    }
                });
                addContactIds.forEach((id) => {
                    contactDataItem.raw_contact_id = id;
                    DAHelper.insert(
                        CONSTANTS.uri.CONTACT_DATA_URI,
                        contactDataItem
                    ).catch(error => {
                        LOG.error(TAG + 'addGroupMembers' + 'insert contact error:' + error);
                    });
                });
            });
            LOG.info(TAG + 'addGroupMembers' + 'end addGroupMembers ~~');
            callback();
        } else {
            LOG.info(TAG + 'addGroupMembers' + 'addGroupMembers actionData is ' + actionData);
            // 正选数据

            actionData.contactBeans.forEach((contact) => {
                contactDataItem.raw_contact_id = contact.contactId;
                DAHelper.insert(
                    CONSTANTS.uri.CONTACT_DATA_URI,
                    contactDataItem
                ).catch(error => {
                    LOG.error(TAG + 'addGroupMembers' + 'insert contact error:' + error);
                });
            });
            LOG.info(TAG + 'addGroupMembers' + 'end addGroupMembers ~~~~');
            callback();
        }
    },

    /**
     * 获取群组外成员列表
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} actionData 查询Value值
     * @param {Object} callback 返回结果
     */
    getOutOfGroupMembers: async function (DAHelper, actionData, callback) {
        LOG.info(TAG + 'getOutOfGroupMembers' + 'start getOutOfGroupMembers');
        var result = {
            code: 0,
            resultList: [],
            totalCount: 0
        };
        var resultColumns = [
            'detail_info AS groupId',
            'raw_contact_id AS contactId'
        ];
        var typeText = 'group_membership';
        var condition = new ohosDataAbility.DataAbilityPredicates();
        condition.equalTo('content_type', typeText).equalTo('is_deleted', '0')
            .equalTo('detail_info', actionData.groupId + '');
        var resultSet = await DAHelper.query(CONSTANTS.uri.CONTACT_DATA_URI, resultColumns, condition);
        var contactIds = [];
        if (resultSet.rowCount > 0) {
            if (resultSet.goToFirstRow()) {
                do {
                    var contactId = resultSet.getString(resultSet.getColumnIndex('contactId'));
                    contactIds.push(contactId);
                } while (resultSet.goToNextRow());
            }

        } else {
            LOG.info(TAG + 'getOutOfGroupMembers' + 'getOutOfGroupMembers: groupMembers is null.');
        }
        resultColumns = [
            'id AS contactId',
            'display_name AS emptyNameData',
            'sort_first_letter AS namePrefix', // 字母序列
            'photo_first_name AS nameSuffix', // 头像里的汉字
            'company AS company',
            'position AS position',
        ];
        var params = new ohosDataAbility.DataAbilityPredicates();
        params.equalTo('is_deleted', '0');
        if (contactIds.length > 0) {
            contactIds.forEach(id => {
                params.notEqualTo('name_raw_contact_id', id);
            });
        }
        params.offsetAs(actionData.page * actionData.limit).limitAs(actionData.limit);

        var res = await DAHelper.query(CONSTANTS.uri.CONTACT_URI, resultColumns, params);
        if (res.rowCount > 0) {
            var contacts = [];
            if (res.goToFirstRow()) {
                do {
                    var contactId = res.getString(res.getColumnIndex('contactId'));
                    var contact = {
                        contactId: contactId,
                        emptyNameData: res.getString(res.getColumnIndex('emptyNameData')),
                        namePrefix: res.getString(res.getColumnIndex('namePrefix')),
                        nameSuffix: res.getString(res.getColumnIndex('nameSuffix')),
                        company: res.getString(res.getColumnIndex('company')),
                        position: res.getString(res.getColumnIndex('position')),
                        portraitColor: backgroundColor.Color[contactId % 6],
                        favorite: false,
                        show: false,
                        checked: false
                    };
                    contacts.push(contact);
                } while (res.goToNextRow());
            }
            result.resultList = contacts;
            res.close();

            // 查询群组外联系人数量
            LOG.info(TAG + 'getOutOfGroupMembers' + 'start queryGroupContacts count.');
            resultColumns = [
                'name_raw_contact_id AS contactId'
            ];
            var params1 = new ohosDataAbility.DataAbilityPredicates();
            params1.equalTo('is_deleted', '0');
            if (contactIds.length > 0) {
                contactIds.forEach(id => {
                    params1.notEqualTo('name_raw_contact_id', id);
                });
            }

            var res1 = await DAHelper.query(CONSTANTS.uri.CONTACT_URI, resultColumns, params);
            result.totalCount = res1.rowCount;
            res1.close();
        } else {
            LOG.info(TAG + 'getOutOfGroupMembers' + 'out of groupMembers is null----.');
        }

        callback(result);
    },

    /**
     * 移除群组成员
     *
     * @param {string} DAHelper 数据库
     * @param {Object} actionData 移除值
     * @param {Object} callback 回调
     */
    deleteGroupMembers: async function (DAHelper, actionData, callback) {
        var typeText = 'group_membership';
        var typeId = this.getTypeId(DAHelper, typeText);
        LOG.info(TAG + 'deleteGroupMembers' + 'deleteGroupMembers actionData is ' + actionData);
        var contactIds = [];
        // 正选数据
        actionData.contactBeans.forEach((contact) => {
            contactIds.push(contact.contactId);
        });
        // 移除成员
        var conditionArgs = new ohosDataAbility.DataAbilityPredicates();
        if (actionData.isOperationAll) {
            conditionArgs.equalTo('type_id', typeId).equalTo('detail_info', actionData.groupId + '');
            if (contactIds.length > 0) {
                contactIds.forEach(id => {
                    conditionArgs.notEqualTo('raw_contact_id', id);
                });
            }
        } else {
            conditionArgs.equalTo('type_id', typeId).equalTo('detail_info', actionData.groupId + '')
                .in('raw_contact_id', contactIds);
        }
        var result = await DAHelper.delete(CONSTANTS.uri.CONTACT_DATA_URI, conditionArgs);
        LOG.info(TAG + 'deleteGroupMembers' + 'deleteGroupMembers delete result = ' + result.length);
        callback();
    },

    /**
     * 查询群组成员列表
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} actionData 查询value值
     * @param {Object} callback 返回数据
     */
    getGroupMemberList: function (DAHelper, actionData, callback) {
        this.queryGroupMembers(DAHelper, actionData, result => {
            result.resultList.forEach((member, index) => {
                var params = new ohosDataAbility.DataAbilityPredicates();
                params.equalTo('content_type', actionData.filterItem);
                params.equalTo('raw_contact_id', member.contactId);
                if ('phone' == actionData.filterItem) {
                    var resultColumns = ['detail_info AS phoneNumber', 'extend7 AS labelId'];

                    var phoneNumbers = [];
                    DAHelper.query(CONSTANTS.uri.CONTACT_DATA_URI, resultColumns, params).then(res => {
                        if (res.rowCount > 0) {
                            if (res.goToFirstRow()) {
                                do {
                                    var phoneNumber = res.getString(res.getColumnIndex('phoneNumber'));
                                    var labelId = res.getString(res.getColumnIndex('labelId'));
                                    phoneNumbers.push({
                                        phoneNumber: phoneNumber,
                                        labelId: labelId,
                                        labelName: labelId > 0 ? actionData.phoneNumberLabelNames[labelId - 1] : ''
                                    });
                                } while (res.goToNextRow());
                                res.close();
                                member.phoneNumbers = phoneNumbers;
                            }
                        } else {
                            LOG.error(TAG + 'getGroupMemberList' + 'phoneNumbers is null.');
                        }
                        if (index == result.resultList.length - 1) {
                            callback(result);
                        }
                    });
                }
                if ('email' == actionData.filterItem) {
                    var resultColumns = ['detail_info AS email', 'extend7 AS labelId'];
                    var emails = [];
                    DAHelper.query(CONSTANTS.uri.CONTACT_DATA_URI, resultColumns, params).then(res => {
                        if (res.rowCount > 0) {
                            if (res.goToFirstRow()) {
                                do {
                                    var email = res.getString(res.getColumnIndex('email'));
                                    var labelId = res.getString(res.getColumnIndex('labelId'));
                                    emails.push({
                                        email: email,
                                        labelId: labelId,
                                        labelName: labelId > 0 ? actionData.emailsLabelNames[labelId - 1] : ''
                                    });
                                } while (res.goToNextRow());
                            }
                            res.close();
                            member.emails = emails;
                            LOG.info(TAG + 'getGroupMemberList' + ' ' + emails);
                        } else {
                            LOG.error(TAG + 'getGroupMemberList' + 'emails is null.');
                        }
                        if (index == result.resultList.length - 1) {
                            callback(result);
                        }
                    });
                }
            });

        });
    },

    /**
     * 查询最近联系人
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} actionData 查询value值
     * @param {Object} callback 返回数据
     */
    getRecentContacts: function (DAHelper, actionData, callback) {
        this.queryRecentContacts(DAHelper, actionData, result => {
            LOG.info(TAG + 'getRecentContacts' + 'start result.resultList.forEach');
            result.resultList.forEach((member, index) => {
                var params = new ohosDataAbility.DataAbilityPredicates();
                params.equalTo('content_type', actionData.filterItem);
                params.equalTo('raw_contact_id', member.raw_contact_id);
                if ('phone' == String(actionData.filterItem)) {
                    var resultColumns = ['detail_info AS phoneNumber', 'extend7 AS labelId'];

                    var phoneNumbers = [];
                    DAHelper.query(CONSTANTS.uri.CONTACT_DATA_URI, resultColumns, params).then(res => {
                        if (res.rowCount > 0) {
                            if (res.goToFirstRow()) {
                                do {
                                    var phoneNumber = res.getString(res.getColumnIndex('phoneNumber'));
                                    var labelId = res.getString(res.getColumnIndex('labelId'));
                                    phoneNumbers.push({
                                        phoneNumber: phoneNumber,
                                        labelId: labelId,
                                        labelName: labelId > 0 ? actionData.phoneNumberLabelNames[labelId - 1] : ''
                                    });
                                } while (res.goToNextRow());
                                res.close();
                                member.phoneNumbers = phoneNumbers;
                                if (index == result.resultList.length - 1) {
                                    callback(result);
                                }
                            }
                        } else {
                            LOG.error(TAG + 'getRecentContacts' + 'phoneNumbers is null.');
                            if (index == result.resultList.length - 1) {
                                callback(result);
                            }
                        }
                    });
                }
                if ('email' == actionData.filterItem) {
                    var resultColumns = ['detail_info AS email', 'extend7 AS labelId'];
                    var emails = [];
                    DAHelper.query(CONSTANTS.uri.CONTACT_DATA_URI, resultColumns, params).then(res => {
                        if (res.rowCount > 0) {
                            if (res.goToFirstRow()) {
                                do {
                                    var email = res.getString(res.getColumnIndex('email'));
                                    var labelId = res.getString(res.getColumnIndex('labelId'));
                                    emails.push({
                                        email: email,
                                        labelId: labelId,
                                        labelName: labelId > 0 ? actionData.emailsLabelNames[labelId - 1] : ''
                                    });
                                } while (res.goToNextRow());
                            }
                            res.close();
                            member.emails = emails;
                            LOG.info(TAG + 'getRecentContacts' + 'getRecentContacts emails:' + emails);
                            if (index == result.resultList.length - 1) {
                                callback(result);
                            }
                        } else {
                            LOG.error(TAG + 'getRecentContacts' + 'emails is null.');
                            if (index == result.resultList.length - 1) {
                                callback(result);
                            }
                        }
                    });
                }
            });

        });
    },

    /**
     * 获取群里列表和联系人
     *
     * @param {string} DAHelper 数据库字段
     * @param {Object} actionData 查询value值
     * @param {Object} callback 返回数据
     */
    getGroupListAndContacts: function (DAHelper, actionData, callback) {
        this.queryGroups(DAHelper, actionData, result => {
            result.forEach((groupItem, index) => {
                var request = {
                    page: 0,
                    limit: 200,
                    groupId: groupItem.groupId,
                    filterItem: actionData.filterItem,
                    phoneNumberLabelNames: actionData.phoneNumberLabelNames
                };

                this.getGroupMemberList(DAHelper, request, groupMember => {
                    groupItem.contactBeans = groupMember.resultList;
                    if (index == result.length - 1) {
                        var groupResult = {
                            code: 0,
                            resultList: result
                        };
                        callback(groupResult);
                    }
                });
            });
        });
    },

    /**
     * 查询群组类型id
     *
     * @param {string} DAHelper 数据库路径
     * @param {string} typeText key值
     */
    getTypeId: async function (DAHelper, typeText) {
        var params = new ohosDataAbility.DataAbilityPredicates();
        params.equalTo('content_type', typeText);
        var resultColumns = ['id as typeId'];

        var res = await DAHelper.query(CONSTANTS.uri.CONTACT_TYPE_URI, resultColumns, params);
        var typeId = '';
        if (res.rowCount > 0) {
            if (res.goToFirstRow()) {
                typeId = res.getString(res.getColumnIndex('typeId'));
            }
        } else {
            LOG.error(TAG + 'getTypeId' + 'typeText is null.');
        }
        return typeId;
    },

    /**
     * 查询最近联系人
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} data 查询值
     * @param {Object} callback 返回数据
     */
    queryRecentContacts: async function (DAHelper, data, callback) {
        LOG.info(TAG + 'addGroup' + 'Model: queryRecentContacts start.');
        var resultColumns = ['id as contactId', 'name_raw_contact_id as raw_contact_id',
        'display_name as emptyNameData', 'sort_first_letter as namePrefix', 'photo_first_name as nameSuffix',
        'company as company', 'position as position'];
        var conditionArgs = new ohosDataAbility.DataAbilityPredicates();
        var now = Date.now();
        LOG.info(TAG + 'addGroup' + 'now is =' + now);
        var afterDifValue = now - (data.startDate * 24 * 3600 * 1000);

        var startTime = afterDifValue < 0 ? 0 : afterDifValue;

        var difValue = now - (data.endDate * 24 * 3600 * 1000);
        var endTime = difValue < 0 ? 0 : difValue;

        if (data.startDate != -1) {
            conditionArgs.greaterThan('lastest_contacted_time', startTime);
        }
        LOG.info(TAG + 'addGroup' + 'startTime is ' + startTime + '  and endTime is ' + endTime);
        conditionArgs.equalTo('is_deleted', '0').lessThanOrEqualTo('lastest_contacted_time', endTime)
            .offsetAs(data.page * data.limit).limitAs(data.limit);
        var result = {};
        LOG.info(TAG + 'addGroup' + 'queryRecentContacts get DAHelper.query start');
        var resultSet = await DAHelper.query(CONSTANTS.uri.CONTACT_URI, resultColumns, conditionArgs);
        result.code = 0;
        var resultList = [];
        if (resultSet.rowCount > 0) {
            resultSet.goToFirstRow();
            do {
                var jsonObj = {};
                jsonObj.contactId = resultSet.getString(resultSet.getColumnIndex('contactId'));
                jsonObj.raw_contact_id = resultSet.getString(resultSet.getColumnIndex('raw_contact_id'));
                jsonObj.emptyNameData = resultSet.getString(resultSet.getColumnIndex('emptyNameData'));
                jsonObj.namePrefix = resultSet.getString(resultSet.getColumnIndex('namePrefix'));
                jsonObj.nameSuffix = resultSet.getString(resultSet.getColumnIndex('nameSuffix'));
                jsonObj.company = resultSet.getString(resultSet.getColumnIndex('company'));
                jsonObj.position = resultSet.getString(resultSet.getColumnIndex('position'));
                jsonObj.portraitColor = backgroundColor.Color[Math.abs(jsonObj.contactId) % 6];
                jsonObj.show = false;
                resultList.push(jsonObj);
            } while (resultSet.goToNextRow());
        }
        resultSet.close();
        result.resultList = resultList;
        callback(result);
    },

    /**
     * 查询最近联系人总数
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} callback 返回数据集
     */
    queryRecentContactsCount: async function (DAHelper, callback) {
        var result = {
            count1: 0,
            count2: 0,
            count3: 0,
            count4: 0
        };
        var data = {
            startDate: 7,
            endDate: 0
        };
        this.queryContactsCount(DAHelper, data, count1 => {
            result.count1 = count1;
            data = {
                startDate: 30,
                endDate: 7
            };
            this.queryContactsCount(DAHelper, data, count2 => {
                result.count2 = count2;
                data = {
                    startDate: 90,
                    endDate: 30
                };
                this.queryContactsCount(DAHelper, data, count3 => {
                    result.count3 = count3;
                    data = {
                        startDate: -1,
                        endDate: 90
                    };
                    this.queryContactsCount(DAHelper, data, count4 => {
                        result.count4 = count4;
                        callback(result);
                    });
                });
            });
        });
    },

    /**
     * 查询联系人数量
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} data 查询key数据
     * @param {Object} callback 查询返回结果
     */
    queryContactsCount: async function (DAHelper, data, callback) {
        var now = Date.now();
        LOG.info(TAG + 'addGroup' + 'now is =' + now);
        var afterDifValue = now - (data.startDate * 24 * 3600 * 1000);

        var startTime = afterDifValue < 0 ? 0 : afterDifValue;

        var difValue = now - (data.endDate * 24 * 3600 * 1000);
        var endTime = difValue < 0 ? 0 : difValue;

        var resultColumns = ['id'];
        var conditionArgs = new ohosDataAbility.DataAbilityPredicates();
        if (data.startDate != -1) {
            conditionArgs.greaterThan('lastest_contacted_time', startTime);
        }
        conditionArgs.equalTo('is_deleted', '0').lessThanOrEqualTo('lastest_contacted_time', endTime);
        var resultSet = await DAHelper.query(CONSTANTS.uri.CONTACT_URI, resultColumns, conditionArgs);
        var count = resultSet.rowCount;
        resultSet.close();
        callback(count);
    },

    /**
     * 搜索联系人
     *
     * @param {string} DAHelper 数据库地址
     * @param {Object} data 搜索框内容
     * @param {Object} callback 返回结果
     * */
    searchContacts: async function (DAHelper, data, callback) {
        var conditionArgs = new ohosDataAbility.DataAbilityPredicates();
        conditionArgs.equalTo('is_deleted', '0').notEqualTo('content_type', 'relation')
            .notEqualTo('content_type', 'photo');
        // 群组界面搜索
        if (data.groupId > 0) {
            // 先查询出来群组的所有人id
            var contactIds = await this.queryGroupMemberIds(DAHelper, data.groupId);
            // 群组内搜索
            if (data.searchType == 2) {
                conditionArgs.in('raw_contact_id', contactIds);
            } else if (data.searchType == 3) {
                // 群组外搜索
                if (contactIds.length > 0) {
                    contactIds.forEach(id => {
                        conditionArgs.notEqualTo('raw_contact_id', id);
                    });
                }
            } else {
                LOG.error(TAG + 'addGroup' + 'searchType is error. searchType: ' + data.searchType);
            }
        }
        // 收藏界面搜索
        if (data.starred == 0 || data.starred == 1) {
            conditionArgs.and().equalTo('favorite', data.starred);
        }

        if (!data.searchProperty) {
            conditionArgs.beginWrap().contains('detail_info', data.likeValue).or().contains('position', data.likeValue)
                .or().contains('search_name', data.likeValue).endWrap();
        } else {
            conditionArgs.in('content_type', data.searchProperty).beginWrap().contains('detail_info', data.likeValue).or().contains('position', data.likeValue).or().contains('search_name', data.likeValue).endWrap();
        }

        if (data.pinYinArr && data.pinYinArr.length != 0) {
            data.pinYinArr.forEach((pinyin, index) => {
                conditionArgs.or().contains('search_name', pinyin);
            });
        }
        this.queryData(DAHelper,data,conditionArgs,callback)
    },
    queryData: function (DAHelper,data,conditionArgs,callback) {
        var resultColumns = ['contact_id AS contactId'];
        // 匹配到的联系人id
        var contactIds = [];
        DAHelper.query(CONSTANTS.uri.SEARCH_CONTACT_URI, resultColumns, conditionArgs).then(resultSet => {
            LOG.info(TAG + 'addGroup' + 'query contactIds success. resultSet.rowCount is ' + resultSet.rowCount);
            if (resultSet.rowCount > 0) {
                if (resultSet.goToFirstRow()) {
                    do {
                        var contactId = resultSet.getString(resultSet.getColumnIndex('contactId'));
                        if (contactIds.indexOf(contactId) == -1) {
                            contactIds.push(contactId);
                        }
                    } while (resultSet.goToNextRow());
                }
            } else {
                LOG.info(TAG + 'addGroup' + 'contactIds is null.');
            }
            var searchResult = {
                code: 0,
                data: [],
                contactCount: contactIds.length
            };

            if (contactIds.length != 0) {
                contactIds.forEach((contactId, index) => {
                    var actionData = {
                        contactId: contactId,
                        searchMimetype: true,
                        searchValue: data.likeValue
                    };
                    LOG.info(TAG + 'addGroup' + 'start getContactById!!!');
                    contactModel.getContactById(DAHelper, actionData, result => {
                        if (!data.pinYinArr || data.pinYinArr.length == 0) {
                            // 删除多余匹配的数组字段；例如电话号码有多个，但是只匹配到一个，则删除其余多余电话号码
                            this.deleteProperties(result.data, data.likeValue);
                        }
                        searchResult.data.push(result.data);
                        if (index == contactIds.length - 1) {
                            LOG.info(TAG + 'addGroup' + '!!!!!!!!!!!!!!!!!!+' + searchResult);
                            callback(searchResult);
                        }
                    });
                });
            } else {
                callback(searchResult);
            }
        });
    },

    /**
     * 删除多余匹配的数组字段；例如电话号码有多个，但是只匹配到一个，则删除其余多余电话号码
     *
     * @param {Object} detailInfo 删除数量
     * @param {string} likeValue 删除字段
     */
    deleteProperties: function (detailInfo, likeValue) {
        var searchType = detailInfo.searchMimetype[0];
        switch (searchType) {
            case '/phone':
                if (detailInfo.phoneNumbers && detailInfo.phoneNumbers.length > 0) {
                    var newPhoneNumbers = [];
                    detailInfo.phoneNumbers.forEach(phoneNumber => {
                        if (phoneNumber.phoneNumber.indexOf(likeValue) != -1) {
                            newPhoneNumbers.push(phoneNumber);
                        }
                    });
                    detailInfo.phoneNumbers = newPhoneNumbers;
                }
                break;
            case '/im':
                if (detailInfo.imAddresses && detailInfo.imAddresses.length > 0) {
                    var newImAddresses = [];
                    detailInfo.imAddresses.forEach(imAddress => {
                        if (imAddress.imAddress.indexOf(likeValue) != -1) {
                            newImAddresses.push(imAddress);
                        }
                    });
                    detailInfo.imAddresses = newImAddresses;
                }
                break;
            case '/postal_address':
                if (detailInfo.postalAddresses && detailInfo.postalAddresses.length > 0) {
                    var newPostalAddresses = [];
                    detailInfo.postalAddresses.forEach(postalAddress => {
                        if (postalAddress.postalAddress.indexOf(likeValue) != -1) {
                            newPostalAddresses.push(postalAddress);
                        }
                    });
                    detailInfo.postalAddresses = newPostalAddresses;
                }
                break;
                this.switchNext(searchType, detailInfo, likeValue);
        }
    },
    switchNext: function (searchType, detailInfo, likeValue) {
        switch (searchType) {

            case '/website':
                if (detailInfo.websites && detailInfo.websites.length > 0) {
                    var newWebsites = [];
                    detailInfo.websites.forEach(website => {
                        if (website.website.indexOf(likeValue) != -1) {
                            newWebsites.push(website);
                        }
                    });
                    detailInfo.websites = newWebsites;
                }
                break;
            case '/email':
                if (detailInfo.emails && detailInfo.emails.length > 0) {
                    var newEmail = [];
                    detailInfo.emails.forEach(email => {
                        if (email.email.indexOf(likeValue) != -1) {
                            newEmail.push(email);
                        }
                    });
                    detailInfo.emails = newEmail;
                }
                break;
            default:
                break;
        }
    },
};