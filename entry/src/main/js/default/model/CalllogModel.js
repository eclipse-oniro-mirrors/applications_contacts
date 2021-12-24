/**
 * @file: 通话记录model
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
import Utils from '../../default/utils/utils.js';
import Constants from '../common/constants/Constants.js'
import LOG from '../utils/ContactsLog.js';
import telephony from '@ohos.telephony.call';

var TAG = 'calllogModel';

/* 定义通话记录数据库字段 */
export const CALL_LOG_DB_COLUMNS = {
    ID: 'id', // 通话记录id
    PHONE_NUMBER: 'phone_number', // 电话号码
    CONTACT_NAME: 'display_name', // 联系人名称
    CALL_TIME: 'create_time', // 通话记录产生时间
    CALL_DIRECTION: 'call_direction', // 通话类型：1呼入，2呼出，3未接，5拒接
    NUMBER_LOCATION: 'number_location', // 号码归属地
    SIM_ID: 'sim_type', // 通话SIM卡，0：卡1， 1：卡2
    CALL_HD: 'is_hd', // 是否高清通话 true：高清通话，false：非高清通话
    FORMAT_NUMBER: 'format_number', // 格式化电话号码
    IS_READ: 'is_read', // 是否已读
    RING_TIME: 'ring_duration', // 响铃时长
    TALK_TIME: 'talk_duration', // 通话时长
    CONTACT_KEY: 'quicksearch_key', // 联系人id
    ANSWER_STATE: 'answer_state',
    VOICE_MAIL_URI: 'voicemail_uri', // 语音信箱相关
}
export const ANSWER_STATE = {
    MISSED_CALLS : 0, // 未接通
    RECEIVED_CALLS : 1, // 已接通
    REJECT_CALLS: 2 // 拒接
}
export const CALL_DIRECTION = {
    CALL_IN: 0, // 呼入
    CALL_OUT: 1 // 呼出
}
export const CALL_LOG_TYPE = {
    CALL_LOG_IN: 1, // 呼入
    CALL_LOG_OUT: 2, // 呼出
    CALL_LOG_VOICEMAIL: 4, // 语音信箱
    CALL_LOG_MISSED_CALLS: 3, // 未接
    CALL_LOG_REJECTED: 5, // 拒接
}
export default {

    /**
     * 获取全量(2000条)通话记录，并缓存
     *
     * @param {string} DAHelper 数据库路径
     * @param {string} mergeRule  通话记录类型
     * @param {Object} callBack 通话记录数据
     */
    getAllCalls:async function(DAHelper, mergeRule, callBack) {
        // 返回的数据集字段
        var resultColumns = [
            CALL_LOG_DB_COLUMNS.ID,
            CALL_LOG_DB_COLUMNS.PHONE_NUMBER,
            CALL_LOG_DB_COLUMNS.CONTACT_NAME,
            CALL_LOG_DB_COLUMNS.CALL_TIME,
            CALL_LOG_DB_COLUMNS.CALL_DIRECTION,
            CALL_LOG_DB_COLUMNS.NUMBER_LOCATION,
            CALL_LOG_DB_COLUMNS.SIM_ID,
            CALL_LOG_DB_COLUMNS.CALL_HD,
            CALL_LOG_DB_COLUMNS.RING_TIME,
            CALL_LOG_DB_COLUMNS.TALK_TIME,
            CALL_LOG_DB_COLUMNS.ANSWER_STATE,
            CALL_LOG_DB_COLUMNS.FORMAT_NUMBER,
            CALL_LOG_DB_COLUMNS.CONTACT_KEY
        ];
        var condition = new ohosDataAbility.DataAbilityPredicates();
        condition.limitAs(2000).orderByDesc(CALL_LOG_DB_COLUMNS.CALL_TIME).offsetAs(0);
        var resultData = {};
        var resultSet = await DAHelper.query(Constants.uri.CALL_LOG_URI, resultColumns, condition);
        if(Utils.isEmpty(resultSet) || resultSet.rowCount == 0){
            LOG.info(TAG + 'getAllCalls' + 'logMessage callLog resultSet is empty!');
            resultData.callLogList = [];
            resultData.missedList = [];
            resultData.totalCount = 0;
            resultData.missedCount = 0;
            callBack(resultData);
            return;
        }
        resultSet.goToFirstRow();
        var callLogList = [];
        var missedList = [];
        do{
            var callLogItem = {};
            callLogItem.id = resultSet.getString(0);
            callLogItem.phone = resultSet.getString(1);
            callLogItem.name = resultSet.getString(2);
            callLogItem.callTime = resultSet.getString(3);
            callLogItem.callType = this.getCallLogType(resultSet.getString(4),
                resultSet.getString(10));// param: call_direction, answer_state
            callLogItem.callTag = resultSet.getString(5);
            callLogItem.simType = resultSet.getString(6);
            callLogItem.isHd = resultSet.getString(7);
            var formattedNumber = resultSet.getString(1);
            try{
                formattedNumber = await telephony.formatPhoneNumber(resultSet.getString(1));
            }catch{
                formattedNumber = resultSet.getString(1);
            }
            callLogItem.formatNumber = formattedNumber;
            callLogItem.contactKey = resultSet.getString(12); // 通话记录所关联的联系人id
            callLogList.push(callLogItem);
            if (callLogItem.callType == CALL_LOG_TYPE.CALL_LOG_MISSED_CALLS ||
            callLogItem.callType == CALL_LOG_TYPE.CALL_LOG_REJECTED) {
                missedList.push(callLogItem);// 过滤未接来电数据
                let timeList = [];
                if (mergeRule == 'from_contact') { // 过滤按联系人未接电话后又重拨出
                    for (var k = 0; k <  missedList.length; k++) {
                        let missedPhone = missedList[k].phone;
                        for (var i = 0; i < callLogList.length; i++) {
                            let allSpecialPhone = callLogList[i].phone;
                            if (missedPhone == allSpecialPhone ) {
                                let time = callLogList[i].callTime;
                                let timeNumber = parseInt(time);
                                let obj = {
                                    'id': i,
                                    'timeObj': timeNumber,
                                };
                                timeList.push(obj);
                                let max = timeList[0].timeObj;
                                for (var j = 0; j < timeList.length; j++) {
                                    if (timeList[j].timeObj > max) {
                                        max = timeList[j].timeObj;
                                        let n = timeList[j].id;
                                        if (callLogList[n].callType == CALL_LOG_TYPE.CALL_LOG_OUT) {
                                            missedList.splice(k,1);
                                        }
                                    } else {
                                        let m = timeList[0].id
                                        if (callLogList[m].callType == CALL_LOG_TYPE.CALL_LOG_OUT) {
                                            missedList.splice(k,1);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } while(resultSet.goToNextRow());
        if (mergeRule == 'from_contact') {
            resultData.callLogList = this.fillCallLogDataMergeByContact(callLogList);
            resultData.missedList = this.fillCallLogDataMergeByContact(missedList);
            resultData.totalCount = resultData.callLogList.length;
            resultData.missedCount = resultData.missedList.length;
        } else {
            resultData.callLogList = this.fillCallLogDataMergeByTime(callLogList);
            resultData.missedList = this.fillCallLogDataMergeByTime(missedList);
            resultData.totalCount = resultSet.rowCount;
            resultData.missedCount = missedList.length;
        }
        resultSet.close();
        callBack(resultData);
    },

    /**
     * 获取语音信箱列表
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} callBack 语音信箱列表
     */
    getVoicemailList: async function(DAHelper, callBack) {
        var condition = new ohosDataAbility.DataAbilityPredicates();
        condition.orderByDesc('create_time');
        var resultColumns = [
            'id',
            'phone_number',
            'display_name',
            'voicemail_uri',
            'voicemail_type',
            'voice_file_size',
            'voice_duration',
            'voice_status',
            'origin_type',
            'create_time',
        ];
        var resultSet = await DAHelper.query(Constants.uri.VOICEMAIL_URI, resultColumns, condition);
        var voicemailList = [];
        if (Utils.isEmpty(resultSet) || resultSet.rowCount == 0) {
            callBack(voicemailList);
            LOG.error(TAG + 'getVoicemailList' + 'logMessage voicemailList is empty! resultSet = ' + resultSet);
            return;
        }
        resultSet.goToFirstRow();
        do{
            var voicemailItem = {};
            voicemailItem.id = resultSet.getString(0);
            voicemailItem.phone = resultSet.getString(1);
            voicemailItem.name = resultSet.getString(2);
            voicemailItem.uri = resultSet.getString(3); // voicemail_uri
            voicemailItem.callTime = this.getCallTime(resultSet.getString(9)); // create_time
            voicemailItem.callType = CALL_LOG_TYPE.CALL_LOG_VOICEMAIL;// param: call_direction, answer_state
            voicemailItem.callTag = resultSet.getString(4); // voicemail_type
            try{
                voicemailItem.formatNumber = await telephony.formatPhoneNumber(resultSet.getString(1));
            }catch{
                voicemailItem.formatNumber = resultSet.getString(1);
            }
            voicemailItem.timeDuration = resultSet.getString(6);
            voicemailItem.voicemailDuration = this.getTimeString(resultSet.getString(6)) // voice_duration
            voicemailItem = this.fillServiceProperty(voicemailItem);
            voicemailList.push(voicemailItem);
        } while(resultSet.goToNextRow());
        resultSet.close();
        callBack(voicemailList);
    },

    /**
     * 根据所给的秒数生成00:00类型字符串
     *
     * @param {number} secondsString 一段语音信箱的时间
     * @return {string} 语音信箱播放的时间
     */
    getTimeString(secondsString) {
        var timeString = '00:00';
        var seconds= parseInt(secondsString);
        if (seconds > 60) {
            var minutes = parseInt(seconds/60);
            timeString = (minutes < 10 ? ('0'+minutes) : minutes)+':'
            +((seconds%60) < 10 ? ('0'+(seconds%60)) : (seconds%60));
        } else {
            timeString = '00:'+(seconds < 10 ? ('0'+seconds) : seconds);
        }
        return timeString;
    },

    /**
     * 获取通话记录类型
     *
     * @param {string} callDirection 呼叫类型
     * @param {string} answerState  通话是否接通
     * @return {string} 呼出类型
     */
    getCallLogType(callDirection, answerState) {
        if (callDirection == CALL_DIRECTION.CALL_IN) { // 呼入
            if (answerState == ANSWER_STATE.RECEIVED_CALLS) {// 呼入接通
                return CALL_LOG_TYPE.CALL_LOG_IN;
            }
            if (answerState == ANSWER_STATE.MISSED_CALLS) {// 呼入未接
                return CALL_LOG_TYPE.CALL_LOG_MISSED_CALLS
            }
            if (answerState == ANSWER_STATE.REJECT_CALLS) {// 呼入拒接
                return CALL_LOG_TYPE.CALL_LOG_REJECTED;
            }
        } else { // 呼出
            return CALL_LOG_TYPE.CALL_LOG_OUT;
        }
    },

    /**
     * 分页获取通话记录列表
     *
     * @param {number} pageIndex 页面索引
     * @param {number} pageSize  一页多少条数据
     * @param {Array} callLogList  通话记录列表
     * @return {Array} 通话记录列表
     */
   getCallLog:function(pageIndex, pageSize, callLogList) {
       var tempList = [];
       if (Utils.isEmptyList(callLogList)) {
           return [];
       }
       var length = callLogList.length;
       if (length > (pageIndex+1)*pageSize) {
           for (var i = pageIndex * pageSize; i < (pageIndex+1)*pageSize; i++) {
               tempList.push(callLogList[i]);
           }
       } else {
           for (var i = pageIndex * pageSize; i < length; i++) {
               tempList.push(callLogList[i]);
           }
       }
       return tempList;
   },

    /**
     * 根据电话号码数组获取这些号码的所有通话记录，用于通话记录详情展示
     *
     * @param {string} DAHelper 数据库路径
     * @param {Array} phoneNumbers 电话号码
     * @param {Object} callBack 回调
     */
    async getCallLogListByPhoneNumber(DAHelper, phoneNumbers, callBack) {
        if (Utils.isEmptyList(phoneNumbers)) {
            return [];
        }
        var realPhoneNumbers = [];
        for (var i = 0; i < phoneNumbers.length; i++) {
            realPhoneNumbers.push(Utils.removeSpace(phoneNumbers[i]));
        }
        var condition = new ohosDataAbility.DataAbilityPredicates();
        condition.in(CALL_LOG_DB_COLUMNS.PHONE_NUMBER, realPhoneNumbers).orderByDesc(CALL_LOG_DB_COLUMNS.CALL_TIME);
        // 返回的数据集字段
        var resultColumns = [
            CALL_LOG_DB_COLUMNS.ID,
            CALL_LOG_DB_COLUMNS.PHONE_NUMBER,
            CALL_LOG_DB_COLUMNS.CONTACT_NAME,
            CALL_LOG_DB_COLUMNS.CALL_TIME,
            CALL_LOG_DB_COLUMNS.CALL_DIRECTION,
            CALL_LOG_DB_COLUMNS.NUMBER_LOCATION,
            CALL_LOG_DB_COLUMNS.SIM_ID,
            CALL_LOG_DB_COLUMNS.CALL_HD,
            CALL_LOG_DB_COLUMNS.RING_TIME,
            CALL_LOG_DB_COLUMNS.TALK_TIME,
            CALL_LOG_DB_COLUMNS.ANSWER_STATE,
            CALL_LOG_DB_COLUMNS.FORMAT_NUMBER
        ];
        var resultSet = await DAHelper.query(Constants.uri.CALL_LOG_URI, resultColumns, condition);
        var resultList = [];
        if(Utils.isEmpty(resultSet) || resultSet.rowCount == 0){
            callBack(resultList);
            return;
        }
        resultSet.goToFirstRow();
        do{
            var callLogItem = {};
            callLogItem.id = resultSet.getString(0);
            callLogItem.phone = resultSet.getString(1);
            callLogItem.name = resultSet.getString(2);
            callLogItem.callTime = resultSet.getString(3);
            callLogItem.callType = this.getCallLogType(resultSet.getString(4),
                resultSet.getString(10));// param: call_direction, answer_state
            callLogItem.callTag = resultSet.getString(5);
            callLogItem.simType = resultSet.getString(6);
            callLogItem.isHd = resultSet.getString(7);
            callLogItem.ringTime = resultSet.getString(8);
            callLogItem.talkTime = resultSet.getString(9);
            var formattedNumber = resultSet.getString(1);
            try{
                formattedNumber = await telephony.formatPhoneNumber(resultSet.getString(1));
            }catch{
                formattedNumber = resultSet.getString(1);
            }
            callLogItem.formatNumber = formattedNumber;
            resultList.push(callLogItem);
        } while(resultSet.goToNextRow());
        resultSet.close();
        callBack(resultList);
    },

    /**
     * 清空通话记录
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} callBack 回调
     */
    clearCallLog(DAHelper, callBack) {
        var condition = new ohosDataAbility.DataAbilityPredicates();
        DAHelper.delete(Constants.uri.CALL_LOG_URI, condition).then(data=>{
        callBack();
        }).catch(error=>{
            LOG.error(TAG + 'clearCallLog' + 'logMessage delete call log error:' + error);
        });
    },

    /**
     * 清空语音信箱
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} callBack 回调
     */
    clearVoicemailList(DAHelper, callBack) {
        var condition = new ohosDataAbility.DataAbilityPredicates();
        DAHelper.delete(Constants.uri.VOICEMAIL_URI, condition).then(data=>{
            callBack();
        }).catch(error=>{
            LOG.error(TAG + 'clearVoicemailList' + 'logMessage delete call log error:' + error);
        });
    },

    /**
     * 按联系人合并情况下，通过指定的电话号码或联系人id删除通话记录
     *
     * @param {string} DAHelper 数据库路径
     * @param {Array} phoneNumbers  电话号码
     * @param {number} contactKeys 联系人ID
     * @param {Object} callBack 回调
     */
    deleteCallLogByNumbersOrContacts:async function(DAHelper, phoneNumbers, contactKeys, callBack) {
        var condition = new ohosDataAbility.DataAbilityPredicates();
        if (!Utils.isEmptyList(phoneNumbers)) {
            condition = condition.in(CALL_LOG_DB_COLUMNS.PHONE_NUMBER, phoneNumbers);
        }
        if (!Utils.isEmptyList(phoneNumbers) && !Utils.isEmptyList(contactKeys)) {
            condition = condition.or();
        }
        if (!Utils.isEmptyList(contactKeys)) {
            condition = condition.in(CALL_LOG_DB_COLUMNS.CONTACT_KEY, contactKeys);
        }
        await DAHelper.delete(Constants.uri.CALL_LOG_URI, condition);
        callBack();
    },

    /**
     * 按照id删除指定通话记录
     *
     * @param {string} DAHelper 数据库路径
     * @param {Array} ids  联系人ID
     * @param {Object} callBack 回调
     */
    deleteCallLogByIds: async function (DAHelper, ids, callBack) {
        if (Utils.isEmptyList(ids)) {
            return;
        }
        var condition = new ohosDataAbility.DataAbilityPredicates();
        condition.in(CALL_LOG_DB_COLUMNS.ID, ids);
        await DAHelper.delete(Constants.uri.CALL_LOG_URI, condition);
        callBack();
    },

    /**
     * 按照id删除指定语音信箱记录
     *
     * @param {string} DAHelper 数据库路径
     * @param {Array} ids  联系人ID
     * @param {Object} callBack 回调
     */
    deleteVoicemailByIds: async function (DAHelper, ids, callBack) {
        if (Utils.isEmptyList(ids)) {
            return;
        }
        var condition = new ohosDataAbility.DataAbilityPredicates();
        condition.in('id', ids);
        await DAHelper.delete(Constants.uri.VOICEMAIL_URI, condition);
        callBack();
    },

    /**
     * 删除除指定的ids之外的记录
     *
     * @param {string} DAHelper 数据库路径
     * @param {Array} ids  联系人ID
     * @param {Object} callBack 回调
     */
    deleteOtherCallLog(DAHelper, ids, callBack) {
        if (Utils.isEmptyList(ids)) {
            return;
        }
        var condition = new ohosDataAbility.DataAbilityPredicates();
        for (var index = 0; index < ids.length; index++) {
            condition = condition.notEqualTo('id',ids[index]);
        }
        DAHelper.delete(Constants.uri.CALL_LOG_URI, condition).then(data=>{
            LOG.info(TAG + 'deleteOtherCallLog' + 'logMessage delete call log by other ids success!!! data:'+data);
            callBack();
        }).catch(error=>{
            LOG.error(TAG + 'deleteOtherCallLog' + 'logMessage delete call log error:' + error);
        });
    },

    /**
     * 按联系人合并的情况下，在原通话记录数据基础上完善通话记录业务数据后处理
     *
     * @param {Array} callLogList 通话记录
     * @return {Array} 通话记录
     */
    fillCallLogDataMergeByContact: function(callLogList) {
        var resultList = [];
        if (Utils.isEmptyList(callLogList)) {
            return resultList;
        }
        var contactTempMap = new Map();
        var phoneNumberMap = new Map();
        for (var i = 0; i < callLogList.length; i++) {
            var element = this.fillServiceProperty(callLogList[i]);
            element.callTime = this.getCallTime(callLogList[i].callTime);
            element.num = 1; // 按联系人合并的情况下，合并记录条目固定为1
            element.ids = [element.id]; // 按联系人合并的情况下，合并记录ids固定为本身id
            if (Utils.isEmpty(element.contactKey)) { // 没有联系人的通话记录，按照电话号码合并
                if (!phoneNumberMap.has(element.phone)) {
                    resultList.push(element);
                    phoneNumberMap.set(element.phone);
                }
            } else { // 有联系人的通话记录，按照联系人合并
                let isContactKey = contactTempMap.has(element.contactKey);
                if (!isContactKey) {
                    resultList.push(element);
                    contactTempMap.set(element.contactKey);
                }
            }
        }
        return resultList;
    },

    /**
     * 按时间合并情况下，在原通话记录数据基础上完善通话记录业务数据后处理
     *
     * @param callLogList 通话记录
     * @return
     */
    fillCallLogDataMergeByTime: function(callLogList) {
        var resultList = [];
        if (Utils.isEmptyList(callLogList)) {
            return resultList;
        }
        var tempElement = this.fillServiceProperty(callLogList[0]); // 从第一条记录开始，缓存通话记录
        var tempCallTime = tempElement.callTime; // 保留最近一条记录的创建时间，在通话记录合并后，显示该时间。
        var tempCallType = tempElement.callType; // 保留最近一条记录的通话记录类型，在通话记录合并后，显示该类型。
        var num = 1;
        var ids = [];
        ids.push(callLogList[0].id);
        for (var i = 1; i < callLogList.length; i++) {
            var element = callLogList[i];
            if(this.callLogMergeCheck(tempElement, element)) {// 缓存字段与当前字段校验是否需要合并
                num++;
                ids.push(element.id);// 将最新记录id放入合并数组
            } else {
                /* 最新数据和缓存不一致，则替换缓存数据的num及ids数据，并将缓存的数据记录放入结果集*/
                tempElement.num = num;
                tempElement.ids = ids;
                tempElement.callTime = this.getCallTime(tempCallTime); // 显示已保存的最近一条记录的创建时间
                tempElement.callType = tempCallType;
                resultList.push(tempElement);
                /* 重置num及ids为最新计数及记录 ，重置tempCallTime为下条记录的最新创建时间*/
                num = 1;
                ids = [];
                tempCallTime = element.callTime;
                tempCallType = element.callType;
                ids.push(element.id);
            }
            tempElement = this.fillServiceProperty(element);
        }
        /* 将最后一条缓存数据放入结果集*/
        if (tempElement != null) {
            tempElement.num = num;
            tempElement.ids = ids;
            tempElement.callTime = this.getCallTime(tempCallTime);
            tempElement.callType = tempCallType;
            resultList.push(tempElement);
        }
        return resultList;
    },

    /**
     * 按时间合并情况下，校验两条通话记录是否需要合并,需要合并返回true，否则返回false
     *
     * @param oldElement 合并前通话记录
     * @param newElement 合并后通话记录
     * @return
     */
    callLogMergeCheck:function(oldElement, newElement){
        /* 合并规则：
           1.电话号码相同前提下才会合并。
           2.号码相同的前提下，呼叫类型为1,2或3,5则合并。1,2和3,5类型不合并。
        */
        if (oldElement.phone.trim() == newElement.phone.trim()) { // 电话号码相同
            if (oldElement.callType == 1||oldElement.callType == 2) {
                if (newElement.callType == 1 || newElement.callType ==2) {
                    return true;
                }
                return false;
            }
            if (newElement.callType == 3 || newElement.callType == 5) {
                return true;
            }
        }
        return false;
    },

    /**
     * 添加业务所需数据属性
     *
     * @param element 通话记录
     * @return
     */
    fillServiceProperty:function (element) {
        element.leftDst = 0; // 初始化左移偏移量
        element.checked = false; // 初始化复选框状态
        if (element.callType == CALL_LOG_TYPE.CALL_LOG_VOICEMAIL) { // 语音信箱时，初始化额外的语音信箱相关属性
            element.showMail = false; // 默认不显示语音信箱播放器
            element.start = '00:00';
            element.percent = 0;
            element.playState = 'start';
            element.volumeState = 'volume';
            element.percentProgress = 0;
            element.ids = [element.id];
            element.num = 1;
        }
        return element;
    },

    /**
     * 获取通话时间
     *
     * @param date 通话记录创建时间戳
     * @return {object} 通话时间
    */
    getCallTime(date) {
        let result = "";
        if (isNaN(date)) { // 非数字时，不进行解析
            return date;
        }
        var timestamp = parseInt(date)*1000;
        // 通话时间
        let callTime = new Date(timestamp);
        // 当前时间
        let now = new Date();
        if (callTime.getTime() > now.getTime()) {
            result = callTime.getFullYear() + '/' + (callTime.getMonth()+1) + '/' + callTime.getDate();
        } else if (callTime.getFullYear() == now.getFullYear()) {
            // 同年
            if (callTime.getMonth() == now.getMonth()) {
                // 同年同月
                let timeDiff = parseInt((now.getTime() - callTime.getTime()) / 60000);
                let dayDiff = now.getDate() - callTime.getDate();
                if (dayDiff == 0) {
                    // 同天
                    if (timeDiff == 0) {
                        result = '刚刚';
                    } else if (timeDiff < 60) {
                        result = timeDiff + '分钟前';
                    } else {
                        // 'hh:mm'
                        result = callTime.getHours()
                        + ':' + (callTime.getMinutes() < 10 ? '0' + callTime.getMinutes() : callTime.getMinutes());
                    }
                } else if (dayDiff == 1) {
                    // 昨天
                    result = '昨天';
                } else {
                    result = (callTime.getMonth()+1) + '/' + callTime.getDate();// 'MM/dd'
                }
            } else {
                result = (callTime.getMonth()+1) + '/' + callTime.getDate();
            }
        } else {
            // 'yyyy/MM/dd'
            result = callTime.getFullYear() + '/' + (callTime.getMonth()+1) + '/' + callTime.getDate();
        }
        return result;
    }
}
