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
import data_storage from '@ohos.data.storage';
import call from '@ohos.telephony.call';
import file from '@system.file';
import featureAbility from '@ohos.ability.featureAbility';
import LOG from '../default/utils/ContactsLog.js';
var TAG = 'app';

export default {
    featureAbility: featureAbility,
    onCreate() {
        LOG.info(TAG + 'AceApplication onCreate');
        this.globalData.storage = data_storage.getStorageSync(this.globalData.path);
    },
    onDestroy() {
    },

    globalData: {
        file: file,
        path: '/data/accounts/account_0/appdata/com.ohos.contacts/database/PREFERENCES_FOR_CONTACTS',
        storage: '',
        addAccount: false,
        editContacts: false,
        refreshContacts: false,
        refreshFavorites: false,
        navigationType: -1,
        menuType: '',
        showClipBoardInit: true,
        isSearchList: false,
        callLogTotalData: {
            callLogList: [],
            missedList: [],
            totalCount: 0,
            missedCount: 0,
        },
        voicemailTotalData: {
            voicemailList: [],
            voicemailCount: 0
        },
        contactsAnimation: {
            title: '',
            backBut: 'hidden-init',
            setting: '',
            contactTitle: '',
            search: '',
            isHidden: false,
            isSearch: false
        },
        voicemailNumber: '', // 缓存语音信箱号码
        refreshFunctions: [], // 页面回调函数容器，用于各页面数据的刷新。
        navigationBackPressFunctions: [], // 主界面返回键回调函数，主界面点击返回时，调用所注册的函数。
        batchSelectContactsRefreshFunction: [], // 批量选择联系人页面子组件数据刷新回调。
        isDisplay: true, // 屏蔽组件
        searchValue: '', // 详情界面助理跳回主页需要携带参数
        contactCount: 0, // 用于判断分享联系人是否是置灰,
        pushToGroup: false,
        groupParams: null,
        dialogShow: false
    },
    /* 拨号盘状态数据 */
    dialerStateData: {
        isEditNumber: false, // true：表示从其他页面通过呼叫前编辑返回到拨号盘
        isGoToMissedCalls: false, // true:表示初始进入拨号盘时，需要展示未接来电页面
        numTextDialer: '',
        showDialer: true,
        copyDisabled: true,
        isCallState: false,
        isNeedShowDialer: true, // 表示在拨号盘从后台拉起时，是否需要显示拨号盘。从拨号盘当前页面的跳转都无需显示拨号盘
        isNeedHideDialer: false, // 表示三方跳转到拨号盘时，是否需要隐藏拨号盘
    },
    groups: {
        group: []
    },
    dialer: {},

    /* 全局拨号盘 */
    setAddAccount(addAccount) {
        this.globalData.addAccount = addAccount;
    },
    clearAddAccount() {
        this.globalData.addAccount = false;
    },
    setRefreshContacts(refreshContacts) {
        this.globalData.refreshContacts = refreshContacts;
    },
    setRefreshFavorite() {
        this.globalData.refreshFavorites = true;
    },
    clearRefreshFavorite() {
        this.globalData.refreshFavorites = false;
    },
    clearRefreshContacts() {
        this.globalData.refreshContacts = false;
    },
    setEditContacts(editContacts) {
        this.globalData.editContacts = editContacts;
    },
    clearEditContacts() {
        this.globalData.editContacts = false;
    },
    setContactsAnimation(title, backBut, setting, contactTitle, search, isHidden) {
        this.globalData.contactsAnimation.title = title;
        this.globalData.contactsAnimation.backBut = backBut;
        this.globalData.contactsAnimation.setting = setting;
        this.globalData.contactsAnimation.contactTitle = contactTitle;
        this.globalData.contactsAnimation.search = search;
        this.globalData.contactsAnimation.isHidden = isHidden;
    },
    setIsSearch(isSearch) {
        this.globalData.contactsAnimation.isSearch = isSearch;
    },
    setIsSearchList(isSearchList) {
        this.globalData.isSearchList = isSearchList;
    },
    getDAHelper: function (URL) {
        var DAHelper = featureAbility.acquireDataAbilityHelper(URL);
        return DAHelper;
    },

    /**
     * 打电话
     *
     * @param {number} phoneNumber 电话号码
     */
    call(phoneNumber) {
        if (phoneNumber == null || phoneNumber == '') {
            LOG.info(TAG + 'call param is null');
            return;
        }
        LOG.info(TAG + 'callPhone executed phone number = ' + phoneNumber);
        if (phoneNumber.length) {
            call.dial(phoneNumber).then((value) => {
                this.pageState = false;
                LOG.info(TAG + `call dial success : value = ${value}`);
            }).catch((err) => {
                LOG.info(TAG + 'call dial error, ' + err.message);
            });
        }
    },
    // 发送短信
    sendMessage(params) {
        let actionData = {};
        actionData.contactObjects = JSON.stringify(params);
        actionData.pageFlag = 'conversation';
        this.jumpToContract(actionData);
    },
    // 跳转至短彩信app
    jumpToContract(actionData) {
        var str = {
            'want': {
                'bundleName': 'com.ohos.mms',
                'abilityName': 'com.ohos.mms.MainAbility',
                'parameters': actionData,
                'entities': [
                    'entity.system.home'
                ]
            },
        };
        featureAbility.startAbility(str)
            .then((data) => {
                LOG.info(TAG + 'jumpToContract Operation successful. Data: ' + JSON.stringify(data));
            }).catch((error) => {
            LOG.error(TAG + 'jumpToContract Operation failed. Cause: ' + JSON.stringify(error));
        });
    }
};
