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
import callLogService from '../../../../default/model/CalllogModel.js';
import router from '@system.router';
import LOG from '../../../utils/ContactsLog.js';
import Constants from '../../../../default/common/constants/Constants.js';
import Utils from '../../../../default/utils/utils.js';

var TAG = 'callLogDelete...:';

export default {
    data: {
        callLogTemp: [],
        callLogMergeRule: '',
        ic_cancle_m: '/res/image/ic_cancel_m.svg',
        ic_delete_m: '/res/image/ic_delete_m.svg',
        ic_select_all: '/res/image/ic_select all_m.svg',
        titleMessage: '',
        totalCount: 0,
        selectCount: 0,
        allSelectMessage: '',
        allSelectTextStyle: 'batch-delete-text',
        deleteMessage: '',
        isSelectAll: false,
        selectAllClicked: false, // 标识是否点击过全选按钮，如果点击过，则按照排除法批量删除数据
        deleteDisabled: true,
        refreshBatchDeleteLogId: 0,
        from_contact: ' from_contact',
        /*isFirstInit: true,*/
        pageInfo: {
            pageIndex: 0,
            pageSize: 20,
        }
    },
    onInit() {
        LOG.info(TAG + 'onInit success')
        if (this.logIndex == 2) {// 语音信箱
            this.totalCount = this.$app.$def.globalData.voicemailTotalData.voicemailCount;
        } else if (this.logIndex == 1) {
            this.totalCount = this.$app.$def.globalData.callLogTotalData.missedCount;
        } else {
            this.totalCount = this.$app.$def.globalData.callLogTotalData.totalCount;
        }
        this.callLogMergeRule = this.$app.$def.globalData.storage.getSync('call_log_merge_rule', 'from_time');
        this.getCallLog(this.pageInfo.pageIndex, this.pageInfo.pageSize);
        this.titleMessage = this.$t('value.callRecords.titleMessageNoSelect');
        this.allSelectMessage = this.$t('value.callRecords.selectAll');
        this.allSelectTextStyle = 'batch-delete-text';
    },
    onDestroy() {
        LOG.info(TAG + 'logMessage onDestroy calllogDelete');
    },
/* 点击全选按钮 */
    clickSelectAll(e) {
        LOG.info(TAG + 'clickSelectAll e' + e.target);
        if (!this.isSelectAll) { // 全选
            this.selectAllClicked = true;
            this.selectAll();
        } else { // 点击取消全选按钮，
            this.selectAllClicked = false;
            this.unSelectAll();
        }
        this.refreshPageMessage();
    },
/* 列表复选框状态变化 */
    checkStateChange(e) {
        LOG.info(TAG + 'checkStateChange e' + e.target);
        this.callLogTemp[e.detail.index].checked = e.detail.checked;
        this.selectCount = e.detail.checked ? this.selectCount + e.detail.num : this.selectCount - e.detail.num; // 若复选框选中，则计数加1，未选中则计数-1
        this.refreshPageMessage();
    },
/* 全选列表项 */
    selectAll() {
        LOG.info('logMessage selectAll!!!');
        this.callLogTemp.forEach(element => {
            element.checked = true;
        });
        this.selectCount = this.totalCount;
    },

/* 取消全选 */
    unSelectAll() {
        this.callLogTemp.forEach(element => {
            element.checked = false;
        });
        this.selectCount = 0; // selectCount清零
    },

/* 标题计数刷新函数 */
    refreshPageMessage() {
        if (this.selectCount > 0) {
            this.titleMessage = this.$t('value.callRecords.titleMessageSelect') + this.selectCount +
            this.$t('value.callRecords.titleMessageUnit');
            this.deleteDisabled = false;
            if (this.selectCount == this.totalCount) { // 全选情况按钮状态刷新
                this.ic_select_all = '/res/image/ic_select all_filled_m.svg';
                this.allSelectMessage = this.$t('value.callRecords.unSelectAll');
                this.allSelectTextStyle = 'batch-delete-text-selected';
                this.isSelectAll = true;
                /* 是否删除全部通话记录 */
                this.deleteMessage = this.$t('value.callRecords.deleteMessageAsk') +
                this.$t('value.callRecords.deleteMessageAll') + this.$t('value.callRecords.deleteMessageCalls');
            } else {
                this.ic_select_all = '/res/image/ic_select all_m.svg';
                this.allSelectMessage = this.$t('value.callRecords.selectAll');
                this.allSelectTextStyle = 'batch-delete-text';
                this.isSelectAll = false;
                if (this.selectCount == 1) {
                    /* 是否删除此通话记录 */
                    this.deleteMessage = this.$t('value.callRecords.deleteMessageAsk') +
                    this.$t('value.callRecords.deleteMessageThis') + this.$t('value.callRecords.deleteMessageCalls');
                } else {
                    /* 是否删除selectCount条通话记录 */
                    this.deleteMessage = this.$t('value.callRecords.deleteMessageAsk') + this.selectCount +
                    this.$t('value.callRecords.deleteMessageUnit') + this.$t('value.callRecords.deleteMessageCalls');
                }
            }
        } else {
            this.selectCount = 0;
            this.ic_select_all = '/res/image/ic_select all_m.svg';
            this.allSelectMessage = this.$t('value.callRecords.selectAll');
            this.allSelectTextStyle = 'batch-delete-text';
            this.titleMessage = this.$t('value.callRecords.titleMessageNoSelect');
            this.deleteDisabled = true;
            this.isSelectAll = false;
        }
    },
/* 批量删除选中的通话记录 */
    deleteCheckedCalls() {
        LOG.info('logMessage click delete !!!');
        this.$element('deleteCheckDialog').show(); // 显示删除提示框
    },
    doDelete() {
        if (this.isSelectAll && this.logIndex == 0) { // 全选删除,全部通话记录
            this.callLogTemp = [];
            /* 清空通话记录 */
            var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CALLLOG_DB_URI);
            callLogService.clearCallLog(DAHelper, () => {
                this.$app.$def.globalData.callLogTotalData.callLogList = [];
                this.$app.$def.globalData.callLogTotalData.missedList = [];
                this.$app.$def.globalData.callLogTotalData.totalCount = 0;
                this.$app.$def.globalData.callLogTotalData.missedCount = 0;
                router.back();
            });
        } else {
            if (this.logIndex == 2) { // 语音信箱
                if (this.isSelectAll) { // 语音信箱全量删除
                    this.callLogTemp = [];
                    /* 清空通话记录 */
                    var DAHelper = this.$app.$def.getDAHelper(Constants.uri.VOICEMAIL_DB_URI);
                    callLogService.clearVoicemailList(DAHelper, () => {
                        this.$app.$def.globalData.voicemailTotalData.voicemailList = [];
                        this.$app.$def.globalData.voicemailTotalData.voicemailCount = 0;
                        router.back();
                    });
                } else { // 语音信箱非全量删除
                    this.doDeleteVoicemail();
                }
            } else {
                /* 通话记录非全选情况批量删除 */
                if (this.callLogMergeRule == this.from_contact) {
                    this.doDeleteByContactMerge();
                } else {
                    this.doDeleteByTimeMerge();
                }
            }
        }
        this.$element('deleteCheckDialog').close();
    },
    /* 执行语音信箱删除操作 */
    doDeleteVoicemail() {
        var unCheckedList = [];
        var voicemailIds = [];
        this.callLogTemp.forEach(element => {
            if (element.checked) { // 被选中的元素
                voicemailIds.push(element.id);
            } else {
                unCheckedList.push(element);
            }
        });
        this.callLogTemp = unCheckedList;
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.VOICEMAIL_DB_URI);
        callLogService.deleteVoicemailByIds(DAHelper, voicemailIds, ()=>{
            this.back();
        });
    },
    /* 按联系人合并通话记录情况下，批量删除的处理函数 */
    doDeleteByContactMerge() {
        var unCheckedList = [];
        var numberList = []; // 用于存储没有联系人的通话记录的电话号码
        var contactIds = []; // 用于存储有联系人通话记录的quicksearch_key(联系人id)
        this.callLogTemp.forEach(element => {
            if (element.checked) { // 被选中的元素
                if (Utils.isEmpty(element.contactKey)) {// 号码没有关联联系人
                    numberList.push(element.phone);
                } else { // 号码已关联联系人
                    contactIds.push(element.contactKey);
                }
            } else {
                unCheckedList.push(element);
            }
        });
        this.callLogTemp = unCheckedList;
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CALLLOG_DB_URI);
        callLogService.deleteCallLogByNumbersOrContacts(DAHelper, numberList, contactIds, ()=>{
            LOG.info('logMessage delete call log by contacts or number callBack success!');
            this.back();
        });

    },
    /* 按时间合并通话记录情况下，批量删除的处理函数 */
    doDeleteByTimeMerge() {
        var unCheckedList = [];
        var checkedList = [];
        var removeIds = [];
        this.callLogTemp.forEach(element => {
            if (element.checked) { // 被选中的元素
                checkedList.push(element);
                if (!this.selectAllClicked || this.logIndex == 1) {
                    // 非全选的情况 或未接来电 将选中的元素传给后台删除
                    element.ids.forEach(elementId => {
                        removeIds.push(elementId);
                    });
                }
            } else {
                unCheckedList.push(element);
                if (this.selectAllClicked && this.logIndex != 1) { // 全选且非未拒接来电跳转的情况，将未选中的元素传给后台排除删除
                    element.ids.forEach(elementId => {
                        removeIds.push(elementId);
                    });
                }
            }
        });
        this.callLogTemp = unCheckedList;
        if (!this.selectAllClicked || this.logIndex == 1) { // 未点击全选或当前是未拒接来电，则按照选中id删除。
            LOG.info('logMessage delete by ids:' + removeIds);
            var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CALLLOG_DB_URI);
            callLogService.deleteCallLogByIds(DAHelper, removeIds, () => {
                LOG.info('logMessage delete call log callBack success!!!');
                this.back();
            });
        } else {
            var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CALLLOG_DB_URI);
            callLogService.deleteOtherCallLog(DAHelper, removeIds, ()=>{
                LOG.info('logMessage delete other call log callBack success!!!');
                this.back();
            });
        }
    },
/* 取消删除 */
    cancelDialog() {
        this.$element('deleteCheckDialog').close();
    },
/* 返回上一个页面 */
    back() {
        router.back();
    },
    requestLogByPage() {
        if (this.logIndex != 2) {
            this.pageInfo.pageIndex++;
        }
        this.getCallLog(this.pageInfo.pageIndex, this.pageInfo.pageSize);
    },
    getCallLog(pageIndex, pageSize) {
        var pageList = [];
        if (this.logIndex == 2) {// 语音信箱
            pageList = this.callLogList;
        } else {
            pageList = callLogService.getCallLog(pageIndex, pageSize, this.callLogList);
        }
        if (this.selectAllClicked) { // 点击过全选
            pageList.forEach((element) => {
                element.checked = true;
            });
        }
        LOG.info('logMessage batchDelete selectAllClicked = ');
        if (pageIndex == 0) {
            this.callLogTemp = pageList;
        } else {
            this.callLogTemp = this.callLogTemp.concat(pageList);
        }
    }
};
