/**
 * @file 批量选择联系人
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

import callLogService from '../../../../default/model/CalllogModel.js';
import selectContactsAbility from '../../../../default/model/SelectcontactsModel.js';
import httpcontact from '../../../../default/model/ContactModel.js';
import Utils from '../../../../default/utils/utils.js';
import LOG from '../../../utils/ContactsLog.js';
import Constants from '../../../../default/common/constants/Constants.js';
import featureAbility from '@ohos.ability.featureAbility';
import backgroundColor from '../../../common/constants/color.js';
import router from '@system.router';

const SELECT_CONFIRM = 1000; // 确认选择接口
const SEARCH_CONTACTS = 2012; // 搜索联系人

var TAG = 'batchSelectContacts';

export default {
    data: {
        callLogTemp: [], // 最近通话记录
        contactsList: [], // 联系人列表
        layoutState: true, // 简洁布局
        groupList: [], // 群组列表
        backgroundColor: backgroundColor.Color, // 头像背景色
        showGroupList: true, // 是否显示群组列表。当群组列表无数据时，不显示
        selectedNumberMap: new Map(), // 当前总体已选择的数据，key为电话号码，value为 包含电话号码和姓名的obj
        searchText: '', // 搜索关键字
        icCancelM: '/res/image/ic_cancel_m.svg',
        icDeleteM: '/res/image/ic_delete_m.svg',
        icSelectAll: '/res/image/ic_select all_m.svg',
        icComFirm: '/res/image/ic_comfirm.svg',
        titleMessage: '', // 选择联系人界面标题信息
        selectCount: 0, // 选择联系人界面总体已选中条数计数
        allSelectMessage: '',
        allSelectTextStyle: 'batch-select-text',
        selectMessage: '', // 最终选择信息，暂时保留
        isSelectAll: false,
        selectAllClicked: false, // 标识是否点击过全选按钮，如果点击过，则按照排除法批量删除数据
        selectDisabled: true,
        refreshBatchDeleteLogId: 0,
        isFirstInit: true,
        showOption: false, // 是否显示底部全选按钮，当本页签无数据时，不显示
        contactListShow: false, // 是否显示联系人列表，当联系人列表不为空时，显示联系人列表，否则显示空页面
        pageInfo: {
            pageIndex: 0,
            pageSize: 50,
        },
        emptyDataImage: {
            icSelectNoRecent: '',
            icSelectNoContacts: '/res/image/ic_contacts_empty_contact_72.svg',
            icSelectNoGroups: '/res/image/ic_contacts_empty_group.svg',
        },
        tabInfo: {
            tabIndex: 0,
            recentTotal: 0,
            contactsTotal: 0,
            groupsTotal: 0,
            allClickedRecent: false, // 是否点击过全选 ：当点击全选时置为true，当点击取消全选时置为false，适配大数据时的情况
            allClickedContacts: false,
            allClickedGroups: false,
            recentCount: 0, // 各页签的计数
            contactsCount: 0,
            groupsCount: 0,
            refreshGroupItemState: false
        },
        contactsInfo: { // 联系人列表相关数据
            searchContactList: [],
            selectedContactMap: new Map(), // 当前已选择的联系人列表，后续大数据时使用
            searchLayoutShow: false, // 是否显示搜索页
            searchPhoneNum: 0, // 搜索匹配条数
            showSearchList: false, // 是否是搜索列表
            showDefaultNumber: true, // 是否显示默认号码
            showNumberList: true, // 是否显示子号码列表
            phoneCheckShow: true, // 是否显示主号码复选框
            childPhoneCheckShow: true, // 是否显示子号码列表复选框
            contactsListCount: 0,
            contactsListTotal: 0,
            contactsNumberCount: 0, // 对联系人列表已选择的号码计数
        }
    },
    onInit() {
        this.initCallLog();
        this.conciseLayoutInit();
        this.initContactsList();
        this.titleMessage = this.$t('value.callRecords.titleMessageNoSelect');
        this.allSelectMessage = this.$t('value.callRecords.selectAll');
        this.allSelectTextStyle = 'batch-select-text';
    },
    onShow() {
    },

    // 简洁布局选项初始化
    conciseLayoutInit: function () {
        let data = this.$app.$def.globalData.storage.getSync('contacts_settings_concise_layout_switch', 'false');
        this.layoutState = data == 'true' ? false : true;
    },

    /**
     * 改变选择tab
     *
     * @param {Object} e event事件
     */
    changeSelectTab(e) {
        this.tabInfo.tabIndex = e.index;
        this.checkTabListStyle(); // 校验当前页签列表数据选中状态
        this.checkOptionState(); // 校验当前页签选择按钮是否显示
    },

    /* 校验是否需要显示底部全选按钮 */
    checkOptionState() {
        switch (this.tabInfo.tabIndex) {
            case 0:
                Utils.isEmptyList(this.callLogTemp) ? this.showOption = false : this.showOption = true;
                break;

            case 1:
                Utils.isEmptyList(this.contactsList) ? this.showOption = false : this.showOption = true;
                break;

            case 2:
                Utils.isEmptyList(this.groupList) ? this.showOption = false : this.showOption = true;
                break;

            default:
                break;
        }
    },

    /* 点击全选按钮 */
    clickSelectAll(e) {
        switch (this.tabInfo.tabIndex) {
            case 0: // 最近页签
                if (this.tabInfo.recentCount != 0 && this.tabInfo.recentCount == this.tabInfo.recentTotal) { // 已经全选，则取消全选
                    this.tabInfo.allClickedRecent = false;
                    this.unSelectAll();
                } else { // 未全选,则全部选中
                    this.tabInfo.allClickedRecent = true;
                    this.selectAll();
                }
                break;

            case 1: // 联系人列表页签
                if (this.tabInfo.contactsCount != 0 && this.tabInfo.contactsCount == this.tabInfo.contactsTotal) { // 已经全选，则取消全选
                    this.tabInfo.allClickedContacts = false;
                    this.unSelectAll();
                } else { // 未全选,则全部选中
                    this.tabInfo.allClickedContacts = true;
                    this.selectAll();
                }
                break;

            case 2: // 群组页签
                if (this.tabInfo.groupsCount != 0 && this.tabInfo.groupsCount == this.tabInfo.groupsTotal) { // 已经全选，则取消全选
                    this.tabInfo.allClickedGroups = false;
                    this.unSelectAll();
                } else { // 未全选,则全部选中
                    this.tabInfo.allClickedGroups = true;
                    this.selectAll();
                }
                break;

            default:
                break;
        }
        this.refreshPageMessage();
    },

    /**
     * 列表复选框状态变化
     *
     * @param {number} index 下标
     * @param {Object} e event事件
     */
    checkStateChange(index, e) {
        switch (this.tabInfo.tabIndex) {
            case 0: // 最近
                this.changeCallLogItemState(index, e);
                break;

            case 1:
                this.changeContactsItemState(index, e);
                break;

            case 2:
                this.changeGroupsItemState(index, e);
                break;

            default:
                break;
        }
        this.refreshPageMessage();
    },

    /**
     * 最近页签通话记录复选框状态变化
     *
     * @param {number} index 下标
     * @param {Object} e event事件
     */
    changeCallLogItemState: function (index, e) {
        this.callLogTemp[index].checked = e.checked;
        if (this.callLogTemp[index].checked) {
            this.addOrUpdateSelectedNumberMap(this.callLogTemp[index].phone, this.callLogTemp[index].name);
            this.tabInfo.recentCount++;
        } else {
            this.deleteSelectedNumber(this.callLogTemp[index].phone);
            this.tabInfo.recentCount--;
        }
    },

    /**
     * 联系人列表页签通话记录复选框状态变化
     *
     * @param {number} index 下标
     * @param {Object} e event事件
     */
    changeContactsItemState: function (index, e) {
        var contactId = '';
        if (!this.contactsInfo.searchLayoutShow) { // 联系人主列表界面点击复选框
            contactId = this.contactsList[index].contactId;
        } else { // 联系人搜索列表界面点击复选框
            contactId = this.contactsInfo.searchContactList[index].contactId;
        }
        this.checkContactsCount(e, contactId);
    },

    /**
     * 判断当前是否需要增加或减小联系人计数，若所有子号码及主号码都变为未选中，则减1，如果有任何的号码变为选中，则加一
     *
     * @param {Object} e event事件
     * @param {number} contactId 联系人ID
     */
    checkContactsCount(e, contactId) {
        if (this.contactsInfo.searchLayoutShow) { // 当前为搜索页面
            this.contactsInfo.searchContactList.forEach(element => {
                if (contactId == element.contactId) {
                    if (e.detail.checked) {
                        if (!this.checkIfNeedCount(element)) { // 修改前原数据中不存在已选项时，页签计数加1；
                            this.tabInfo.contactsCount++;
                        }
                        element.phoneNumbers[e.detail.numberIndex].checked = true;
                        this.contactsInfo.contactsNumberCount++;
                        this.addOrUpdateSelectedNumberMap(element.phoneNumbers[e.detail.numberIndex].phoneNumber,
                            element.name.fullName);
                    } else {
                        element.phoneNumbers[e.detail.numberIndex].checked = false;
                        this.contactsInfo.contactsNumberCount--;
                        if (!this.checkIfNeedCount(element)) { // 修改后原数据中不存在已选项时，页签计数减1；
                            this.tabInfo.contactsCount--;
                        }
                        this.deleteSelectedNumber(element.phoneNumbers[e.detail.numberIndex].phoneNumber);
                    }
                }
            });
        } else { // 当前为主列表
            this.contactsList.forEach(element => {
                if (contactId == element.contactId) {
                    if (e.detail.checked) {
                        if (!this.checkIfNeedCount(element)) { // 修改前原数据中不存在已选项时，页签计数加1；
                            this.tabInfo.contactsCount++;
                        }
                        element.phoneNumbers[e.detail.numberIndex].checked = true;
                        this.contactsInfo.contactsNumberCount++;
                        this.addOrUpdateSelectedNumberMap(element.phoneNumbers[e.detail.numberIndex].phoneNumber,
                            element.name.fullName);
                    } else {
                        element.phoneNumbers[e.detail.numberIndex].checked = false;
                        this.contactsInfo.contactsNumberCount--;
                        if (!this.checkIfNeedCount(element)) { // 修改后原数据中不存在已选项时，页签计数减1；
                            this.tabInfo.contactsCount--;
                        }
                        this.deleteSelectedNumber(element.phoneNumbers[e.detail.numberIndex].phoneNumber);
                    }
                }
            });
        }
    },

    /**
     * 判断当前联系人元素是否存在已选项，存在则反true，不存在则反false
     *
     * @param {Object} contact 联系人数据
     * @return {boolean} 存在则反true，不存在则反false
     */
    checkIfNeedCount: function (contact) {
        if (contact.phoneNumbers.length > 0) {
            for (var index = 0; index < contact.phoneNumbers.length; index++) {
                const element = contact.phoneNumbers[index];
                if (element.checked) {
                    return true;
                }
            }
        }
        return false;
    },

    /**
     * 群组页签通话记录复选框状态变化
     *
     * @param {number} index 下标
     * @param {Object} e event事件
     */
    changeGroupsItemState: function (index, e) {
        this.groupList[index].checked = e.checked;
        if (this.groupList[index].checked) {
            this.tabInfo.groupsCount++;
        } else {
            this.tabInfo.groupsCount--;
        }
    },

    /* 全选列表项, 每个页签在全选时，将自身的选择结果追加给selectCount */
    selectAll() {
        switch (this.tabInfo.tabIndex) {
            case 0: // 最近页签
                this.selectAllRecentProc();
                break;

            case 1: // 联系人列表页签
                this.selectAllContactProc();
                break;

            case 2: // 群组页签
                this.groupList.forEach(element => {
                    element.checked = true;
                });
                this.tabInfo.groupsCount = this.tabInfo.groupsTotal;
                break;

            default:
                break;
        }
    },

    /* 最近联系页签全选操作 */
    selectAllRecentProc: function () {
        this.callLogTemp.forEach(element => {
            element.checked = true;
            this.addOrUpdateSelectedNumberMap(element.phone, element.name);
        });
        this.tabInfo.recentCount = this.tabInfo.recentTotal;
    },

    /* 联系人全选操作 */
    selectAllContactProc: function () {
        if (this.contactsInfo.searchLayoutShow) { // 搜索界面
            this.contactsInfo.searchContactList.forEach(element => {
                if (!element.phoneNumbers[0].checked) {
                    element.phoneNumbers[0].checked = true;
                    this.addOrUpdateSelectedNumberMap(element.phoneNumbers[0].phoneNumber, element.name.fullName);
                }
            });
        } else { // 若是主列表，则只修改主列表数据
            this.contactsList.forEach(element => {
                if (!element.phoneNumbers[0].checked) {
                    element.phoneNumbers[0].checked = true;
                    this.addOrUpdateSelectedNumberMap(element.phoneNumbers[0].phoneNumber, element.name.fullName);
                }
            });
        }
        this.tabInfo.contactsCount = this.tabInfo.contactsTotal;
    },

    /**
     * 校验主列表联系人是否需要选中，如果已被选中则返回true，否则返回false
     *
     * @param {Array} element 当前元素的数据
     * @return {boolean} 如果已被选中则返回true，否则返回false
     */
    checkIfNeedSelected: function (element) {
        if (this.contactsInfo.selectedContactList.length > 0) {
            this.contactsInfo.selectedContactList.forEach(selectedElement => {
                if (selectedElement.contactId == element.contactId) {
                    return true;
                }
            });
        }
        return false;
    },

    /* 取消全选 */
    unSelectAll() {
        switch (this.tabInfo.tabIndex) {
            case 0: // 最近页签
                this.unSelectAllRecentProc();
                break;

            case 1: // 联系人列表页签
                this.unSelectAllContactProc();
                break;

            case 2: // 群组页签
                this.groupList.forEach(element => {
                    element.checked = false;
                });
                this.tabInfo.groupsCount = 0;
                break;

            default:
                break;
        }
    },

    /* 最近联系列表取消全选 */
    unSelectAllRecentProc: function () {
        this.callLogTemp.forEach(element => {
            element.checked = false;
            if (this.checkIfSelectedNumber(element.phone)) {
                this.deleteSelectedNumber(element.phone);
            }
        });
        this.tabInfo.recentCount = 0;
    },

    /* 联系人列表取消全选 */
    unSelectAllContactProc: function () {
        if (this.contactsInfo.searchLayoutShow) { // 搜索界面
            this.contactsInfo.searchContactList.forEach(element => {
                for (var i = 0; i < element.phoneNumbers.length; i++) {
                    if (element.phoneNumbers[i].checked) {
                        element.phoneNumbers[i].checked = false;
                        this.deleteSelectedNumber(element.phoneNumbers[i].phoneNumber);
                    }
                }
            });
        } else { // 主列表
            this.contactsList.forEach(element => {
                for (var i = 0; i < element.phoneNumbers.length; i++) {
                    if (element.phoneNumbers[i].checked) {
                        element.phoneNumbers[i].checked = false;
                        this.deleteSelectedNumber(element.phoneNumbers[i].phoneNumber);
                    }
                }
            });
        }
        this.tabInfo.contactsCount = 0;
    },

    /**
     * 刷新已选map数据
     *
     * @param {number} number 号码
     * @param {string} name 姓名
     */
    addOrUpdateSelectedNumberMap: function (number, name) {
        if (Utils.isEmpty(number)) {
            return;
        }
        this.selectedNumberMap.set(number.replace(/\s+/g, ''), {
            name: name,
            number: number.replace(/\s+/g, '')
        });
    },

    /**
     * 从已选号码中删除
     *
     * @param {number} number 号码
     */
    deleteSelectedNumber: function (number) {
        if (Utils.isEmpty(number)) {
            return;
        }
        this.selectedNumberMap.delete(number.replace(/\s+/g, ''));
    },

    /**
     * 校验当前号码是否已被选择
     *
     * @param {number} number 号码
     * @return {Object} 校验当前号码是否已被选择
     */
    checkIfSelectedNumber: function (number) {
        if (Utils.isEmpty(number)) {
            return false;
        }
        return this.selectedNumberMap.has(number.replace(/\s+/g, ''));
    },

    /* 标题计数刷新函数 */
    refreshPageMessage() {
        if (this.selectedNumberMap.size > 0) {
            this.titleMessage = this.$t('value.callRecords.titleMessageSelect') + this.selectedNumberMap.size
            + this.$t('value.callRecords.titleMessageUnit');
            this.selectDisabled = false;
            this.checkAllClickButtonStyle();
        } else {
            this.icSelectAll = '/res/image/ic_select all_m.svg';
            this.allSelectMessage = this.$t('value.callRecords.selectAll');
            this.allSelectTextStyle = 'batch-select-text';
            this.titleMessage = this.$t('value.callRecords.titleMessageNoSelect');
            this.selectDisabled = true;
            this.isSelectAll = false;
        }
    },

    /* 校验当前列表电话号码的选中情况 */
    checkTabListStyle: function () {
        switch (this.tabInfo.tabIndex) {
            case 0: // 最近页签，更新通话记录列表
                this.checkRecentListSelectState();
                break;

            case 1: // 联系人列表页签
                this.checkContactsListSelectState();
                break;

            case 2: // 群组页签
                this.checkGroupsListSelectState();
                break;

            default:
                break;
        }
        this.checkAllClickButtonStyle(); // 校验选择按钮状态
    },

    /* 校验最近页签列表数据选中状态 */
    checkGroupsListSelectState: function () {
        if (this.$app.$def.globalData.batchSelectContactsRefreshFunction.length > 0) {
            this.$app.$def.globalData.batchSelectContactsRefreshFunction.forEach((refreshFunction) => {
                refreshFunction(); // 调用下层页面groupListWithContacts注册的刷新函数。
            });
        } // 此处只做属性值变化，下层群组组件检测到变化刷新其列表复选框状态
    },

    /* 校验最近页签列表数据选中状态 */
    checkRecentListSelectState: function () {
        this.tabInfo.recentCount = 0;
        this.callLogTemp.forEach(element => {
            if (this.checkIfSelectedNumber(element.phone)) { // 当前该号码已被选择
                element.checked = true;
            } else if (element.checked) {
                element.checked = false;
            }
            if (element.checked) { // 根据最终判断的结果，若是选定状态，则页签计数加1；
                this.tabInfo.recentCount++;
            }
        });
    },

    /* 校验联系人页签列表数据选中状态 */
    checkContactsListSelectState: function () {
        var tempList = this.contactsInfo.searchLayoutShow ? this.contactsInfo.searchContactList : this.contactsList;
        this.tabInfo.contactsCount = 0; // 现将页签计数清0
        tempList.forEach(element => {
            for (var i = 0; i < element.phoneNumbers.length; i++) {
                if (this.checkIfSelectedNumber(element.phoneNumbers[i].phoneNumber)) {
                    element.phoneNumbers[i].checked = true;
                } else if (element.phoneNumbers[i].checked) { // 若选中状态 但已选列表中不存在，则取消选中
                    element.phoneNumbers[i].checked = false;
                }
            }
            if (this.checkIfNeedCount(element)) { // 根据最终选择结果判断是否需要增加页签计数
                this.tabInfo.contactsCount++;
            }
        });
        this.contactsInfo.searchLayoutShow ? this.contactsInfo.searchContactList
                                             = tempList : this.contactsList = tempList;
    },

    /* 校验全选按钮的显示样式 */
    checkAllClickButtonStyle: function () {
        switch (this.tabInfo.tabIndex) {
            case 0: // 最近页签
                if (this.tabInfo.recentCount == this.tabInfo.recentTotal) {
                    this.changeToFullSelect();
                    this.tabInfo.allClickedRecent = true;
                } else {
                    this.changeToUnFullSelect();
                }
                break;

            case 1: // 联系人列表页签
                if (this.tabInfo.contactsCount == this.tabInfo.contactsTotal) {
                    this.changeToFullSelect();
                    this.tabInfo.allClickedContacts = true;
                } else {
                    this.changeToUnFullSelect();
                }
                break;

            case 2: // 群组页签
                if (this.tabInfo.groupsCount == this.tabInfo.groupsTotal) {
                    this.changeToFullSelect();
                    this.tabInfo.allClickedGroups = true;
                }
                break;
            default:
                break;
        }
    },

    /* 按钮变换为已经全选样式 */
    changeToFullSelect: function () {
        this.icSelectAll = '/res/image/ic_select all_filled_m.svg';
        this.allSelectMessage = this.$t('value.callRecords.unSelectAll');
        this.allSelectTextStyle = 'batch-select-text-selected';
    },

    /* 按钮变换为未全选样式 */
    changeToUnFullSelect: function () {
        this.icSelectAll = '/res/image/ic_select all_m.svg';
        this.allSelectMessage = this.$t('value.callRecords.selectAll');
        this.allSelectTextStyle = 'batch-select-text';
    },

    /**
     * 点击单条通话记录时也会选中或取消复选框
     *
     * @param {number} index 下标
     */
    clickCallLog(index) {
        this.checkStateChange(index, {
            checked: !this.callLogTemp[index].checked
        });
    },

    /* 提交选择结果 */
    doSelect() {
        var checkedList = [];
        this.selectedNumberMap.forEach((value) => {
            checkedList.push(value);
        });
        let contacts = this.dealContactName(checkedList);
        let parameters = {
            contactObjects: JSON.stringify(contacts)
        };
        var result = {
            resultCode: 0,
            want: {
                parameters: parameters
            }
        };
        if (this.selectType == 1) { // 转发
        } else {
            // 短信新建选择联系人
            featureAbility.finishWithResult(result);
            featureAbility.terminateSelf();
        }
    },

    /**
     * 处理选中的联系人的信息
     *
     * @param {Array} checkedList 选中的list
     * @return {boolean} 返回处理后的联系人
     */
    dealContactName(checkedList) {
        let contacts = [];
        for (let item of checkedList) {
            let contact = {
                contactName: item.name,
                telephone: item.number
            };
            contacts.push(contact);
        }
        return contacts;
    },

    /* 返回上一个页面 */
    back() {
        router.back();
    },

    /* 获取最近通话记录 */
    initCallLog() {
        /* 获取通话记录 */
        var tempMap = new Map();// 用于防止号码重复校验
        var tempList = [];// 用于临时存放不重复的item
        var mergeRule = this.$app.$def.globalData.storage.getSync('call_log_merge_rule', 'from_time');
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CALLLOG_DB_URI);
        callLogService.getAllCalls(DAHelper, mergeRule, data => {
            this.$app.$def.globalData.callLogTotalData = data;
            for (var i = 0; i < this.$app.$def.globalData.callLogTotalData.callLogList.length; i++) {
                var element = this.$app.$def.globalData.callLogTotalData.callLogList[i];
                var bgColorIndex = parseInt(element.id, 10) % (this.backgroundColor.length);
                element.portraitColor = this.backgroundColor[bgColorIndex];
                element.suffix = Utils.isEmpty(element.name) ? '' : element.name.substr(element.name.length - 1);
                if (!tempMap.has(Utils.removeSpace(element.phone))) { // 重复的号码无需显示
                    tempList.push(element);
                    tempMap.set(element.phone, null);
                }
                if (tempList.length > 50) { // 显示最近产生通话记录的50条号码
                    break;
                }
            }
            this.callLogTemp = tempList;
            this.tabInfo.recentTotal = this.callLogTemp.length;
            this.checkOptionState();
        });
    },

    /* 根据手机号的LabelId获取LabelName */
    getPhoneLabelNameById: function (phoneLabelId) {
        var labelName = '';
        switch (parseInt(phoneLabelId, 10)) {
            case 1:
                labelName = this.$t('accountants.house');
                break;

            case 2:
                labelName = this.$t('accountants.phone');
                break;

            case 3:
                labelName = this.$t('accountants.unit');
                break;

            case 4:
                labelName = this.$t('accountants.unit fax');
                break;

            case 5:
                labelName = this.$t('accountants.home fax');
                break;

            case 6:
                labelName = this.$t('accountants.pager');
                break;

            case 7:
                labelName = this.$t('accountants.others');
                break;

            case 12:
                labelName = this.$t('accountants.switchboard');
                break;

            case 99:
                labelName = this.$t('accountants.customize');
                break;

            default:
                break;
        }
        return labelName;
    },

    /*
     * 初始化联系人列表数据
     */
    initContactsList: function () {
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        selectContactsAbility.queryContacts(DAHelper, (resultList) => {
            var listTemp = [];
            if (!Utils.isEmptyList(resultList)) {
                for (let element of resultList) {
                    element.name = {};
                    element.name.fullName = element.emptyNameData;
                    element.name.namePrefix = element.namePrefix;
                    element.name.nameSuffix = element.nameSuffix;
                    element.portraitPath = false;
                    if (element.phoneNumbers != null && element.phoneNumbers.length > 0) {
                        element.phoneNumbers.forEach(childEle => {
                            childEle.checked = false;
                            childEle.labelName = this.getPhoneLabelNameById(childEle.labelId);
                            this.initVariableSpan(element);
                        });
                        listTemp.push(element);
                    }
                }
                this.contactsList = listTemp;
                this.tabInfo.contactsTotal = this.contactsList.length;
                this.contactsInfo.contactsListTotal = this.contactsList.length;
            } else {
                LOG.error(TAG + 'select contact list is empty!');
            }
        });
    },

    /**
     * 电话号码去重
     *
     * @param {Object} result 号码详情
     * @return {Object} result 处理后的号码
     */
    duplicateRemoval: function (result) {
        if (Utils.isEmptyList(result.data)) {
            return result;
        }
        var resultList = result.data;
        for (var i = 0; i < resultList.length; i++) {
            var item = resultList[i];
            var phoneNumbersList = [];
            // 倒序排序，去重复的最后一个添加
            for (var j = item.phoneNumbers.length - 1; j >= 0; j--) {
                item.phoneNumbers[j].checked = false;
                var indexOf = this.indexOf(item.phoneNumbers[j], phoneNumbersList);
                // 不存在则添加
                if (indexOf == -1) {
                    phoneNumbersList.push(item.phoneNumbers[j]);
                }
            }
            // 为了减少一次循环搜索名称颜色可变加入此处,初始化可变字体
            this.initVariableSpan(item);
            item.phoneNumbers = phoneNumbersList;
        }
        return result;
    },

    /**
     * 点击事件
     *
     * @param {Object} params 点击下标
     */
    selectClick: function (params) {
        var item = this.contactsList[params.detail.index];
        var index = params.detail.index;
        var indexChild = params.detail.indexChild;
        var speedNumber = item.phoneNumbers[indexChild].phoneNumber;
        this.$app.$def.setSpeedSelectResultData(item, index, indexChild, speedNumber);
    },

    onTextChange: function (text) {
        // 搜索输入框
        this.searchText = text.text;
        this.onSearchTextChange(text.text);
    },
    touchStartSearch: function () {
        this.$element('search').focus({
            focus: true
        })
    },
    // 查询联系人电话是否已在电话列表中
    indexOf: function (item, phoneNumbersList) {
        var index = -1;
        if (Utils.isEmptyList(phoneNumbersList)) {
            return index;
        }
        for (var i = 0; i < phoneNumbersList.length; i++) {
            if (item.phoneNumber == phoneNumbersList[i].phoneNumber) {
                index = i;
                break;
            }
        }
        return index;
    },

    /**
     * 点击事件
     *
     * @param {string} text Value值
     */
    onSearchTextChange: function (text) {
        var requestData = {
            page: 0,
            limit: 0,
            likeValue: text
        };
        var internal = 1;
        var sync = 0;
        var messageCode = SEARCH_CONTACTS;
        var actionData = requestData;
        httpcontact.contactHttp(internal, sync, messageCode, actionData, (result) => {
            if (result.code == 0 && result.contactCount > 0) {
                var resultData = this.duplicateRemoval(result);
                this.contactsInfo.searchContactList = resultData.data;
            } else {
                this.searchContactList = [];
            }
            this.refreshSearchList(text);
        });
    },

    /**
     * 点击事件
     *
     * @param {string} text Value值
     */
    refreshSearchList: function (text) {
        this.contactsInfo.searchPhoneNum = this.contactsInfo.searchContactList.length;
        if (Utils.isEmpty(text)) {
            this.contactsInfo.searchLayoutShow = false;
            this.tabInfo.contactsTotal = this.contactsInfo.contactsListTotal; // 搜索无数据时，总数刷新为主列表总数
            this.emptyText = this.$t('value.selectContact.page.empty');
            if (this.tabInfo.tabIndex == 1) {
                this.checkTabListStyle(); // 校验当前列表数据选中状态
            }
        } else if (Utils.isEmptyList(this.contactsInfo.searchContactList)) {
            // 搜索列表为空,更新搜索文字描述
            this.emptyText = this.$t('value.selectContact.page.emptyText');
            this.contactListShow = false;
            this.contactsInfo.searchLayoutShow = false;
            this.tabInfo.contactsTotal = this.contactsInfo.contactsListTotal; // 搜索无数据时，总数刷新为主列表总数
            if (this.tabInfo.tabIndex == 1) {
                this.checkTabListStyle(); // 校验当前列表数据选中状态
            }
        } else {
            this.contactsInfo.searchLayoutShow = true;
            this.tabInfo.contactsTotal = this.contactsInfo.searchContactList.length; // 搜索有数据时，页签总数刷新为搜索列表总记录数
            this.contactListShow = true;
            this.emptyText = this.$t('value.selectContact.page.empty');
            if (this.tabInfo.tabIndex == 1) {
                this.checkTabListStyle(); // 校验当前列表数据选中状态
            }
        }
    },

    /**
     * 联系人主列表或搜索列表点击复选框事件
     *
     * @param {Object} e event事件
     */
    changeContactState: function (e) {
        this.checkStateChange(e.detail.contactIndex, e); // 调用统一的复选框变化函数
    },

    /**
     * 赋值自定义属性，为后面可变字体搜索做准备
     *
     * @param {Object} item 联系人数据
     */
    initVariableSpan: function (item) {
        // 初始化可变名称
        var matchString = Utils.getMatchedString(item.emptyNameData, this.searchText);
        if (Utils.isEmpty(matchString) || Utils.isEmpty(this.searchText.trim())) {
            item.name.searchTextStart = '';
            item.name.searchTextMiddle = '';
            item.name.searchTextEnd = item.emptyNameData;
        } else {
            var name = item.emptyNameData;
            var index = name.indexOf(matchString);
            item.name.searchTextStart = name.substr(0, index);
            item.name.searchTextMiddle = name.substr(index, matchString.length);
            item.name.searchTextEnd = name.substr(index + matchString.length);
        }
        // 初始化可变手机号
        for (var i = 0; i < item.phoneNumbers.length; i++) {
            var phoneNumber = item.phoneNumbers[i].phoneNumber;
            var matchStringPhone = Utils.getMatchedString(phoneNumber, this.searchText);
            if (Utils.isEmpty(matchStringPhone) || Utils.isEmpty(this.searchText.trim())) {
                item.phoneNumbers[i].startPhone = '';
                item.phoneNumbers[i].middlePhone = '';
                item.phoneNumbers[i].endPhone = phoneNumber;
            } else {
                var phoneIndex = phoneNumber.indexOf(matchStringPhone);
                item.phoneNumbers[i].startPhone = phoneNumber.substr(0, phoneIndex);
                item.phoneNumbers[i].middlePhone = phoneNumber.substr(phoneIndex, matchStringPhone.length);
                item.phoneNumbers[i].endPhone = phoneNumber.substr(phoneIndex + matchStringPhone.length);
            }
        }
    },

    /**
     * 从群组列表添加联系人
     *
     * @param {Object} e event事件
     */
    addCheckedContact(e) {
        e.detail.checkedList.forEach(element => {
            this.selectedNumberMap.set(element.number.replace(/\s+/g, ''), element);
        });
        this.refreshPageMessage();
    },

    /**
     * 从群组列表删除联系人
     *
     * @param {Object} e event事件
     */
    deleteCheckedContact(e) {
        e.detail.checkedList.forEach(element => {
            this.selectedNumberMap.delete(element.number.replace(/\s+/g, ''));
        });
        this.refreshPageMessage();
    },

    /**
     * 修改群组列表状态
     *
     * @param {Object} e event事件
     */
    changeGroupShowState(e) {
        this.showGroupList = e.detail.showGroupList;
    },
};