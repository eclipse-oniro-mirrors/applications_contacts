/**
 * @file 联系人分组列表
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
import router from '@system.router';
import groupReq from '../../../../../default/model/GroupsModel.js';
import LOG from '../../../../utils/ContactsLog.js';
import Constants from '../../../../../default/common/constants/Constants.js';

var TAG = 'groupListWithContacts...:';

export default {
    props: ['titleShow', 'checkItemState', 'checkedNumberMap'],
    data: {
        page: 0, // 初始加载当前页
        limit: 20,
        groupList: [],
        favoritesItem: {
            contactBeans: [],
            checked: false,
            expand: false,
            contactCount: 0,
        },
        phoneNumberLabelNames: [],
        title: '', // 页面标题
        layoutState: true, // 简介布局
        checkedNum: 0 // 已选数量
    },
    onInit() {
        LOG.info(TAG + 'onInit success');
        this.title = this.$t('value.contacts.groupsPage.noSelect');

        this.phoneNumberLabelNames = [this.$t('accountants.house'), this.$t('accountants.phone'),
        this.$t('accountants.unit'), this.$t('accountants.unit fax'), this.$t('accountants.home fax'),
        this.$t('accountants.pager'), this.$t('accountants.others'), '', '', '', '',
        this.$t('accountants.switchboard')];

        this.conciseLayoutInit();
        var requestData = {
            page: this.page,
            limit: this.limit,
            phoneNumberLabelNames: this.phoneNumberLabelNames,
            filterItem: 'phone'
        };
        this.getGroupList(requestData);
        this.$app.$def.globalData.batchSelectContactsRefreshFunction.push(()=> {
            /* 刷新群组联系人列表复选框状态 */
            this.groupList.forEach((groupItem) => {
                this.refreshContactCheckState(groupItem);
            });
            /* 刷新收藏列表复选框状态 */
            this.refreshContactCheckState(this.favoritesItem);
        });
    },

    // 简洁布局选项初始化
    conciseLayoutInit: function () {
        LOG.info(TAG + 'conciseLayoutInit success');
        let data = this.$app.$def.globalData.storage.getSync('contacts_settings_concise_layout_switch', 'false');
        this.layoutState = data == 'true' ? false : true;
    },

    /* 刷新群组列表复选框状态 */
    refreshCheckState: function () {
        /* 刷新群组联系人列表复选框状态 */
        this.groupList.forEach((groupItem) => {
            LOG.info(TAG + 'refreshCheckState groupItem' + groupItem);
            this.refreshContactCheckState(groupItem);
        });
        /* 刷新收藏列表复选框状态 */
        this.refreshContactCheckState(this.favoritesItem);
    },
    refreshContactCheckState: function (groupItem) {
        LOG.info(TAG + 'refreshContactCheckState groupItem' + groupItem);
        groupItem.checked = false;
        var expandChecked = true; // 是否需要选中群组;
        var tempContactBeans = [];
        groupItem.contactBeans.forEach((contactItem) => {
            if (contactItem.phoneNumbers && contactItem.phoneNumbers.length != 0) {
                for (var i = 0; i < contactItem.phoneNumbers.length; i++) {
                    var phoneNumber = contactItem.phoneNumbers[i];
                    if (this.checkedNumberMap.has(phoneNumber.phoneNumber.replace(/\s+/g, ''))) { // 已被选中
                        phoneNumber.checked = true;
                    } else {
                        if (phoneNumber.checked) { // 若原来已选中但 已选列表中没有，则说明在其他页签取消
                            phoneNumber.checked = false;
                        }
                        if (i == 0) { // 群组中的首个联系人未被选中时，不选中群组
                            expandChecked = false;
                        }
                    }
                }
                tempContactBeans.push(contactItem);
            }
        });
        groupItem.contactBeans = tempContactBeans;
        if (expandChecked) {
            groupItem.checked = true;
        }
    },

    // 缓存分页加载
    requestItem: function () {
        this.page++;
        var requestData = {
            page: this.page,
            limit: this.limit,
            phoneNumberLabelNames: this.phoneNumberLabelNames,
            filterItem: 'phone'
        };
        LOG.info(TAG + 'requestItem requestData' + requestData);
        this.getGroupList(requestData);
    },

    // 获取群组列表
    getGroupList: function (actionData) {
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        groupReq.getGroupListAndContacts(DAHelper, actionData, result=>{
            if (result.code == 0) {
                LOG.info(TAG + 'get group list come code');
                if (result.resultList.length > 0) {
                    // 遍历给复选框默认值
                    result.resultList.forEach((groupItem) => {
                        groupItem.checked = false;
                        groupItem.expand = false;
                        var tempContactBeans = [];
                        if (groupItem.contactBeans && groupItem.contactBeans.length > 0) {
                            groupItem.contactBeans.forEach((contactItem) => {
                                if (contactItem.phoneNumbers && contactItem.phoneNumbers.length != 0) {
                                    contactItem.phoneNumbers.forEach((phoneNumber) => {
                                        phoneNumber.checked = false;
                                    });
                                    tempContactBeans.push(contactItem);
                                }
                                LOG.info(TAG + 'logMessage contactItem ' + contactItem);
                            });
                            groupItem.contactBeans = tempContactBeans;
                            if (groupItem.contactCount != 0 && tempContactBeans.length != 0) {
                                this.groupList = this.groupList.concat(groupItem);
                            }
                        }
                    });
                }
            } else {
                LOG.error(TAG + 'query groups code is ' + result.code);
            }
        });
    },

    groupExpand: function (groupItem) {
        LOG.info(TAG + 'groupExpand groupItem' + groupItem);
        groupItem.expand = !groupItem.expand;
    },

    // 群组复选框选中事件
    groupItemChecked: function (groupItem) {
        LOG.info(TAG + 'groupItemChecked groupItem' + groupItem);
        groupItem.checked = !groupItem.checked;
        let temNum = 0;
        var checkedList = [];
        var keyNumber = '';
        if (groupItem.checked) {
            groupItem.contactBeans.forEach((contact) => {
                if (!contact.phoneNumbers[0].checked) {
                    temNum++;
                }
                contact.phoneNumbers[0].checked = true;
                keyNumber = contact.phoneNumbers[0].phoneNumber.replace(/\s+/g, '');
                if (!this.checkedNumberMap.has(keyNumber)) {
                    checkedList.push({
                        name: contact.emptyNameData,
                        number: keyNumber
                    });
                }
                this.initOtherGroupCheckbox(0, contact);
            });
            this.checkedNum = this.checkedNum + temNum;
            if (checkedList.length > 0) {
                this.$emit('addCheckedContact', {
                    checkedList: checkedList // 需要增加的已选号码
                });
            }
        } else {
            groupItem.contactBeans.forEach((contact) => {
                LOG.info(TAG + 'groupItemChecked contact' + contact);
                contact.phoneNumbers.forEach((phoneNum, phoneNumIndex) => {
                    if (phoneNum.checked) {
                        temNum++;
                        checkedList.push({
                            name: contact.emptyNameData,
                            number: phoneNum.phoneNumber.replace(/\s+/g, '')
                        });
                    }
                    phoneNum.checked = false;
                    this.initOtherGroupCheckbox(phoneNumIndex, contact);
                });
            });
            if (checkedList.length > 0) {
                this.$emit('deleteCheckedContact', {
                    checkedList: checkedList // 需要删除的已选号码
                });
            }
            this.checkedNum = this.checkedNum - temNum;
        }
        this.initTitle();
    },

    // 联系人点击事件
    contactItemClick: function (phoneNumIndex, contactItem, groupItem) {
        LOG.info(TAG + 'contactItemClick contactItem' + contactItem);
        contactItem.phoneNumbers[phoneNumIndex].checked = !contactItem.phoneNumbers[phoneNumIndex].checked;
        if (contactItem.phoneNumbers[phoneNumIndex].checked) {
            this.checkedNum++;
            this.initOtherGroupCheckbox(phoneNumIndex, contactItem);
            this.$emit('addCheckedContact', {
                checkedList: [{
                                  name: contactItem.emptyNameData,
                                  number: contactItem.phoneNumbers[phoneNumIndex].phoneNumber.replace(/\s+/g, '')
                              }] // 需要增加的已选号码
            });
        } else {
            this.checkedNum--;
            this.initOtherGroupCheckbox(phoneNumIndex, contactItem);
            this.$emit('deleteCheckedContact', {
                checkedList: [{
                                  name: contactItem.emptyNameData,
                                  number: contactItem.phoneNumbers[phoneNumIndex].phoneNumber.replace(/\s+/g, '')
                              }] // 需要取消的已选号码
            });
        }
        this.initTitle();
    },

    initOtherGroupCheckbox: function (phoneNumIndex, contactItem) {
        LOG.info(TAG + 'initOtherGroupCheckbox contactItem' + contactItem);
        // 遍历其他group，如果选中的同一个联系人，则其他的也需要选中
        this.groupList.forEach((group) => {
            this.initGroupContactsCheckBox(group, phoneNumIndex, contactItem);
        });
        // 遍历收藏联系人列表，如果选中同一个联系人，收藏列表的联系人也要选中
        this.initGroupContactsCheckBox(this.favoritesItem, phoneNumIndex, contactItem);
    },

    /* 初始化指定群组联系人的复选框状态 */
    initGroupContactsCheckBox: function (group, phoneNumIndex, contactItem) {
        LOG.info(TAG + 'initGroupContactsCheckBox contactItem' + contactItem);
        var checkedNum = 0;
        group.contactBeans.forEach((contact) => {
            // 同一个联系人下的同一个号码选中状态一致
            if (contact.contactId == contactItem.contactId) {
                contact.phoneNumbers[phoneNumIndex].checked = contactItem.phoneNumbers[phoneNumIndex].checked;
            }

            if (contact.phoneNumbers[0].checked) {
                checkedNum++;
            }
        });
        if (group.contactBeans.length == checkedNum) {
            group.checked = true;
        } else {
            group.checked = false;
        }
    },

    // 加载title
    initTitle: function () {
        if (this.checkedNum != 0) {
            this.title = this.$t('value.contacts.groupsPage.alreadySelect').replace('num', this.checkedNum + '');
        } else {
            this.title = this.$t('value.contacts.groupsPage.noSelect');
        }
    },

    // 返回上层页面
    back: function () {
        router.back();
    },

    onDestroy() {
        this.$app.$def.globalData.batchSelectContactsRefreshFunction.pop();
    },
};
