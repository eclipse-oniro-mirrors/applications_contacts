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
import prompt from '@system.prompt';
import router from '@system.router';
import favoritesModel from '../../../default/model/FavoritesModel.js';
import LOG from '../../utils/ContactsLog.js';
import Constants from '../../../default/common/constants/Constants.js';
var TAG = 'favorite';


const GET_OFTEN_CONTACT = 3002 //获取常用列表
//数字解释
const NUMBERS_MEANING = {
    HEADER_MIN_HEIGHT: 70,
    HEADER_MAX_HEIGHT: 220,
    HEADER_MIN_FONT_SIZE: 50,
    HEADER_MAX_FONT_SIZE: 60,
    HEADER_MIN_TO_MAX_FONT_SIZE: 10,
    HEADER_MIN_TO_MAX_HEIGHT_SIZE: 150,
};
//代表同步
const ACTION_SYNC = 0;
//1代表InternalAbility无需界面跳转
const ABILITY_TYPE_INTERNAL = 1;
//isPrimary：0普通 1默认
const SET_DEFAULT = 1;

export default {
    data: {
        props: ['isInitFavorite', 'favoritesList'],
        favoritesList: [],
        todoList: [],
        numRecords: [],
        simCardInfo: '',
        dialoglist: '',
        layoutState: true,
        favorites_dialog_title: '',
        dialogEditNumbers: [],
        showEditNumbers: '',
        isChecked: false,
        settingDivClass: 'todo-setting-div',
        isShow: true,
        defaultPhoneNumberChecked: false,
        favoritesIndex: '',
        todoIndex: '',
        ic_free_space: '/res/image/ic_contacts_favorite_me_36.svg',
        ic_avatar_normal_light: '/res/image/ic_contacts_name_m.svg',
        ic_phonecall_m_block: '/res/image/ic_phonecall_m_block.svg',
        simpleDialogContactId: '',
        globalX: 0,
        globalY: 0,
        pYMove: 0,
        headerFavoriteHeight: NUMBERS_MEANING.HEADER_MAX_HEIGHT,
        headerFavoriteFontSize: NUMBERS_MEANING.HEADER_MAX_FONT_SIZE,
        isScrollTopPosition: false,
        onScrollTopNum: 0,
        dialogheight: 0,
    },
    onInit() {
        this.favorites_dialog_title = this.$t('value.favorites.page.dialog.title');
        this.settingDivClass = 'todo-setting-div';
    },
    onShow() {
    },
    onRefreshFavorite: function () {
        this.conciseLayoutInit();
        this.getFavoritesContacts();
    },

    //简洁布局选项初始化
    conciseLayoutInit: function () {
        let data = this.$app.$def.globalData.storage.getSync('contacts_settings_concise_layout_switch', 'false');
        this.layoutState = data == 'true' ? false : true;
    },
    showRecordDetails: function (contactId) {
        this.$app.$def.setRefreshFavorite();
        router.push({
            uri: 'pages/contacts/contactDetail/contactDetail',
            params: {
                contactId: contactId,
                isNewSource: true,
            }
        });
    },
    /** 单击某一个收藏的联系人的时候拨打电话 */
    showFavoriteDialog: function (contactId) {
        var phoneNumberLabelNames = [this.$t('accountants.house'), this.$t('accountants.phone'), this.$t('accountants.unit'), this.$t('accountants.unit fax'), this.$t('accountants.home fax'), this.$t('accountants.pager'), this.$t('accountants.others'), '', '', '', '', this.$t('accountants.switchboard')];
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        favoritesModel.queryPhoneNumByContactId(DAHelper, contactId, phoneNumberLabelNames, result => {
            if (result.code == 0 && result.data) {
                // 联系人没有电话时，直接弹出没有电话
                if (result.data.phoneNumbers == undefined || result.data.phoneNumbers.length == 0) {
                    prompt.showToast({
                        message: this.$t('value.favorites.page.dialog.noAvailablePhoneNumber')
                    });
                } else if (result.data.phoneNumbers.length == 1) {
                    // 联系人只有一个电话直接拨号
                    this.showEditNumbers = result.data.phoneNumbers[0].phoneNumber;
                    // 直接呼叫
                    this.callOut(this.showEditNumbers);
                } else {
                    // 联系人有多个号码时，判断是否设置了默认电话，设置默认了就直接拨打默认电话；否则弹出电话列表dialog，展示设置默认复选框
                    var setDefaultNum = false;
                    for (var i = 0; i < result.data.phoneNumbers.length; i++) {
                        if (SET_DEFAULT == result.data.phoneNumbers[i].isPrimary) {
                            this.showEditNumbers = result.data.phoneNumbers[i].phoneNumber;
                            setDefaultNum = true;
                            break;
                        }
                    }
                    if (setDefaultNum) {
                        this.$element('simpledialog').close();
                        this.callOut(this.showEditNumbers);
                    } else {
                        this.dialogEditNumbers = result.data.phoneNumbers;
                        if (this.dialogEditNumbers.length >= 6) {
                            this.dialogheight = 720;
                        } else {
                            this.dialogheight = this.dialogEditNumbers.length * 120
                        }
                        this.simpleDialogContactId = contactId;
                        this.$element('simpledialog').show();
                    }
                }
            } else {
                prompt.showToast({
                    message: 'No data available!'
                });
            }
        });
    },
    cancelSimpleSchedule: function (event) {
        this.$element('simpledialog').close();
    },
    /** 选择电话号码后，直接拨号，同时如果过设置了默认值请求后台保存默认电话 */
    dialogFavoriteClick: function (phoneNumber) {
        this.showEditNumbers = phoneNumber;
        this.$element('simpledialog').close();
        if (this.defaultPhoneNumberChecked) {
            this.defaultPhoneNumberChecked = false;
            var actionData = {};
            actionData.contactId = this.simpleDialogContactId;
            actionData.phoneNumber = this.showEditNumbers.replace(/\s+/g, '');
            actionData.isPrimary = SET_DEFAULT;
            var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
            favoritesModel.setOrCancelDefaultPhoneNumber(DAHelper, actionData, result => {
            });
        }
        // 直接呼叫
        this.callOut(this.showEditNumbers);
    },
    /** 选择默认复选框 */
    checkboxClick: function (event) {
        this.isChecked = !this.isChecked;
    },
    settingSelected: function (event) {
        if ('editor' == event.value) {
            this.isShow = false;
            this.$emit('eventType', {
                menuShow: false
            });
        }
    },
    longFavoritesPress: function (contactId, pressIndex) {
        var title = this.$t('value.contacts.groupsPage.alreadySelect').replace('num', '1');
        router.push({
            uri: 'pages/contacts/selectContactsList/selectContactsList',
            params: {
                type: 'editFavorites',
                contactId: contactId,
                pressIndex: pressIndex,
                title: title
            },
        })
    },
    longTodoPress: function (index) {
        this.$emit('eventType', {
            menuShow: false
        });
        this.isShow = false;
        this.favoritesIndex = '';
        this.todoIndex = index;
    },
    /** 删除后返回 */
    favoritesDeleteBack: function (e) {
        this.isShow = e.detail.isShow;
        this.favoritesList = e.detail.collection;
        this.todoList = e.detail.frequent;
        this.$emit('eventType', {
            menuShow: true
        });
    },

    //增加收藏按钮
    addTouchEnd: function (event) {
        router.push({
            uri: 'pages/contacts/selectContactsList/selectContactsList',
            params: {
                type: 'getContactsListFavorites'
            },
        })
    },
    /** 获取收藏的联系人 */
    getFavoritesContacts() {
        var actionData = {
            limit: 2000,
            page: 0,
            star: 1
        }
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        favoritesModel.queryFavoritesContacts(DAHelper, actionData, result => {
            if (result.code == 0) {
                if (result.resultList.length > 0) {
                    this.favoritesList = result.resultList;
                } else {
                    this.favoritesList = [];
                }
                if (result.todoList.length > 0) {
                    this.todoList = result.todoList;
                } else {
                    this.todoList = [];
                }
            } else {
                this.favoritesList = [];
                this.todoList = [];
                LOG.info(TAG + 'getFavoritesContacts' + 'plus result is error:');
            }
        });


    },
    getToDoContacts() {
        var actionData = {
            limit: 2000,
            page: 0,
            star: 1
        }
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        favoritesModel.queryFrequentlyContact(DAHelper, actionData, result => {
            if (result.code == 0 && result.todoList.length > 0) {
                LOG.error(TAG + 'getToDoContacts' + 'result.todoList: ');
                this.todoList = result.todoList;
            } else {
                this.todoList = [];
                LOG.info(TAG + 'getToDoContacts' + 'plus result is erro:');
            }
        });
    },
    // 选择跳转到设置页面
    editOnSelected: function (event) {
        var title = this.$t('value.contacts.groupsPage.noSelect');
        if (event.value == 'edit') {
            router.push({
                uri: 'pages/contacts/selectContactsList/selectContactsList',
                params: {
                    type: 'editFavorites',
                    title: title
                },
            })
        }
    },
    /* 电话呼出接口 */
    callOut(phoneNumber) {
        this.$app.$def.call(phoneNumber);
    },
    /** 收藏点击拨号时设置默认电话复选框点击事件 */
    simpleDialogItemClick: function (status) {
        this.defaultPhoneNumberChecked = !status;
    },

    //手指触摸动作开始
    onTouchStartList: function (e) {
        this.globalX = e.touches[0].globalX;
        this.globalY = e.touches[0].globalY;
        this.pYStart = e.touches[0].globalY;
    },
    /** 收藏列表移动操作 */
    onTouchListMove: function (e) {
        this.pYMove = this.pYStart - e.touches[0].globalY;
        if (this.pYMove != 0 && this.pYMove > 0) {
            // 向上移动，隐藏状态，不需要处理；向上移动显示状态，需要设置隐藏
            if (this.headerFavoriteHeight <= NUMBERS_MEANING.HEADER_MIN_HEIGHT) {
                this.isScrollTopPosition = true;
                this.headerFavoriteFontSize = NUMBERS_MEANING.HEADER_MIN_FONT_SIZE;
                this.headerFavoriteHeight = NUMBERS_MEANING.HEADER_MIN_HEIGHT;
            } else {
                this.headerFavoriteHeight = this.headerFavoriteHeight - this.pYMove;
                this.headerFavoriteFontSize = NUMBERS_MEANING.HEADER_MIN_FONT_SIZE + NUMBERS_MEANING.HEADER_MIN_TO_MAX_FONT_SIZE * ((this.headerFavoriteHeight - NUMBERS_MEANING.HEADER_MIN_HEIGHT) / NUMBERS_MEANING.HEADER_MIN_TO_MAX_HEIGHT_SIZE);
            }
        } else if (this.pYMove != 0 && this.pYMove < 0) {
            // 向下移动，显示状态，不需要处理；隐藏状态，需要结合是否是顶部，如果是顶部，就要将顶部显示
            if (this.headerFavoriteHeight >= NUMBERS_MEANING.HEADER_MAX_HEIGHT) {
                this.headerFavoriteFontSize = NUMBERS_MEANING.HEADER_MAX_FONT_SIZE;
                this.isScrollTopPosition = false;
            } else {
                this.headerFavoriteHeight = this.headerFavoriteHeight - this.pYMove;
                this.headerFavoriteFontSize = NUMBERS_MEANING.HEADER_MIN_FONT_SIZE + NUMBERS_MEANING.HEADER_MIN_TO_MAX_FONT_SIZE * ((this.headerFavoriteHeight - NUMBERS_MEANING.HEADER_MIN_HEIGHT) / NUMBERS_MEANING.HEADER_MIN_TO_MAX_HEIGHT_SIZE);
            }
        } else {
        }
    },
    /** list移动结束 */
    onTouchFavoriteEnd: function (e) {
        if (this.pYMove != 0 && this.pYMove > 0 && this.headerFavoriteHeight <= NUMBERS_MEANING.HEADER_MIN_HEIGHT) {
            // 向上移动，隐藏状态，不需要处理；向上移动显示状态，需要设置隐藏
            this.headerFavoriteHeight = NUMBERS_MEANING.HEADER_MIN_HEIGHT;
            this.headerFavoriteFontSize = NUMBERS_MEANING.HEADER_MIN_FONT_SIZE;
        } else if (this.pYMove != 0 && this.pYMove < 0 && this.headerFavoriteHeight >= NUMBERS_MEANING.HEADER_MAX_HEIGHT && this.isScrollTopPosition == true) {
            // 向下移动，显示状态，不需要处理；隐藏状态，需要结合是否是顶部，如果是顶部，就要将顶部显示
            this.headerFavoriteHeight = NUMBERS_MEANING.HEADER_MAX_HEIGHT;
            this.headerFavoriteFontSize = NUMBERS_MEANING.HEADER_MAX_FONT_SIZE;
        } else if (this.pYMove != 0 && this.pYMove < 0 && this.onScrollTopNum == 0) {
            // 如果数据量较少，导致下拉条不生效，这种情况时，下拉即展示头部
            this.headerFavoriteHeight = NUMBERS_MEANING.HEADER_MAX_HEIGHT;
            this.headerFavoriteFontSize = NUMBERS_MEANING.HEADER_MAX_FONT_SIZE;
        } else {
            this.headerFavoriteFontSize = NUMBERS_MEANING.HEADER_MIN_FONT_SIZE + NUMBERS_MEANING.HEADER_MIN_TO_MAX_FONT_SIZE * ((this.headerFavoriteHeight - NUMBERS_MEANING.HEADER_MIN_HEIGHT) / NUMBERS_MEANING.HEADER_MIN_TO_MAX_HEIGHT_SIZE);
        }
        if (this.headerFavoriteHeight > NUMBERS_MEANING.HEADER_MAX_HEIGHT) {
            this.headerFavoriteHeight = NUMBERS_MEANING.HEADER_MAX_HEIGHT;
        }
        if (this.headerFavoriteFontSize > NUMBERS_MEANING.HEADER_MAX_FONT_SIZE) {
            this.headerFavoriteFontSize = NUMBERS_MEANING.HEADER_MAX_FONT_SIZE;
        }
        this.pYMove = 0;
        this.pYStart = 0;
    },
    /** 是否滑动到顶部 */
    onScrollFavoriteTop: function (e) {
        // 如果判断是顶部，做标记
        this.isScrollTopPosition = true;
        this.onScrollTopNum = this.onScrollTopNum + 1;
    },
}

