/**
 * @file: 联系人model
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
import ohosDataAbility from '@ohos.data.dataability';
import Constants from '../common/constants/Constants.js';
import GroupsModel from './GroupsModel.js';
import Utils from '../utils/Utils.js';
import backgroundColor from '../common/constants/color.js';

var TAG = 'contactModel';
export default {

    /**
     * 查询创建的群组
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} data 群组相关数据
     * @param {Object} callback 回调
     */
    queryCustomizeGroups: async function (DAHelper, data, callback) {
        var defaultData = {
            'isCheckedCustomize': false,
            'isCheckedOtherCustomize': false
        };
        let ret = data.ret;
        LOG.info(TAG + 'queryCustomizeGroups' + 'get customize json=' + ret);
        var value = ret == 'false' ? defaultData : JSON.parse(ret);
        if (value.isCheckedOtherCustomize) {

            // 查询has_group不是1的
            data.hasGroup = 0;
        }
        var groupIds = [];
        if (value.hasOwnProperty('checkedList')) {
            value.checkedList.forEach(id => {
                groupIds.push(id);
            });
            // 查询在groupIds中的联系人id
            if (!Utils.isEmptyList(groupIds)) {
                var actionData = {
                    'groupIds': groupIds
                };
                var result = await GroupsModel.queryGroupsMembers(DAHelper, actionData);
                LOG.info(TAG + 'queryCustomizeGroups' + 'Contacts GroupsModel: ' + result.contactIds);
                data.contactIds = result.contactIds;
            }
        }
        this.queryContacts(DAHelper, data, callback);
    },

    /**
     * 查询联系人
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} data 群组相关数据
     * @param {Object} callback 回调
     */
    queryContacts: async function (DAHelper, data, callback) {
        var resultColumns = ['id as contactId', 'display_name as emptyNameData', 'sort_first_letter as namePrefix',
        'photo_first_name as nameSuffix', 'company as company', 'position as position'];
        var conditionArgs = new ohosDataAbility.DataAbilityPredicates();
        conditionArgs.equalTo('is_deleted', '0').orderByAsc('sort_first_letter')
            .offsetAs(data.page * data.limit).limitAs(data.limit);

        if (data.hasOwnProperty('hasGroup') || data.hasOwnProperty('contactIds')) {
            LOG.info(TAG + 'queryContacts' + 'query groups contacts.');
            conditionArgs.beginWrap();
        }
        if (data.hasOwnProperty('hasGroup')) {
            conditionArgs.equalTo('has_group', 0);
        }
        if (data.hasOwnProperty('hasGroup') && data.hasOwnProperty('contactIds')) {
            conditionArgs.or();
        }
        if (data.hasOwnProperty('contactIds')) {
            conditionArgs.in('id', data.contactIds);
        }
        if (data.hasOwnProperty('hasGroup') || data.hasOwnProperty('contactIds')) {
            conditionArgs.endWrap();
        }
        var result = {};
        LOG.info(TAG + 'queryContacts' + 'Contacts requestInit get DAHelper.query --------------start');
        var resultSet = await DAHelper.query(Constants.uri.CONTACTS_URI_PREFIX
        + 'contact', resultColumns, conditionArgs);
        LOG.info(TAG + 'queryContacts' + 'Contacts requestInit get DAHelper.query --------------end');
        result.code = 0;
        var resultList = [];
        if (resultSet.rowCount > 0) {
            resultSet.goToFirstRow();
            do {
                var jsonObj = {};
                jsonObj.contactId = resultSet.getString(resultSet.getColumnIndex('contactId'));
                var name = resultSet.getString(resultSet.getColumnIndex('emptyNameData'));
                var frist = name.substr(0, 1);
                if ((frist >= 'a' && frist <= 'z') || (frist >= 'A' && frist <= 'Z')) {
                    jsonObj.namePrefix = frist.toUpperCase();
                } else {
                    jsonObj.namePrefix = '0';
                }
                jsonObj.emptyNameData = name;
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
        LOG.info(TAG + 'queryContacts' + 'query contacts list =' + result);
        this.queryContactsCount(DAHelper, data, result, callback);
    },

    /**
     * 查询联系人数量
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} data 联系人相关数据
     * @param {Object} result 联系人数据
     * @param {Object} callback 回调
     */
    queryContactsCount: async function (DAHelper, data, result, callback) {
        var resultColumns = ['id'];
        var conditionArgs = new ohosDataAbility.DataAbilityPredicates();
        conditionArgs.equalTo('is_deleted', '0');
        LOG.info(TAG + 'queryContactsCount' + 'query groups contacts count data = ' + data);
        if (data.hasOwnProperty('hasGroup') || data.hasOwnProperty('contactIds')) {
            LOG.info(TAG + 'queryContactsCount' + 'query groups contacts count');
            conditionArgs.beginWrap();
        }
        if (data.hasOwnProperty('hasGroup')) {
            conditionArgs.equalTo('has_group', 0);
        }
        if (data.hasOwnProperty('hasGroup') && data.hasOwnProperty('contactIds')) {
            conditionArgs.or();
        }
        if (data.hasOwnProperty('contactIds')) {
            conditionArgs.in('id', data.contactIds);
        }
        if (data.hasOwnProperty('hasGroup') || data.hasOwnProperty('contactIds')) {
            conditionArgs.endWrap();
        }
        var resultSet = await DAHelper.query(Constants.uri.CONTACTS_URI_PREFIX
        + 'contact', resultColumns, conditionArgs);
        LOG.info(TAG + 'queryContactsCount' + 'query contacts count =' + resultSet.rowCount);
        result.contactCount = resultSet.rowCount;
        callback(result);
    },

    /**
     * 联系人分页
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} data 联系人分页相关数据
     * @param {Object} callback 回调
     */
    queryPageContacts: async function (DAHelper, data, callback) {
        var resultColumns = ['id as contactId', 'display_name as emptyNameData', 'sort_first_letter as namePrefix',
        'photo_first_name as nameSuffix', 'company as company', 'position as position'];
        var conditionArgs = new ohosDataAbility.DataAbilityPredicates();
        conditionArgs.equalTo('is_deleted', '0').orderByAsc('sort_first_letter')
            .offsetAs(data.page * data.limit).limitAs(data.limit);

        if (data.hasOwnProperty('hasGroup') || data.hasOwnProperty('contactIds')) {
            LOG.info(TAG + 'queryPageContacts' + 'query groups contacts.');
            conditionArgs.beginWrap();
        }
        if (data.hasOwnProperty('hasGroup')) {
            conditionArgs.equalTo('has_group', 0);
        }
        if (data.hasOwnProperty('hasGroup') && data.hasOwnProperty('contactIds')) {
            conditionArgs.or();
        }
        if (data.hasOwnProperty('contactIds')) {
            conditionArgs.in('id', data.contactIds);
        }
        if (data.hasOwnProperty('hasGroup') || data.hasOwnProperty('contactIds')) {
            conditionArgs.endWrap();
        }
        var result = {};
        var resultSet = await DAHelper.query(Constants.uri.CONTACTS_URI_PREFIX
        + 'contact', resultColumns, conditionArgs);
        result.code = 0;
        var resultList = [];
        if (resultSet.rowCount > 0) {
            resultSet.goToFirstRow();
            do {
                var jsonObj = {};
                jsonObj.contactId = resultSet.getString(resultSet.getColumnIndex('contactId'));
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
        result.resultList = resultList;
        LOG.info(TAG + 'queryPageContacts' + 'query page contacts list =' + result);
        callback(result);
    },

    /**
     * 删除联系人
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} data 联系人数据
     * @param {Object} callback 回调
     */
    deleteContacts: async function (DAHelper, data, callback) {
        var conditionArgs = new ohosDataAbility.DataAbilityPredicates();
        conditionArgs.equalTo('id', data.contactId);
        LOG.info(TAG + 'deleteContacts' + 'delete contacts ----------------start');
        var result = await DAHelper.delete(Constants.uri.CONTACTS_URI_PREFIX + 'contact', conditionArgs);
        LOG.info(TAG + 'deleteContacts' + 'delete contacts result = ' + result);
        callback(result);
    }
};