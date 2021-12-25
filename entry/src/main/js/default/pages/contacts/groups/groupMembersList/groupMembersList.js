/**
 * @file 组成员列表
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
import prompt from '@system.prompt';
import groupReq from '../../../../../default/model/GroupsModel.js';
import LOG from '../../../../utils/ContactsLog.js';
import Constants from '../../../../../default/common/constants/Constants.js';
import backgroundColor from '../../../../common/constants/color.js';

var TAG = 'groupMembersList...:';

export default {
    data: {
        groupItem: {
            title: ''
        }, // 群组对象
        contactCount: 0,
        layoutState: true,
        dialogInputActive: false, // dialog的input框默认不激活
        contactsList: [], // 数据列表
        operateItem: {}, // 长按操作的联系人item
        newGroupName: '',
        showEmptyPage: false,
        menuContactName: '', // 长按menu的标题
        page: 0,
        limit: 20, // 一页显示条目数量
        backgroundColor: backgroundColor.Color
    },
    onInit() {
        LOG.info(TAG + 'onInit success');
        this.conciseLayoutInit();
    },
    onShow() {
        LOG.info(TAG + 'onShow success');
        this.page = 0;
        this.getContactsList();
    },

    // 简洁布局选项初始化
    conciseLayoutInit: function () {
        LOG.info(TAG + 'conciseLayoutInit success');
        let data = this.$app.$def.globalData.storage.getSync('contacts_settings_concise_layout_switch', 'false');
        this.layoutState = data == 'true' ? false : true;
    },

    // 缓存分页加载
    requestItem: function () {
        this.page++;
    },

    //  群组信息查询
    getContactsList: function () {
        var actionData = {
            page: this.page,
            limit: this.limit,
            groupId: this.groupItem.groupId
        };
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        groupReq.queryGroupMembers(DAHelper, actionData, result => {
            setInterval(() => {
                LOG.info(TAG + 'delay 1 s');
            }, 1000);
            if (result.code == 0) {
                if (result.resultList) {
                    this.contactCount = result.totalCount;
                    if (this.page == 0) {
                        this.contactsList = result.resultList;
                    } else {
                        this.contactsList = this.contactsList.concat(result.resultList);
                    }
                } else {
                    this.contactsList = [];
                }
            } else {
                prompt.showToast({
                    message: 'Failed to init data.'
                });
            }
            if (this.contactsList.length == 0) {
                this.showEmptyPage = true;
            } else {
                this.showEmptyPage = false;
            }
        });
    },

    jumpToContactDetail: function (item) {
        LOG.info(TAG + 'jumpToContactDetail item' + item);
        router.push({
            uri: 'pages/contacts/contactDetail/contactDetail',
            params: {
                contactId: item.contactId,
                isNewSource: true
            }
        });
    },

    listItemTouchStart: function (event) {
        this.position = {};
        this.position.X = Math.round(event.touches[0].globalX);
        this.position.Y = Math.round(event.touches[0].globalY);
    },

    itemLongPress: function (item) {
        LOG.info(TAG + 'itemLongPress item' + item);
        this.operateItem = item;
        let name = item.emptyNameData ? item.emptyNameData : this.$t('value.contacts.page.item.noName');
        if (item.emptyNameData && name && name.length > 4) {
            this.menuContactName = name.substring(0, 4) + '..';
        } else {
            this.menuContactName = name;
        }
        var tempX = this.position.X > 360 ? 360 : this.position.X;
        var tempY = this.position.Y > 1100 ? 1100 : this.position.Y;
        clearTimeout(this.menuTimeOutId);
        this.menuTimeOutId = setTimeout(() => {
            this.$element('contactItemMenu').show({
                x: tempX,
                y: tempY
            });
        }, 1);
    },
    // Menu选择项
    menuSelected: function (event) {
        if (event.value == 'deleteFromGroup') {
            let contactBeans = {};
            contactBeans.contactId = this.operateItem.contactId;
            var actionData = {
                groupId: this.groupItem.groupId,
                contactBeans: [contactBeans],
                isOperationAll: false
            };
            var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
            groupReq.deleteGroupMembers(DAHelper, actionData, result => {
                this.onShow();
            });
        }
    },
    // Menu选择项
    moreMenuSelected: function (event) {
        if (event.value == 'deleteMember') {
            router.push({
                uri: 'pages/contacts/selectContactsList/selectContactsList',
                params: {
                    groupId: this.groupItem.groupId,
                    type: 'removeMemberFromGroups'
                },
            });
        }
        if (event.value == 'deleteGroup') {
            this.$element('deleteGroupDialog').show();
        }
        if (event.value == 'rename') {
            this.dialogInputActive = false;
            this.$element('renameGroupDialog').show();
        }
    },

    changeStyle: function () {
        this.dialogInputActive = true;
    },

    // 返回上层页面
    back: function () {
        router.back();
    },

    clickAddMember: function () {
        router.push({
            uri: 'pages/contacts/selectContactsList/selectContactsList',
            params: {
                groupId: this.groupItem.groupId,
                type: 'addMemberFromGroups'
            },
        });
    },

    // 发送短信
    clickSendMsg: function () {
        router.push({
            uri: 'pages/contacts/groups/selectGroupMembers/selectGroupMembers',
            params: {
                groupId: this.groupItem.groupId,
                type: 'sendMsg'
            },
        });
    },

    // 发送邮件
    clickSendEmail: function () {
        router.push({
            uri: 'pages/contacts/groups/selectGroupMembers/selectGroupMembers',
            params: {
                groupId: this.groupItem.groupId,
                type: 'sendEmail'
            },
        });
    },

    renameGroup: function () {
        this.dialogInputActive = false;
        this.$element('renameGroupDialog').show();
    },

    doDeleteGroup: function () {
        this.$element('deleteGroupDialog').show();
    },

    doClickMore: function () {
        clearTimeout(this.menuTimeOutId);
        this.menuTimeOutId = setTimeout(() => {
            this.$element('moreMenu').show({
                x: this.touchMoveStartX,
                y: this.touchMoveStartY
            });
        }, 1);
    },

    moreTouchStart: function (e) {
        LOG.info(TAG + 'moreTouchStart e' + e);
        /* 记录底部更多触摸起点 */
        this.touchMoveStartX = e.touches[0].globalX;
        this.touchMoveStartY = e.touches[0].globalY;
    },

    renameGroupNameChanged: function (e) {
        LOG.info(TAG + 'renameGroupNameChanged e' + e);
        this.newGroupName = e.value;
    },

    confirmUpdateGroup: function () {
        this.$element('renameGroupDialog').close();
        if (this.newGroupName == this.groupItem.title) {
            return;
        }
        var actionData = {};
        actionData.title = this.newGroupName;
        actionData.groupId = this.groupItem.groupId;
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        groupReq.updateGroup(DAHelper, actionData, data =>{
            if (data == 0) {
                this.groupItem.title = this.newGroupName;
            } else if (data == -2) {
                prompt.showToast({
                    message: this.$t('value.contacts.groupsPage.alreadyExists')
                });
            } else {
                LOG.error(TAG + 'add group error. code is ' + data);
            }
        });

    },

    cancelUpdateGroup: function () {
        this.$element('renameGroupDialog').close();
    },

    confirmDeleteGroup: function () {
        this.$element('deleteGroupDialog').close();
        var actionData = {
            ids: [this.groupItem.groupId]
        };
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        groupReq.deleteGroups(DAHelper, actionData.ids, result => {
            router.back();
        });
    },

    cancelDeleteGroup: function () {
        this.$element('deleteGroupDialog').close();
    },

};
