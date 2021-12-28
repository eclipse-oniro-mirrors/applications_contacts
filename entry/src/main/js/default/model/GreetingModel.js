/**
 * @file: 应答语model
 */
/**
 * Copyright (c) 2021 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
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

var TAG = 'greetingModel';

export default {

    /**
     * 查询应答语
     *
     * @param {string} DAHelper 数据库
     * @param {Object} data 页面最大数量
     * @param {Object} callback 回调
     */
    queryGreeting: async function (DAHelper, data, callback) {
        var resultColumns = ['id', 'name', 'synced'];
        var conditionArgs = new ohosDataAbility.DataAbilityPredicates();
        conditionArgs.orderByAsc('id');
        var resultSet = await DAHelper.query(Constants.uri.VOICEMAIL_URI_PREFIX
        + 'replaying', resultColumns, conditionArgs);
        var result = {};
        result.code = 0;
        var greetingList = [];
        if (resultSet.rowCount > 0) {
            resultSet.goToFirstRow();
            do {
                var jsonObj = {};
                jsonObj.id = resultSet.getString(resultSet.getColumnIndex('id'));
                jsonObj.name = resultSet.getString(resultSet.getColumnIndex('name'));
                jsonObj.synced = resultSet.getString(resultSet.getColumnIndex('synced'));
                jsonObj.radio = false;
                jsonObj.checked = false;
                greetingList.push(jsonObj);
            } while (resultSet.goToNextRow());
        }
        result.greetingList = greetingList;
        LOG.info(TAG + 'queryGreeting' + 'query greeting list =' + result);
        callback(result);
    },

    /**
     * 添加应答语
     *
     * @param {string} DAHelper 数据库
     * @param {Object} data 应答语名称以及应答语储存路径
     * @param {Object} callback 回调
     */
    insertGreeting: async function (DAHelper, data, callback) {
        var insertParamValue = {
            'name': data.name,
            'replying_uri': data.voiceMailUri,
            'synced': '0'
        };
        var result = await DAHelper.insert(Constants.uri.VOICEMAIL_URI_PREFIX + 'replaying', insertParamValue);
        LOG.info(TAG + 'insertGreeting' + 'insert greeting record result = ' + result);
        callback(result);
    },

    /**
     * 删除应答语
     *
     * @param {string} DAHelper 数据库
     * @param {Object} data 应答语名称以及应答语储存路径
     * @param {Object} callback 回调
     */
    deleteGreeting: async function (DAHelper, data, callback) {
        var conditionArgs = new ohosDataAbility.DataAbilityPredicates();
        conditionArgs.in('id', data.ids);
        var result = await DAHelper.delete(Constants.uri.VOICEMAIL_URI_PREFIX + 'replaying', conditionArgs);
        callback(result);
    },

    /**
     * 保存选中的应答语
     *
     * @param {string} DAHelper 数据库
     * @param {Object} data 应答语名称以及应答语储存路径
     * @param {Object} callback 回调
     */
    saveCheckedGreeting: async function (DAHelper, data, callback) {
        var conditionArgs = new ohosDataAbility.DataAbilityPredicates();
        var result = 0;
        if (data.checkedI != -1) {
            conditionArgs.equalTo('id', data.checkedId);
            var updateParams = {
                'synced': '1'
            };
            result = await DAHelper.update(Constants.uri.VOICEMAIL_URI_PREFIX
            + 'replaying', updateParams, conditionArgs);
        }
        conditionArgs = new ohosDataAbility.DataAbilityPredicates();
        conditionArgs.in('id', data.uncheckedIds);
        updateParams = {
            'synced': '0'
        };
        result = await DAHelper.update(Constants.uri.VOICEMAIL_URI_PREFIX + 'replaying', updateParams, conditionArgs);
        callback(result);
    },
};