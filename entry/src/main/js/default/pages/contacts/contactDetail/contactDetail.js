/**
 * @file: 联系人详情
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

import contactDetailReq  from '../../../../default/model/ContactDetailModel.js';
import contactsService from '../../../../default/model/ContactModel.js';
import callLogService from '../../../../default/model/CalllogModel.js';
import favoritesModel from '../../../../default/model/FavoritesModel.js';
import router from '@system.router';
import prompt from '@system.prompt';
import Utils from '../../../../default/utils/utils.js';
import LOG from '../../../utils/ContactsLog.js';
import Constants from '../../../../default/common/constants/Constants.js';
import backgroundColor from '../../../common/constants/color.js';

var TAG = 'contactDetail...:';

const DELETE_CONTACT = 2003; // 删除联系人
const GET_CONTACT_DETAIL = 2005; // 获取详情

// 1代表时收藏的联系人 0代表不是收藏的联系人
const IS_FAVORITE = 1;
const IS_NOT_FAVORITE = 0;
// 代表同步
const ACTION_SYNC = 0;
// isPrimary：0普通 1默认
const SET_DEFAULT = 1;
const CLEAR_DEFAULT = 0;

export default {
    data: {
        /* 图片资源 */
        icPhoneCallMBlock: '/res/image/ic_phonecall_m_block.svg',
        icVideoM: '/res/image/ic_video_m.svg',
        icMassageM: '/res/image/ic_massage_m.svg',
        icContactsCallOut: '/res/image/ic_contacts_callout_mini.svg',
        icContactsCallIn: '/res/image/ic_contacts_call_in_mini.svg',
        icContactsCallMissed: '/res/image/ic_contacts_call_missed_mini.svg',
        icContactsCallRejected: '/res/image/ic_contacts_call_rejected_mini.svg',
        /** 展示头像 */
        showHeaderFlag: true,
        /** Y坐标移动起始值 */
        pYStart: 0,
        /** Y坐标移动值 */
        pYMove: 0,
        /** 移动值计算 */
        directPoint: 0,
        /* 头像背景色选择 */
        backgroundColor: backgroundColor.Color,
        /* 详情页面第一部分整体背景色 */
        backgroundDetailColor: backgroundColor.detailColor,
        directPointTemp: 0,
        /** 界面移动起始X坐标 */
        touchMoveStartX: 0,
        /** 界面移动起始Y坐标 */
        touchMoveStartY: 0,
        /** 收藏标记 */
        isFavorite: false,
        /** 新号码传入的详情展示信息 */
        newNumberContactDetail: {},
        /** 展示MENU延时标记 */
        showMenuTimeOutId: '',
        /** 长按电话号码对话框显示号码 */
        showPhoneNumber: '',
        /** 联系人所有电话号码数 */
        phoneNumbersLength: 0,
        /** 剪贴板内容 */
        copyToClipBoardContent: '',
        /** 长按地址弹出dialog的title */
        postalAddressName: '',
        /** 拨打电话的号码值 */
        sendNumber: '',
        /** 删除通话记录索引值 */
        deleteIndex: '',
        /**  长按电话号码的索引值 */
        numLongPressIndexIndex: 0,
        /** 页面全局X坐标 */
        globalX: '',
        /** 页面全局Y坐标 */
        globalY: '',
        /** 用于按钮显示折叠后的showNameLast */
        showNameLastMenu: '',
        /** 最终显示的头像未知的名称 */
        showNameLast: '',
        /** 二维码string值 */
        qrcodeString: '',
        /** 根据联系人详情组装的展示用参数 */
        contactForm: {
            'showLastDividerGroupsP': false,
            'showGroupsP': false,
            'isNewNumber': false,
            'showLastDividerNickNameP': false,
            'showLastDividerNoteP': false,
            'showNickNameP': false,
            'showNoteP': false,
            'showPinYinNameP': false,
            'showLastDividerPinYinNameP': false,
            'showMoreButton': false,
            'phoneNumbers': [],
            'emails': [],
            'imAddresses': [],
            'nickName': '',
            'websites': [],
            'postalAddresses': [],
            'events': [],
            'note': '',
            'relations': [],
            'pinYinName': '',
            'alphaName': '',
            'showGroupsString': '',
            'name': '',
            'emptyNameData': '',
            'namePrefix': '',
            'lastName': '',
            'company': '',
            'position': '',
            'numRecords': [],
            'groups': [],
            /** 底部显示新建联系人底部图标 */
            'showNewContact': false,
        },
        /** 头像高度 */
        contacts: {},
        emails: [
            {
                'id': 0,
                'email': '',
                'labelId': 1,
                'labelName': '私人',
                'showP': false
            }
        ],
        events: [
            {
                'id': 0,
                'eventDate': '日期',
                'labelId': 3,
                'labelName': '生日',
                'showP': false,
                'showF': true,
                'showS': true
            }
        ],
        imAddresses: [
            {
                'id': 0,
                'imAddress': '',
                'labelId': 1,
                'labelName': 'AIM',
                'showP': false
            }
        ],
        phoneNumbers: [
            {
                'id': 0,
                'labelId': 2,
                'labelName': '手机',
                'phoneNumber': '',
                'phoneAddress': 'N',
                'showP': false,
                'blueStyle': false
            }
        ],
        postalAddresses: [
            {
                'id': 0,
                'labelId': 1,
                'labelName': '住宅',
                'postalAddress': '',
                'showP': false
            }
        ],
        relations: [
            {
                'id': 0,
                'labelId': 1,
                'labelName': '助理',
                'relationName': '',
                'showP': false
            }
        ],
        websites: [
            {
                'id': 0,
                'website': '',
                'showP': false
            }
        ],
        name: {
            'fullName': '',
            'givenName': '',
            'familyNamePhonetic': '',
            'alphaName':''
        },
        nickName: {
            'nickName': ''
        },
        note: {
            'noteContent': ''
        },
        organization: {
            'name': '',
            'title': ''
        },
        /** 是否是新的优化后的请求接口，新接口调用参照收藏页面跳转，增加该字段 */
        isNewSource: false,
        /** 是否已经获取到contacts详情信息 */
        containContacts: false,
        /** 电话号码显示默认 */
        showSetDefault: false,
        /** 来自于通话记录跳转 */
        sourceFromCallRecord: false,
        /** 新号码传入的电话号 */
        phoneNumberShow: '',
        /** 联系人ID */
        contactId: '',
        /** 是新号码 */
        isNewNumber: false,
    },
    onInit() {
        LOG.info(TAG + ' onInit detail');
    },
    onReady() {
        LOG.info(TAG + ' onReady detail');
    },
    onShow() {
        // 优化后请求，新对接详情从该页面加载数据（群组，收藏，联系人列表从这里跳转）
        if (this.isNewSource) {
            let requestData = {
                contactId: this.contactId
            };
            this.getContactDetail(GET_CONTACT_DETAIL, requestData);
        } else if (this.containContacts) {
            // 新增编辑联系人后跳转至详情，contacts已经传入只加载通话记录
            this.dealRecordDetailsData();
        } else if (this.sourceFromCallRecord) {
            // 未添加联系人且来自于通话记录跳转
            // 1.根据电话号码查询联系人id
            // 2.如果不存在联系人，则按照新号码处理，如果存在联系人，则根据第一个联系人id展示详情
            var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
            contactDetailReq.getContactIdByNumber(DAHelper, this.phoneNumberShow, (contactId) => {
                if (!Utils.isEmpty(contactId)) { // 存在联系人时，将isNewNumber置为false
                    this.isNewNumber = false;
                    let requestData = {
                        contactId: contactId
                    };
                    this.getContactDetail(GET_CONTACT_DETAIL, requestData);
                } else { // 不存在联系人id则按照新号码处理
                    this.getDetailAsNewNumber();
                }
            });
        }
        LOG.info(TAG + ' onShow detail');
    },

    onHide() {
        LOG.info(TAG + ' onHide detail');
    },

    onDestroy() {
        LOG.info(TAG + ' onDestroy detail');
    },

    /* 没有联系人数据的情况下，显示电话号码的详情 */
    getDetailAsNewNumber() {
        var numbers = [this.phoneNumberShow.replace(/\s+/g, '')];
        this.getNewNumRecords(numbers);
    },

    /* 收藏联系人，如果已收藏，则取消，如果未收藏，则收藏 */
    selectFavorite() {
        LOG.info(TAG + 'favorites: onDestroy detail');
        var starred = IS_NOT_FAVORITE;
        /* 后台接口后续更新 */
        if (this.contacts.starred == IS_NOT_FAVORITE) {
            this.contacts.starred = IS_FAVORITE;
            starred = IS_FAVORITE;
        } else {
            this.contacts.starred = IS_NOT_FAVORITE;
            starred = IS_NOT_FAVORITE;
        }
        // 获取到当前的时间戳
        var timestamp = (new Date()).valueOf();
        var actionData = {
            ids: [this.contacts.contactId],
            favorite: starred,
            isOperationAll: false, // 非全选状态
            favorite_order: timestamp
        };
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        favoritesModel.updateFavoriteState(DAHelper, actionData, result => {
        });
    },

    // 通话记录弹窗
    clearPhoneRecords() {
        this.$element('clearRecordsDialog').show();
    },

    // 通话记录删除
    clearRecords() {
        var id = '';
        var ids = [];
        for (let index = 0; index < this.contactForm.numRecords.length; index++) {
            id = this.contactForm.numRecords[index].id;
            ids.push(id);
        }
        this.contactForm.numRecords = [];
        this.removeCallLog(ids);
        this.$element('clearRecordsDialog').close();
    },

    /**
     * 手指触摸动作开始
     *
     * @param {Object} e event事件
     */
    listItemTouchStart(e) {
        LOG.info(TAG + 'listItemTouchStart e' + e);
        this.globalX = e.touches[0].globalX;
        this.globalY = e.touches[0].globalY;
    },

    /**
     * 单点通话记录
     *
     * @param {number} index 下标
     */
    callOutRecord(index) {
        LOG.info(TAG + 'callOutRecord index' + index);
        this.callOut(this.contactForm.numRecords[index].phone);
    },

    /**
     * 长按通话记录弹窗
     *
     * @param {number} index 下标
     */
    listItemOnLongPress: function (index) {
        LOG.info(TAG + 'listItemOnLongPress index' + index);
        this.deleteIndex = index;
        this.sendNumber = this.contactForm.numRecords[index].formatNumber;
        this.$element('itemMenu').show({
            x: this.globalX,
            y: this.globalY
        });
    },

    /**
     * 长按电话号码弹窗
     *
     * @param {number} index 下标
     */
    listItemOnLongPressNumber: function (index) {
        LOG.info(TAG + 'listItemOnLongPressNumber index' + index);
        this.numLongPressIndexIndex = index;
        this.sendNumber = this.contactForm.phoneNumbers[index].phoneNumber;
        this.showSetDefault = (this.contactForm.phoneNumbers[index].isPrimary == 1) ? false : true;
        this.phoneNumbersLength = (this.contactForm.phoneNumbers && this.contactForm.phoneNumbers.length > 0)
            ? this.contactForm.phoneNumbers.length : 0;

        this.showPhoneNumber = (this.contactForm.phoneNumbers && this.contactForm.phoneNumbers[index]
        && this.contactForm.phoneNumbers[index].phoneNumber.length > 0)
            ? (this.contactForm.phoneNumbers[index].phoneNumber.length <= 8
                ? this.contactForm.phoneNumbers[index].phoneNumber
                : this.contactForm.phoneNumbers[index].phoneNumber.substring(0, 7) + '..') : '';

        clearTimeout(this.showMenuTimeOutId);
        /* 此处需要异步延时显示菜单，否则值刷新不过来 */
        this.showMenuTimeOutId = setTimeout(() => {
            this.$element('itemMenuNumber').show({
                x: this.globalX,
                y: this.globalY,
            });
        }, 60);
    },

    /**
     * 长按关联关系弹窗
     *
     * @param {string} content 当前长按元素传进来的字符串
     */
    listItemOnLongPressContent: function (content) {
        LOG.info(TAG + 'listItemOnLongPressContent content' + content);
        this.copyToClipBoardContent = (content && content.length > 7)
            ? this.subStringWithEllipsis(content, 9) : content;

        clearTimeout(this.showMenuTimeOutId);
        /* 此处需要异步延时显示菜单，否则值刷新不过来 */
        this.showMenuTimeOutId = setTimeout(() => {
            this.$element('itemMenuContent').show({
                x: this.globalX,
                y: this.globalY,
            });
        }, 60);
    },

    // 取消
    cancelClearRecordDialog() {
        this.$element('clearRecordsDialog').close();
    },

    /** 编辑联系人 */
    updateContact() {
        if (this.contacts.emails) {
            this.addShowPField(this.contacts.emails);
        }
        if (this.contacts.events) {
            this.addShowPField(this.contacts.events);
        }
        if (this.contacts.imAddresses) {
            this.addShowPField(this.contacts.imAddresses);
        }
        if (this.contacts.phoneNumbers) {
            this.addShowPField(this.contactForm.phoneNumbers);
        }
        if (this.contacts.postalAddresses) {
            this.addShowPField(this.contacts.postalAddresses);
        }
        if (this.contacts.relations) {
            this.addShowPField(this.contacts.relations);
        }
        if (this.contacts.websites) {
            this.addShowPField(this.contacts.websites);
        }

        if (!this.contacts.emails || this.contacts.emails.length == 0) {
            this.contacts.emails = this.emails;
        }
        if (!this.contacts.events || this.contacts.events.length == 0) {
            this.contacts.events = this.events;
        }
        if (!this.contacts.imAddresses || this.contacts.imAddresses.length == 0) {
            this.contacts.imAddresses = this.imAddresses;
        }
        if (!this.contacts.phoneNumbers || this.contacts.phoneNumbers.length == 0) {
            this.contacts.phoneNumbers = this.phoneNumbers;
        }

        this.updateContacts();
    },
    updateContacts() {
        if (!this.contacts.postalAddresses || this.contacts.postalAddresses.length === 0) {
            this.contacts.postalAddresses = this.postalAddresses;
        }
        if (!this.contacts.relations || this.contacts.relations.length == 0) {
            this.contacts.relations = this.relations;
        }
        if (!this.contacts.websites || this.contacts.websites.length == 0) {
            this.contacts.websites = this.websites;
        }
        if (!this.contacts.groups || this.contacts.groups.length == 0) {
            this.contacts.groups = this.groups;
        }
        if (!this.contacts.name) {
            this.contacts.name = this.name;
        }
        if (!this.contacts.nickName) {
            this.contacts.nickName = this.nickName;
        }
        if (!this.contacts.note) {
            this.contacts.note = this.note;
        }
        if (!this.contacts.organization) {
            this.contacts.organization = this.organization;
        }

        router.replace({
            uri: 'pages/contacts/accountants/accountants',
            params: {
                addShow: false,
                updataShow: true,
                showWork: true,
                upHouseShow: true,
                contactForm: this.contacts,
                groups: this.contacts.groups,
                upPinShow: true,
            },
        });
    },

    /**
     * 将数组中的每个元素的showP属性展示
     *
     * @param {Array} array 联系人的各个数据
     */
    addShowPField(array) {
        LOG.info(TAG + 'addShowPField array' + array);
        if (array || array.length > 0) {
            array.forEach((item, index) => {
                item.showP = true;
                delete item.id;
            });
        }
    },

    /* 返回按键 */
    routerBack() {
        this.$app.$def.setRefreshContacts(false);
        router.back();
    },

    onBackPress() {
        this.$app.$def.setRefreshContacts(false);
        router.back();
    },

    /**显示隐藏更多选项*/
    getMore: function () {
        if (Boolean(this.contactForm.showMoreButton) == true) {
            this.contactForm.showMoreButton = false;
        }
        this.dealRecordDetailsData();
    },

    /**
     * 将obj对象实现深拷贝
     *
     * @param {Object} obj 联系人的contactForm
     * @return {Object} 返回拷贝对象
     */
    copy(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * 获取联系人详细数据
     *
     * @param {number} code 2005 FA与PA通行协议码
     * @param {number} data contactId 联系人ID
     */
    getContactDetail: function (code, data) {
        var actionData = data;
        data.contactId = actionData.contactId;
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        contactDetailReq.getContactById(DAHelper, data, result => {
            if (!result) { // 如果根据指定的id获取不到联系人，则按照新号码处理。
                this.getDetailAsNewNumber();
                return;
            }
            this.contacts = result.data;
            LOG.info(TAG + 'getContactDetail is ' + result);
            this.dealRecordDetailsData();
        });
    },

    /**
     * 请求后台：获取联系人详细数据,同时获取通话记录数据后对展示数据进行组装
     */
    dealRecordDetailsData: function () {
        // 手机号码类型
        this.phoneNumberType();

        // 电子邮箱类型
        this.emailType();

        // 即时消息类型
        this.instantMessageType();

        // 住宅类型
        this.residentialType();

        // 生日类型
        this.birthdayType();

        // 助理类型
        this.assistantType();

        var newContacts = this.copy(this.contacts);

        // 最后一条数据不展示分割线，首先计算总长度,如果数据长度和总长度相同，当前这条数据下划线不展示
        var totalCountNumber = 0;
        totalCountNumber = this.isTotalCountNumber(totalCountNumber, newContacts);

        var dataLengthCount = 0; // 数据长度

        newContacts.phoneNumbers = this.setTempPhoneNumbersList(totalCountNumber, dataLengthCount, newContacts);

        newContacts.emails = this.setTempEmailsList(totalCountNumber, dataLengthCount, newContacts);

        newContacts.imAddresses = this.setTempImAddressesList(totalCountNumber, dataLengthCount, newContacts);

        var showNickNameP = false;
        var showLastDividerNickNameP = true;
        if (newContacts.nickName && newContacts.nickName.nickName && newContacts.nickName.nickName.length > 0) {
            showNickNameP = true;
            if (dataLengthCount === totalCountNumber - 1) {
                showLastDividerNickNameP = false;
            } else {
                showLastDividerNickNameP = true;
            }
            dataLengthCount++;
        }

        newContacts.websites = this.setTempWebsitesList(totalCountNumber, dataLengthCount, newContacts);

        newContacts.postalAddresses = this.setTempPostalAddressesList(totalCountNumber, dataLengthCount, newContacts);

        newContacts.events = this.setTempEventsList(totalCountNumber, dataLengthCount, newContacts);

        var showGroupsP = false;
        var showLastDividerGroupsP = true;
        var showGroupsString = '';
        if (newContacts.groups && newContacts.groups.length > 0) {
            newContacts.groups.forEach((element) => {
                showGroupsString = showGroupsString + element.title + ', ';
            });
            showGroupsString = showGroupsString.substr(0, showGroupsString.length - 2);
        }
        if (showGroupsString && showGroupsString.length > 0) {
            showGroupsP = true;
            if (dataLengthCount === totalCountNumber - 1) {
                showLastDividerGroupsP = false;
            } else {
                showLastDividerGroupsP = true;
            }
            dataLengthCount++;
        }

        var showPinYinNameP = false;
        var showLastDividerPinYinNameP = true;
        if (newContacts.name && newContacts.name.familyNamePhonetic && newContacts.name.familyNamePhonetic.length > 0) {
            showPinYinNameP = true;
            if (dataLengthCount === totalCountNumber - 1) {
                showLastDividerPinYinNameP = false;
            } else {
                showLastDividerPinYinNameP = true;
            }
            dataLengthCount++;
        }

        newContacts.relations = this.setTempRelationsList(totalCountNumber, dataLengthCount, newContacts);

        var showNoteP = false;
        var showLastDividerNoteP = true;
        if (newContacts.note && newContacts.note.noteContent && newContacts.note.noteContent.length > 0) {
            showNoteP = true;
            if (dataLengthCount === totalCountNumber - 1) {
                showLastDividerNoteP = false;
            } else {
                showLastDividerNoteP = true;
            }
            dataLengthCount++;
        }

        this.contactForm.showLastDividerNickNameP = showLastDividerNickNameP;
        this.contactForm.showLastDividerNoteP = showLastDividerNoteP;
        this.contactForm.showNickNameP = showNickNameP;
        this.contactForm.showNoteP = showNoteP;
        this.contactForm.showPinYinNameP = showPinYinNameP;
        this.contactForm.showLastDividerPinYinNameP = showLastDividerPinYinNameP;
        this.contactForm.showGroupsP = showGroupsP;
        this.contactForm.showLastDividerGroupsP = showLastDividerGroupsP;
        this.contactForm.isNewNumber = false;
        this.contactForm.showMoreButton = false;
        this.contactForm.emptyNameData = newContacts.emptyNameData;
        var frist = this.contactForm.emptyNameData.substr(0, 1);
        if ((frist >= 'a' && frist <= 'z') || (frist >= 'A' && frist <= 'Z')) {
            this.contactForm.namePrefix = frist.toUpperCase();
        } else {
            this.contactForm.namePrefix = '0';
        }

        this.setContactForm(showGroupsString, newContacts);

        this.processingInitializationData(newContacts);
    },
    phoneNumberType() {
        if (this.contacts.hasOwnProperty('phoneNumbers') && this.contacts.phoneNumbers.length > 0) {
            this.contacts.phoneNumbers.forEach((element) => {
                switch (parseInt(element.labelId, 10)) {
                    case 1:
                        element.labelName = this.$t('accountants.house');
                        break;
                    case 2:
                        element.labelName = this.$t('accountants.phone');
                        break;
                    case 3:
                        element.labelName = this.$t('accountants.unit');
                        break;
                    case 4:
                        element.labelName = this.$t('accountants.unit fax');
                        break;
                    case 5:
                        element.labelName = this.$t('accountants.home fax');
                        break;
                    case 6:
                        element.labelName = this.$t('accountants.pager');
                        break;
                    case 7:
                        element.labelName = this.$t('accountants.others');
                        break;
                    case 12:
                        element.labelName = this.$t('accountants.switchboard');
                        break;
                    default:
                        element.labelName = element.labelName;

                }
            });
        }
    },
    emailType() {
        if (this.contacts.hasOwnProperty('emails') && this.contacts.emails.length > 0) {
            this.contacts.emails.forEach((element) => {
                switch (parseInt(element.labelId, 10)) {
                    case 1:
                        element.labelName = this.$t('accountants.private');
                        break;
                    case 2:
                        element.labelName = this.$t('accountants.unit');
                        break;
                    case 3:
                        element.labelName = this.$t('accountants.others');
                        break;
                    default:
                        element.labelName = element.labelName;
                }
            });
        }
    },
    instantMessageType() {
        if (this.contacts.hasOwnProperty('imAddresses') && this.contacts.imAddresses.length > 0) {
            this.contacts.imAddresses.forEach((element) => {
                switch (parseInt(element.labelId, 10)) {
                    case 1:
                        element.labelName = this.$t('accountants.AIM');
                        break;
                    case 2:
                        element.labelName = this.$t('accountants.Windows Live');
                        break;
                    case 3:
                        element.labelName = this.$t('accountants.Yahoo');
                        break;
                    case 4:
                        element.labelName = this.$t('accountants.Skype');
                        break;
                    case 5:
                        element.labelName = this.$t('accountants.QQ');
                        break;
                    case 6:
                        element.labelName = this.$t('accountants.Hangout');
                        break;
                    case 7:
                        element.labelName = this.$t('accountants.ICQ');
                        break;
                    case 8:
                        element.labelName = this.$t('accountants.Jabber');
                        break;
                    default:
                        element.labelName = element.labelName;
                }
            });
        }
    },
    residentialType() {
        if (this.contacts.hasOwnProperty('postalAddresses') && this.contacts.postalAddresses.length > 0) {
            this.contacts.postalAddresses.forEach((element) => {
                switch (parseInt(element.labelId, 10)) {
                    case 1:
                        element.labelName = this.$t('accountants.house');
                        break;
                    case 2:
                        element.labelName = this.$t('accountants.unit');
                        break;
                    case 3:
                        element.labelName = this.$t('accountants.others');
                        break;
                    default:
                        element.labelName = element.labelName;
                }
            });
        }
    },
    birthdayType() {
        if (this.contacts.hasOwnProperty('events') && this.contacts.events.length > 0) {
            this.contacts.events.forEach((element) => {
                LOG.info(TAG + ' contactDetail  events parseInt(element.labelId) =' + this.$t('accountants.phone'));
                switch (parseInt(element.labelId, 10)) {
                    case 1:
                        element.labelName = this.$t('accountants.Anniversary');
                        break;
                    case 2:
                        element.labelName = this.$t('accountants.Lunar Birthday');
                        break;
                    case 3:
                        element.labelName = this.$t('accountants.birth');
                        break;
                    case 4:
                        element.labelName = this.$t('accountants.import day');
                }
            });
        }
    },
    assistantType() {
        if (this.contacts.hasOwnProperty('relations') && this.contacts.relations.length > 0) {
            this.contacts.relations.forEach((element) => {
                switch (parseInt(element.labelId, 10)) {
                    case 1:
                        element.labelName = this.$t('accountants.assistant');
                        break;
                    case 2:
                        element.labelName = this.$t('accountants.brothers');
                        break;
                    case 3:
                        element.labelName = this.$t('accountants.child');
                        break;
                    case 4:
                        element.labelName = this.$t('accountants.companion');
                        break;
                    case 5:
                        element.labelName = this.$t('accountants.father');
                        break;
                    case 6:
                        element.labelName = this.$t('accountants.friend');
                        break;
                    case 7:
                        element.labelName = this.$t('accountants.boss');
                        break;
                    case 8:
                        element.labelName = this.$t('accountants.mother');
                        break;
                    case 9:
                        element.labelName = this.$t('accountants.parents');
                        break;
                    case 10:
                        element.labelName = this.$t('accountants.Partner');
                        break;
                    case 11:
                        element.labelName = this.$t('accountants.introducer');
                        break;
                    case 12:
                        element.labelName = this.$t('accountants.relatives');
                        break;
                    case 13:
                        element.labelName = this.$t('accountants.sisters');
                        break;
                    case 14:
                        element.labelName = this.$t('accountants.spouse');
                        break;
                    default:
                        element.labelName = element.labelName;

                }
            });
        }
    },
    isTotalCountNumber(totalCountNumber, newContacts) {
        totalCountNumber = (newContacts.phoneNumbers && newContacts.phoneNumbers.length > 0)
            ? totalCountNumber + newContacts.phoneNumbers.length : totalCountNumber;

        totalCountNumber = (newContacts.emails && newContacts.emails.length > 0)
            ? totalCountNumber + newContacts.emails.length : totalCountNumber;

        totalCountNumber = (newContacts.imAddresses && newContacts.imAddresses.length > 0)
            ? totalCountNumber + newContacts.imAddresses.length : totalCountNumber;

        totalCountNumber = (newContacts.nickName && newContacts.nickName.nickName
        && newContacts.nickName.nickName.length > 0) ? totalCountNumber + 1 : totalCountNumber;

        totalCountNumber = (newContacts.websites && newContacts.websites.length > 0)
            ? totalCountNumber + newContacts.websites.length : totalCountNumber;

        totalCountNumber = (newContacts.postalAddresses && newContacts.postalAddresses.length > 0)
            ? totalCountNumber + newContacts.postalAddresses.length : totalCountNumber;

        totalCountNumber = (newContacts.note && newContacts.note.noteContent
        && newContacts.note.noteContent.length > 0) ? totalCountNumber + 1 : totalCountNumber;

        totalCountNumber = (newContacts.events && newContacts.events.length > 0)
            ? totalCountNumber + newContacts.events.length : totalCountNumber;

        totalCountNumber = (newContacts.relations && newContacts.relations.length > 0)
            ? totalCountNumber + newContacts.relations.length : totalCountNumber;

        totalCountNumber = (newContacts.name && newContacts.name.familyNamePhonetic
        && newContacts.name.familyNamePhonetic.length > 0) ? totalCountNumber + 1 : totalCountNumber;

        totalCountNumber = (newContacts.groups && newContacts.groups.length > 0)
            ? totalCountNumber + 1 : totalCountNumber;

        return totalCountNumber;
    },
    setTempPhoneNumbersList(totalCountNumber,dataLengthCount, newContacts) {
        var tempPhoneNumbersList = [];
        if (newContacts.phoneNumbers && newContacts.phoneNumbers.length > 0) {
            newContacts.phoneNumbers.forEach((element) => {
                element.showElement = true;
                if (dataLengthCount === totalCountNumber - 1) {
                    element.showLastDivider = false;
                } else {
                    element.showLastDivider = true;
                }
                dataLengthCount++;
                tempPhoneNumbersList.push(element);
            });
        }
        return tempPhoneNumbersList;
    },
    setTempEmailsList(totalCountNumber,dataLengthCount, newContacts) {
        var tempEmailsList = [];
        if (newContacts.emails && newContacts.emails.length > 0) {
            newContacts.emails.forEach((element) => {
                element.showElement = true;
                if (dataLengthCount === totalCountNumber - 1) {
                    element.showLastDivider = false;
                } else {
                    element.showLastDivider = true;
                }
                dataLengthCount++;
                tempEmailsList.push(element);
            });
        }
        return tempEmailsList;
    },
    setTempImAddressesList(totalCountNumber,dataLengthCount, newContacts) {
        var tempImAddressesList = [];
        if (newContacts.imAddresses && newContacts.imAddresses.length > 0) {
            newContacts.imAddresses.forEach((element) => {
                element.showElement = true;
                if (dataLengthCount === totalCountNumber - 1) {
                    element.showLastDivider = false;
                } else {
                    element.showLastDivider = true;
                }
                dataLengthCount++;
                tempImAddressesList.push(element);
            });
        }
        return tempImAddressesList;
    },
    setTempWebsitesList(totalCountNumber,dataLengthCount, newContacts) {
        var tempWebsitesList = [];
        if (newContacts.websites && newContacts.websites.length > 0) {
            newContacts.websites.forEach((element) => {
                element.showElement = true;
                if (dataLengthCount === totalCountNumber - 1) {
                    element.showLastDivider = false;
                } else {
                    element.showLastDivider = true;
                }
                dataLengthCount++;
                tempWebsitesList.push(element);
            });
        }
        return tempWebsitesList;
    },
    setTempPostalAddressesList(totalCountNumber,dataLengthCount, newContacts) {
        var tempPostalAddressesList = [];
        if (newContacts.postalAddresses && newContacts.postalAddresses.length > 0) {
            newContacts.postalAddresses.forEach((element) => {
                element.showElement = true;

                if (dataLengthCount === totalCountNumber - 1) {
                    element.showLastDivider = false;
                } else {
                    element.showLastDivider = true;
                }
                dataLengthCount++;
                tempPostalAddressesList.push(element);
            });
        }
        return tempPostalAddressesList;
    },
    setTempEventsList(totalCountNumber,dataLengthCount, newContacts) {
        var tempEventsList = [];
        if (newContacts.events && newContacts.events.length > 0) {
            newContacts.events.forEach((element) => {
                element.showElement = true;
                if (dataLengthCount === totalCountNumber - 1) {
                    element.showLastDivider = false;
                } else {
                    element.showLastDivider = true;
                }
                dataLengthCount++;
                tempEventsList.push(element);
            });
        }
        return tempEventsList;
    },
    setTempRelationsList(totalCountNumber,dataLengthCount, newContacts) {
        var tempRelationsList = [];
        if (newContacts.relations && newContacts.relations.length > 0) {
            newContacts.relations.forEach((element) => {
                element.showElement = true;
                if (dataLengthCount === totalCountNumber - 1) {
                    element.showLastDivider = false;
                } else {
                    element.showLastDivider = true;
                }
                dataLengthCount++;
                tempRelationsList.push(element);
            });
        }
        return tempRelationsList;
    },
    setContactForm(showGroupsString,newContacts) {
        this.contactForm.lastName = (newContacts.name && newContacts.name.nameSuffix
        && newContacts.name.nameSuffix.length > 0) ? newContacts.name.nameSuffix : '';

        this.contactForm.company = (newContacts.organization && newContacts.organization.name
        && newContacts.organization.name.length > 0) ? newContacts.organization.name : '';

        this.contactForm.position = (newContacts.organization && newContacts.organization.title
        && newContacts.organization.title.length > 0) ? newContacts.organization.title : '';

        this.contactForm.phoneNumbers = (newContacts.phoneNumbers && newContacts.phoneNumbers.length > 0)
            ? newContacts.phoneNumbers : [];

        this.contactForm.emails = (newContacts.emails && newContacts.emails.length > 0) ? newContacts.emails : [];

        this.contactForm.imAddresses = (newContacts.imAddresses && newContacts.imAddresses.length > 0)
            ? newContacts.imAddresses : [];

        this.contactForm.nickName = (newContacts.nickName && newContacts.nickName.nickName
        && newContacts.nickName.nickName.length > 0) ? newContacts.nickName.nickName : '';

        this.contactForm.websites = (newContacts.websites && newContacts.websites.length > 0)
            ? newContacts.websites : [];

        this.contactForm.postalAddresses = (newContacts.postalAddresses && newContacts.postalAddresses.length > 0)
            ? newContacts.postalAddresses : [];

        this.contactForm.events = (newContacts.events && newContacts.events.length > 0) ? newContacts.events : [];

        this.contactForm.note = (newContacts.note && newContacts.note.noteContent
        && newContacts.note.noteContent.length > 0) ? newContacts.note.noteContent : '';

        this.contactForm.relations = (newContacts.relations && newContacts.relations.length > 0)
            ? newContacts.relations : [];

        this.contactForm.pinYinName = (newContacts.name && newContacts.name.familyNamePhonetic
        && newContacts.name.familyNamePhonetic.length > 0) ? newContacts.name.familyNamePhonetic : '';

        this.contactForm.showGroupsString = (showGroupsString && showGroupsString.length > 0) ? showGroupsString : '';
        this.contactForm.groups = (newContacts.groups && newContacts.groups.length > 0) ? newContacts.groups : [];
    },
    processingInitializationData(newContacts) {
        if (!Utils.isEmptyList(this.contactForm.phoneNumbers)) {
            var numbers = [];
            this.contactForm.phoneNumbers.forEach(element => {
                numbers.push(element.phoneNumber);
            });
            /* 获取到该联系人的所有电话号码的所有通话记录 */
            var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CALLLOG_DB_URI);
            callLogService.getCallLogListByPhoneNumber(DAHelper, numbers, (resultList) => {
                this.contactForm.numRecords = this.getDetailMessage(resultList);
            });
            /* 根据获取到的通话记录原始数据封装详请页面需要的属性 */
        }
        // 处理初始化数据
        if (this.sourceFromCallRecord && this.isNewNumber) {
            this.showNameLast = (this.contactForm.phoneNumbers && this.contactForm.phoneNumbers[0])
                ? this.contactForm.phoneNumbers[0].phoneNumber : '';
        } else {
            this.showNameLast = (this.contactForm.emptyNameData && this.contactForm.emptyNameData.length > 0)
                ? this.contactForm.emptyNameData : '';
        }
        this.showNameLastMenu = (this.showNameLast && this.showNameLast.length > 6)
            ? this.subStringWithEllipsis(this.showNameLast, 7) : this.showNameLast;
        // 将默认电话号码移动至最上边位置
        if (!Utils.isEmptyList(this.contactForm.phoneNumbers)) {
            for (var i = 0; i < this.contactForm.phoneNumbers.length; i++) {
                if (this.contactForm.phoneNumbers[i].isPrimary === 1) {
                    var tempPhoneNumber = newContacts.phoneNumbers[i];
                    this.contactForm.phoneNumbers.splice(i, 1);
                    this.contactForm.phoneNumbers.unshift(tempPhoneNumber);
                }
            }
        }
    },
    openMailApp: function (index) {
        prompt.showToast({
            message: this.$t('recordDetail.menu.noAppToDealThisAction')
        });
    },
    openMessageApp: function (index) {
        prompt.showToast({
            message: this.$t('recordDetail.menu.noAppToDealThisAction')
        });
    },
    openCalenderApp: function (index) {
        prompt.showToast({
            message: this.$t('recordDetail.menu.noAppToDealThisAction')
        });
    },

    // 跳转到关联关系人
    openMapApp() {
        this.$element('dialogPostalAddressMap').close();
        var actionData = {};
        actionData.postalAddressName = this.postalAddressName;
        let result = {
            'code': 0
        };
        if (result.code != 0) {
            LOG.info(TAG + 'plus result is error:' + result.code);
        }
    },

    /**
     * source为0时，为新建联系人跳转至搜索页面；source为1时，来源于关联关系relation跳转
     *
     * @param {number} source 点击时传进来的参数
     * @param {number} index 下标
     */
    openSearchContact: function (source, index) {
        this.$app.$def.globalData.searchValue = this.contactForm.relations[index].relationName;
        this.$app.$def.globalData.navigationType = 'contacts';
        router.back({
            path: 'pages/navigation/navigation'
        });
    },
	sendNewContent(){
		router.push({
			uri: 'pages/contacts/selectContactsList/selectContactsList',
			params: {
				type: 'saveContacts',
				number: this.phoneNumberShow,
			}
		});
	},

    /**
     * 点击打开相应网站
     *
     * @param {number} index 下标
     */
    openBrowser: function (index) {
        var actionData = {};
        actionData.openContent = this.contactForm.websites[index].website;
        let result = {
            'code': 0
        };
        if (result.code != 0) {
            LOG.info(TAG + 'plus result is error:' + result.code);
        }
    },

    /**
     * 点击postalAddress打开选择按钮
     *
     * @param {number} index 下标isTotalCountNumber
     */
    onclickPostalAddress: function (index) {
        LOG.info(TAG + 'onclickPostalAddress index' + index);
        this.postalAddressName = this.contacts.postalAddresses[index].postalAddress;
        clearTimeout(this.showMenuTimeOutId);
        /* 此处需要异步延时显示菜单，否则值刷新不过来 */
        this.showMenuTimeOutId = setTimeout(() => {
            this.$element('dialogPostalAddressMap').show({});
        }, 60);
    },

    /**
     * list 列表移动结束
     *
     * @param {Object} e event事件
     */
    onTouchEnd: function (e) {
        LOG.info(TAG + 'onTouchEnd e' + e);
        this.directPoint = (this.directPoint + this.directPointTemp);
        this.directPointTemp = 0;
    },

    /**
     * 当前列表已滑动到顶部位置
     *
     * @param {Object} e event事件
     */
    onScrollTop: function (e) {
        LOG.info(TAG + 'onScrollTop e' + e);
        this.showHeaderFlag = true;
        this.directPoint = 0;
        this.directPointTemp = 0;
    },

    /**
     * 使用联系人图标呼出电话
     *
     * @param {Object} e event事件
     */
    callOutByDialerIcon(e) {
        LOG.info(TAG + ' callOutByLog:' + e);
        this.callOut(this.contactForm.numRecords[e.detail.index].numbers[0].number);
    },

    /**
     * 电话呼出接口
     *
     * @param {Array} phoneNumber 手机号码
     */
    callOut(phoneNumber) {
        var actionData = {};
        if (phoneNumber.length == 0 && this.contactForm.numRecords.length > 0) { // 未输入电话号码时，默认拨出通话记录第一条
            actionData.phoneNumber = this.contactForm.numRecords[0].numbers[0].number;
        } else if (phoneNumber.length > 0) {
            actionData.phoneNumber = phoneNumber; // 传入需要格式化的电话号码。
        }
        this.$app.$def.call(phoneNumber);
    },

    /**
     * 获取通话记录
     *
     * @param {Array} numbers 通话记录
     */
    getNumRecords(numbers) {
        var actionData = {};
        actionData.number = numbers;
        actionData.language = this.$t('recordDetail.language');
    },

    /**
     * 删除通话记录menu选项
     *
     * @param {Object} event event事件
     */
    todoSelected(event) {
        if (event.value == 'delete') {
            this.$element('deleteCheckDialog').show();
        }
        if (event.value == 'edit') {
            this.$app.$def.dialerStateData.numTextDialer = this.sendNumber;
            this.$app.$def.dialerStateData.isEditNumber = true;
            this.$app.$def.globalData.navigationType = 0; // 返回时，返回到拨号盘
            this.$app.$def.globalData.menuType = 0;
            router.back({
                path: 'pages/navigation/navigation'
            });
        }
    },

    /**
     * 选择menu选项
     *
     * @param {Object} event event事件
     */
    todoSelectedPhoneNumber(event) {
        if (event.value == 'copyNumber') {
            var number = '';
            /* 所有非数字及+号的字符替换为空字符串 */
            number = this.contacts.phoneNumbers[this.numLongPressIndexIndex].phoneNumber.replace(/\s+/g, '');
            this.copyNumber(number);
        }
        if (event.value == 'edit') {
            this.$app.$def.dialerStateData.numTextDialer = this.sendNumber;
            this.$app.$def.dialerStateData.isEditNumber = true;
            this.$app.$def.globalData.navigationType = 0; // 返回时，返回到拨号盘
            this.$app.$def.globalData.menuType = 0;
            router.back({
                path: 'pages/navigation/navigation'
            });
        }
        if (event.value == 'setDefaultPhoneNumber') {
            this.setOrCancelDefaultPhoneNumber(SET_DEFAULT);
        }
        if (event.value == 'clearDefaultPhoneNumber') {
            this.setOrCancelDefaultPhoneNumber(CLEAR_DEFAULT);
        }
    },

    /**
     * 设置取消默认电话
     *
     * @param {number} defaultStatus 默认状态码
     */
    setOrCancelDefaultPhoneNumber(defaultStatus) {
        LOG.info(TAG + 'setOrCancelDefaultPhoneNumber' + defaultStatus);
        var actionData = {};
        actionData.contactId = this.contacts.contactId;
        actionData.phoneNumber = this.contactForm.phoneNumbers[this.numLongPressIndexIndex]
            .phoneNumber.replace(/\s+/g, '');
        actionData.isPrimary = defaultStatus;
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        favoritesModel.setOrCancelDefaultPhoneNumber(DAHelper, actionData, result => {
            if (result.code == 0) {
                if (defaultStatus == SET_DEFAULT) {
                    this.contactForm.phoneNumbers[this.numLongPressIndexIndex].isPrimary = SET_DEFAULT;
                    var tempPhoneNumber = this.contactForm.phoneNumbers[this.numLongPressIndexIndex];
                    this.contactForm.phoneNumbers = this.copy(this.contacts.phoneNumbers);
                    // 将默认电话号码移动至最上边位置
                    var tempIndex = 0;
                    if (!Utils.isEmptyList(this.contactForm.phoneNumbers)) {
                        for (var i = 0; i < this.contactForm.phoneNumbers.length; i++) {
                            if (tempPhoneNumber.phoneNumber == this.contactForm.phoneNumbers[i].phoneNumber) {
                                tempIndex = i;
                            } else {
                                this.contactForm.phoneNumbers[i].isPrimary = CLEAR_DEFAULT;
                            }
                        }
                    }
                    this.contactForm.phoneNumbers.splice(tempIndex, 1);
                    this.contactForm.phoneNumbers.unshift(tempPhoneNumber);
                }
                if (defaultStatus == CLEAR_DEFAULT) {
                    this.contactForm.phoneNumbers = this.contacts.phoneNumbers;
                    this.contactForm.phoneNumbers.forEach(element => {
                        element.isPrimary = CLEAR_DEFAULT;
                    });
                }
            } else {
                prompt.showToast({
                    message: this.$t('Fail to update default phone number!')
                });
            }
        });

    },

    /**
     * 跳转到关联关系人
     *
     * @param {Object} event event事件
     */
    todoSelectedContent(event) {
        if (event.value == 'copyToClipBoard') {
            this.copyNumber(this.relationName);
        }
    },
    copyContentCancelDialogPostalAddress() {
        this.$element('dialogPostalAddressMap').close();
        this.copyNumber(this.postalAddressName);
    },

    /**
     * 复制方法
     *
     * @param {string} data 需要复制的信息
     */
    copyNumber(data) {
        LOG.info(TAG + 'copyNumber data' + data);
        var actionData = {};
        actionData.pasteBoardContent = data;
    },

    /**
     * 分享选择的内容
     *
     * @param {Object} event event事件
     */
    shareSelectContact: function (event) {
        if (event.value == 'deleteContact') {
            this.$element('deletedialogcontact').show();
        }
        if (event.value == 'deleteRecord') {
            this.$element('deletedialogrecord').show();
        }
        if (event.value == 'shareContact') {
            this.$element('shareDialogDetails').show();
        }
    },

    /**
     * 删除联系人详情更多通话记录Menu选择项
     *
     * @param {Object} event event事件
     */
    shareSelectRecord: function (event) {
        if (event.value == 'deleteRecord') {
            this.$element('deletedialogrecord').show();
        }
    },

    cancelClickContact: function () {
        this.$element('deletedialogcontact').close();
    },

    cancelClickQrCode: function () {
        this.$element('dialogContactsDetailQrCode').close();
    },

    cancelClickRecord: function () {
        this.$element('deletedialogrecord').close();
    },

    /**
     * 删除联系人列表数据
     *
     * @param {number} code FA与PA通行协议码2005
     * @param {number} data contactId 联系人ID
     */
    deleteContactData(code, data) {
        LOG.info(TAG + 'deleteContactData code' + code);
        LOG.info(TAG + 'deleteContactData data' + data);
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        var result = contactsService.deleteContacts(DAHelper, data, result => {
            if (result == 0) {
                router.back();
            } else {
                prompt.showToast({
                    message: 'contactDetail Failed to delete data.'
                });
            }
        });
    },

    /** 点击删除按钮后删除联系人数据 */
    deleteClickContact: function () {
        this.$element('deletedialogcontact').close();
        var requestData = {
            contactId: this.contacts.contactId
        };
        this.deleteContactData(DELETE_CONTACT, requestData);
    },

    /** 点击删除按钮后删除通话记录数据 */
    deleteClickRecord: function () {
        this.$element('deletedialogrecord').close();
        this.clearRecordsMore();
    },

    // 通话记录删除
    clearRecordsMore() {
        var id = '';
        var ids = [];
        for (let index = 0; index < this.contactForm.numRecords.length; index++) {
            id = this.contactForm.numRecords[index].id;
            ids.push(id);
        }
        this.removeCallLog(ids);
        this.contactForm.numRecords = [];
        this.contactForm.showMoreButton = false;
    },

    /* 确认删除 */
    doDelete() {
        var id = this.contactForm.numRecords[this.deleteIndex].id;
        var ids = [];
        ids.push(id);
        this.removeCallLog(ids);
        this.contactForm.numRecords.splice(this.index, 1);
        this.$element('deleteCheckDialog').close();
    },

    /* 取消删除 */
    cancelDialog() {
        this.$element('deleteCheckDialog').close();
    },

    /* 取消跳转地图 */
    cancelDialogPostalAddress() {
        this.$element('dialogPostalAddressMap').close();
    },

    /**
     * 删除通话记录
     *
     * @param {Array} ids 删除的通话记录的id集
     */
    removeCallLog: function (ids) {
        // 删除指定通话记录
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CALLLOG_DB_URI);
        callLogService.deleteCallLogByIds(DAHelper, ids, () => {
        });
    },

    /**
     * 发送消息
     *
     * @param {number} phoneNumber 手机号码
     * @param {string} name 姓名
     */
    sendMessage(phoneNumber, name) {
        var params = [];
        params.push({
            contactsName: name,
            telephone: phoneNumber,
            telephoneFormat: phoneNumber,
        });
        this.$app.$def.sendMessage(params);
    },

    /* 新建联系人 */
    addContacts() {
        let show = this.phoneNumberShow.length >0 ? true :false;
		this.$app.$def.dialerStateData.isNeedShowDialer = false;
		router.push({
			uri: 'pages/contacts/accountants/accountants',
			params: {
				addShow: true,
				updataShow: false,
				showWork: true,
				upHouseShow: true,
				phoneNumbers: [
					{
						'id': '',
						'labelId': 2,
						'labelName': '手机',
						'phoneNumber': this.phoneNumberShow,
						'phoneAddress': 'N',
						'blueStyle': false,
						'showP': show
					}]
			},
		});
    },

    /**
      * 截取字符串的前五个字符外加.. 例如：'哈哈哈哈哈哈哈哈' => '哈哈哈哈哈..'
      *
      * @param {string} str 对象字符串
      * @param {number} len 长度
      * @return {Object} newStr 截取后字符串
      */
    subStringWithEllipsis(str, len) {
        let newLength = 0;
        let newStr = '';
        let chineseRegex = /[^\x00-\xff]/g;
        let singleChar = '';
        let strLength = str.replace(chineseRegex, '**').length;
        for (var i = 0; i < strLength; i++) {
            singleChar = str.charAt(i).toString();
            if (singleChar.match(chineseRegex) != null) {
                newLength += 2;
            } else {
                newLength++;
            }
            if (newLength > len) {
                break;
            }
            newStr += singleChar;
        }
        newStr += '..'
        return newStr ;
    },
    showMoreMenuOperationSaveContacts() {
        this.$element('contactSaveContactBottom').show({
            x: this.touchMoveStartX,
            y: this.touchMoveStartY
        });
    },
    showMoreMenuOperationNew() {
        this.$element('contactNewNumberBottom').show({
            x: this.touchMoveStartX,
            y: this.touchMoveStartY
        });
    },

    /**
     * 手指触摸动作
     *
     * @param {Object} e event事件
     */
    touchMoreStartButtom(e) {
        LOG.info(TAG + 'touchMoreStartButtom e' + e);
        /* 记录底部更多触摸起点 */
        this.touchMoveStartX = e.touches[0].globalX;
        this.touchMoveStartY = e.touches[0].globalY;
    },

    // 点击右上角二维码小图标，下侧弹出二维码对话框和二维码
    onclickContactsDetailQrCode: function () {
        var name = (this.contacts.name && this.contacts.name.fullName && this.contacts.name.fullName.length > 0)
            ? 'N:' + this.contacts.name.fullName + ';' : '';

        var company = (this.contacts.organization && this.contacts.organization.name
        && this.contacts.organization.name.length > 0) ? 'ORG:' + this.contacts.organization.name + ';' : '';

        var postalAddresses = (this.contacts.postalAddresses && this.contacts.postalAddresses[0]
        && this.contacts.postalAddresses[0].postalAddress.length > 0)
            ? 'ADR:' + this.contacts.postalAddresses[0].postalAddress + ';' : '';

        var phoneNumbersString = '';
        var phoneNumberLength = (this.contacts && this.contacts.phoneNumbers) ? this.contacts.phoneNumbers.length : 0;
        for (var i = 0; i < phoneNumberLength; i++) {
            if (i >= 2) {
                break;
            } else {
                phoneNumbersString = phoneNumbersString + 'TEL:' + this.contacts.phoneNumbers[i].phoneNumber + ';';
            }
        }
        var stringEmails = '';
        var emailsLength = (this.contacts && this.contacts.emails) ? this.contacts.emails.length : 0;
        for (var i = 0; i < emailsLength; i++) {
            if (i >= 2) {
                break;
            } else {
                stringEmails = stringEmails + 'EMAIL:' + this.contacts.emails[i].email + ';';
            }
        }
        var websites = (this.contacts.websites && this.contacts.websites[0]
        && this.contacts.websites[0].website.length > 0) ? 'URL:' + this.contacts.websites[0].website + ';' : '';

        var position = (this.contacts.organization && this.contacts.organization.title
        && this.contacts.organization.title.length > 0) ? 'TIL:' + this.contacts.organization.title + ';' : '';

        var note = (this.contacts.note && this.contacts.note.noteContent && this.contacts.note.noteContent.length > 0)
            ? 'NOTE:' + this.contacts.note.noteContent : '';

        var imAddresses = (this.contacts.imAddresses && this.contacts.imAddresses.length > 0
        && this.contacts.imAddresses[0].imAddress.length > 0) ? this.contacts.imAddresses[0].imAddress + ';;' : '';

        this.qrcodeString = 'MECARD:' + name + company + postalAddresses + phoneNumbersString
        + stringEmails + websites + position + note + imAddresses;
        clearTimeout(this.showMenuTimeOutId);
        /* 此处需要异步延时显示菜单，否则值刷新不过来 */
        this.showMenuTimeOutId = setTimeout(() => {
            this.$element('dialogContactsDetailQrCode').show();
        }, 60);
    },

    // 点击弹出二维码对话框取消按钮，关闭二维码
    cancelContactsDetailQrCode: function () {
        clearTimeout(this.showMenuTimeOutId);
        this.$element('dialogContactsDetailQrCode').close();
    },

    // 取消分享
    shareCancelClick: function () {
        this.$element('shareDialogDetails').close();
    },

    // 点击分享二维码
    shareClickQrCode: function () {
        prompt.showToast({
            message: this.$t('recordDetail.menu.noAppToDealThisAction')
        });
    },

    /**
     * 非联系人时，获取通话记录，组装参数
     *
     * @param {Array} numbers 手机号码
     */
    getNewNumRecords(numbers) {
        var actionData = {};
        actionData.number = numbers;
        actionData.language = this.$t('recordDetail.language');
        var newContacts = {};
        this.contactForm.isNewNumber = true;
        this.contactForm.showMoreButton = false;
        this.contactForm.name = this.phoneNumberShow;
        this.contactForm.showNewContact = true;
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CALLLOG_DB_URI);
        callLogService.getCallLogListByPhoneNumber(DAHelper, numbers, (resultList) => {
            /* 根据获取到的通话记录原始数据封装详请页面需要的属性 */
            this.contactForm.numRecords = this.getDetailMessage(resultList);
            /* 创建联系人电话列表对象 */
            var phoneNumbersTemp = {};
            if (this.contactForm.numRecords.length > 0) {
                phoneNumbersTemp.phoneAddress = this.contactForm.numRecords[0].callTag;
            }
            phoneNumbersTemp.phoneNumber = this.phoneNumberShow;
            var phoneNumbersTempList = [phoneNumbersTemp];
            this.contactForm.phoneNumbers = phoneNumbersTempList;
            newContacts.phoneNumbers = phoneNumbersTempList;
            // 组装 contacts: originalContacts
            newContacts.name = {
                'name': this.contactForm.name
            };
            newContacts.isNewNumber = this.contactForm.isNewNumber;
            newContacts.showMoreButton = this.contactForm.showMoreButton;
            newContacts.numRecords = this.contactForm.numRecords;
            /* 在新号码跳转详情界面中，使用通话记录第一条的id取模从头像背景色中获取获取 */
            var index = parseInt(this.contactForm.numRecords[0].id, 10) % 6;
            newContacts.portraitColor = this.backgroundColor[index];
            newContacts.detailsBgColor = this.backgroundDetailColor[index];
            this.contacts = newContacts;
            // 处理初始化数据
            if (this.sourceFromCallRecord && this.isNewNumber) {
                this.showNameLast = (this.contactForm.phoneNumbers && this.contactForm.phoneNumbers[0])
                    ? this.contactForm.phoneNumbers[0].phoneNumber : '';
            } else {
                this.showNameLast = (this.contactForm.emptyNameData && this.contactForm.emptyNameData.length > 0)
                    ? this.contactForm.emptyNameData : '';
            }
            this.showNameLastMenu = (this.showNameLast && this.showNameLast.length > 6)
                ? this.subStringWithEllipsis(this.showNameLast, 7) : this.showNameLast;
        });
    },

    /**
     * 根据原始callLogList内容转化为通话记录详情需要的数据
     *
     * @param {Array} originList 原始通话列表
     * @return {Array} resultList 结果集
     */
    getDetailMessage(originList) {
        LOG.info(TAG + 'getDetailMessage originList' + originList);
        var resultList = [];
        if (Utils.isEmptyList(originList)) {
            return resultList;
        }
        originList.forEach(element => {
            element.timeDetail = this.getTimeDetailByCallTime(element.callTime);
            element.talkTime = this.getTalkTimeMessage(element);
        });
        resultList = originList;
        return resultList;
    },

    /* 文本分享联系人 */
    shareContactInfoByTest() {
        var detailInfo = JSON.stringify(this.contactForm);
    },

    /**
     * 根据通话记录获取该通话记录的通话详情
     *
     * @param {Object} callLogElement 通话记录
     * @return {string} resultMessage 状态信息
     */
    getTalkTimeMessage(callLogElement) {
        LOG.info(TAG + 'getTalkTimeMessage callLogElement' + callLogElement);
        var resultMessage = '';
        if (callLogElement.callType == 1) { // 呼入：直接显示通话时长
            resultMessage = this.getDescriptionByDuration(callLogElement.talkTime);
        } else if (callLogElement.callType == 2) { // 呼出：通话时长为0时，为未接通，否则直接显示通话时长
            resultMessage = callLogElement.talkTime == 0 ? '未接通'
            : this.getDescriptionByDuration(callLogElement.talkTime);
        } else if (callLogElement.callType == 3) { // 未接：未接来电显示响铃时长
            resultMessage = '响铃' + this.getDescriptionByDuration(callLogElement.ringTime);
        } else if (callLogElement.callType == 5) { // 拒接
            resultMessage = '拒接';
        }
        return resultMessage;
    },

    /**
     * 根据指定的时间戳获取通话时长 timeDuration:单位s
     *
     * @param {number} timeDuration 时间周期
     * @return {Object} 返回时间单位
     */
    getDescriptionByDuration(timeDuration) {
        LOG.info(TAG + 'getDescriptionByDuration timeDuration' + timeDuration);
        var seconds = parseInt(timeDuration);
        if (seconds < 60) { // 一分钟以内
            return seconds + '秒';
        } else {
            var minutes = parseInt(seconds / 60);
            if (minutes < 60) { // 一小时以内
                return minutes + '分' + seconds % 60 + '秒';
            } else {
                var hours = parseInt(minutes / 60);
                return hours + '时' + minutes % 60 + '分' + seconds % 3600 % 60 + '秒';
            }
        }
    },

    /**
     * 根据通话记录生成时间获取时间细节信息
     *
     * @param {number} callTime 初始通话时间
     * @return {string} timeDetail 处理后的通话时间
     */
    getTimeDetailByCallTime(callTime) {
        LOG.info(TAG + 'getTimeDetailByCallTime callTime' + callTime);
        var callLogTime = new Date(parseInt(callTime, 10) * 1000); // 获取通话记录的时间
        var now = new Date(); // 获取当前的系统时间
        var yearDiff = now.getFullYear() - callLogTime.getFullYear();
        var monthDiff = now.getMonth() - callLogTime.getMonth();
        var dayDiff = now.getDate() - callLogTime.getDate();
        var hour = callLogTime.getHours();
        var timeDetail = '';
        if (yearDiff == 0) { // 同一年份
            if (monthDiff == 0) { // 同一月份
                if (dayDiff == 0) { // 同一天
                    /* 例：傍晚18:06 */
                    timeDetail = this.getDayMessage(hour) + callLogTime.getHours() + ':'
                    + (callLogTime.getMinutes() < 10 ? '0' + callLogTime.getMinutes() : callLogTime.getMinutes());
                }
            }
            timeDetail = (callLogTime.getMonth() + 1) + '月' + callLogTime.getDate() + '日' + ' '
            + this.getDayMessage(hour) + callLogTime.getHours() + ':'
            + (callLogTime.getMinutes() < 10 ? '0' + callLogTime.getMinutes() : callLogTime.getMinutes());
        } else { // 不同年份：显示年月日
            timeDetail = callLogTime.getFullYear() + '年' + (callLogTime.getMonth() + 1) + '月'
            + callLogTime.getDate() + '日' + ' ' + this.getDayMessage(hour) + callLogTime.getHours() + ':'
            + (callLogTime.getMinutes() < 10 ? '0' + callLogTime.getMinutes() : callLogTime.getMinutes());
        }
        LOG.info(TAG + ' timeDetail = ' + timeDetail);
        return timeDetail;
    },

    /**
     * 根据小时数获取该时间在一天范围内的描述
     *
     * @param {number} hour 时间
     * @return {string} 时间节点
     */
    getDayMessage(hour) {
        LOG.info(TAG + ' getDayMessage' + hour);
        if (hour >= 0 && hour < 5) {
            return '凌晨';
        }
        if (hour >= 5 && hour < 11) {
            return '上午';
        }
        if (hour >= 11 && hour < 13) {
            return '中午';
        }
        if (hour >= 13 && hour < 17) {
            return '下午';
        }
        if (hour >= 17 && hour < 19) {
            return '傍晚';
        }
        if (hour >= 19 && hour < 22) {
            return '晚上';
        }
        if (hour >= 22 && hour < 24) {
            return '半夜';
        }
    }
};
