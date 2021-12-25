/**
 * @file: 选择联系人Model
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

import ohosDataAbility from '@ohos.data.dataability';
import Utils from '../utils/Utils.js';
import LOG from '../utils/ContactsLog.js';
import Constants from '../common/constants/Constants.js';
import backgroundColor from '../common/constants/color.js';

var TAG = 'selectContactsModel';

export default {

    /**
     * 查询联系人
     *
     * @param {string} DAHelper 数据库地址
     * @param {Object} callBack 返回数据集
      */
    queryContacts: async function (DAHelper, callBack) {
        var contactNumberMap = await this.getAllContactNumbers(DAHelper); // 获取所有联系人及其电话号码的Map映射关系
        var resultColumns = ['id as contactId', 'display_name as emptyNameData', 'sort_first_letter as namePrefix',
        'photo_first_name as nameSuffix', 'company as company', 'position as position'];
        var conditionArgs = new ohosDataAbility.DataAbilityPredicates();
        conditionArgs.equalTo('is_deleted', '0').orderByAsc('sort_first_letter');
        var resultSet = await DAHelper.query(Constants.uri.CONTACTS_URI_PREFIX + 'contact',
            resultColumns, conditionArgs);
        if (Utils.isEmpty(resultSet) || resultSet.rowCount == 0) {
            LOG.error(TAG + 'queryContacts' + 'SelectcontactsModel queryContact resultSet is empty!');
            callBack();
            return;
        }
        var resultList = [];
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
            jsonObj.phoneNumbers = contactNumberMap.get(jsonObj.contactId);
            resultList.push(jsonObj);
        } while (resultSet.goToNextRow());
        callBack(resultList);
    },

    /**
     * 查询所有联系人手机号
     *
     * @param {string} DAHelper 数据库地址
      */
    getAllContactNumbers: async function (DAHelper) {
        var resultColumns = ['raw_contact_id', 'detail_info', 'extend7'];// extend7代表labelId
        var conditionArgs = new ohosDataAbility.DataAbilityPredicates();
        conditionArgs.equalTo('type_id', '5').orderByAsc('raw_contact_id');
        var resultSet = await DAHelper.query(Constants.uri.CONTACT_DATA_URI, resultColumns, conditionArgs);
        if (Utils.isEmpty(resultSet) || resultSet.rowCount == 0) {
            LOG.error(TAG + 'getAllContactNumbers' + ' Selectcontacts Model getAllContactNumbers resultSet is empty!');
            return new Map();
        }
        var contactNumberMap = new Map(); // 用于存储联系人及其电话号码的对应关系
        resultSet.goToFirstRow();
        var oldContact = resultSet.getString(0);
        var numberList = [];
        do {
            var newContact = resultSet.getString(0);
            if (oldContact == String(newContact)) { // 如果是同一联系人则把手机号放到同一个list中
                numberList.push({
                    'phoneNumber': resultSet.getString(1),
                    'labelId': resultSet.getString(2)
                });
            } else {
                // 联系人变化时，存储联系人与手机号码列表的对应关系
                contactNumberMap.set(oldContact, numberList);
                oldContact = newContact;
                // 将最新的号码数据存储到新的numberList
                numberList = [{
                                  'phoneNumber': resultSet.getString(1),
                                  'labelId': resultSet.getString(2)
                              }];
            }
        } while (resultSet.goToNextRow());
        contactNumberMap.set(oldContact, numberList);
        return contactNumberMap;
    },
};