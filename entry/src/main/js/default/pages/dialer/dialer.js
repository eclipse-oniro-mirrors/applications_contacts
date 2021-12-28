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
import callLogService from '../../../default/model/CalllogModel.js';
import searchContactModel from '../../../default/model/GroupsModel.js';
import Utils from '../../../default/utils/utils.js';
import router from '@system.router';
import pasteboard from '@ohos.pasteboard';
import LOG from '../../utils/ContactsLog.js';
import Constants from '../../../default/common/constants/Constants.js';
import sim from '@ohos.telephony.sim';
import radio from '@ohos.telephony.radio';

const DEFAULT_INT_VALUE = 0; // 整形默认值 0
const NUM_TEXT_FONT_SIZE_MAX = 70; // 号码编辑框数字最大字体大小，单位px
const NUM_TEXT_PADDING_LEFT_MAX = 364; // 号码编辑框最大左内边距padding-left值，默认取一半的逻辑屏幕宽度，单位px
const NUM_TEXT_MAXSIZE_LENGTH = 16; // 号码编辑框 最大字体 70px时的最大长度
const NUM_TEXT_OFFSET_UNIT = 20; // 号码编辑框最大字体大小70px的情况下，每输入一个数字后的单位偏移量，单位px
const NUM_TEXT_MAX_LENGTH = 25; // 号码编辑框最大可显示号码长度，依据p40为25个数字
const NUM_TEXT_SPACE_OFFSET_UNIT = 10; // 字符串中包含空格时，每有一个空格，偏移量是原偏移量的1/2,即10px
const DIALER_BUTTON_MARGIN_HIDE = 260; // 拨号盘绿色按钮隐藏状态margin值
const DIALER_BUTTON_MARGIN_SHOW = 0; // 拨号盘绿色按钮显示状态margin值
const DIALER_BUTTON_OPACITY_HIDE = 0.0; // 拨号盘绿色按钮隐藏状态 中心白点透明度
const DIALER_BUTTON_OPACITY_SHOW = 1.0; // 拨号盘绿色按钮显示状态 中心白点透明度
const DIALER_MARGIN_BOTTOM_HIDE = -690; // 拨号盘隐藏状态底部margin值
const DIALER_MARGIN_BOTTOM_OPTION_HIDE = -820; // 拨号盘带联系人操作框时隐藏状态底部margin值
const DIALER_MARGIN_BOTTOM_SHOW = 0; // 拨号盘显示状态底部margin值
const DIALER_ANIMATION_DISTANCE_DEFAULT = 690; // 拨号盘默认情况下动画距离
const DIALER_ANIMATION_DISTANCE_OPTION = 820; // 拨号盘存在联系人操作框时的动画距离
const LOG_ITEM_ANIMATION_MAX_DISTANCE = 180; // 左滑最大距离180px；
const LOG_ITEM_ANIMATION_INIT_DISTANCE = 0; // 通话记录左滑初始位置
const BOTTOM_MENU_HEIGHT = 130; // 底部窗口高度，单位px
const VOICE_MAIL_INDEX = 2;
const MISSED_CALLS_INDEX = 1; // 表示当前页签处于未接来电状态
const ALL_CALLS_INDEX = 0; // 表示当前页签处于通话记录状态
const SECRETE_CODE_1 = '*#06#';
const SECRETE_CODE_2 = '*#0000#';
const SECRETE_CODE_3 = '*#*#2846579#*#*';

var TAG = '   dialer....: ';

export default {
    props: ['recordList', 'missedList', 'voicemailList', 'batchDelete', 'numTextValue', 'ifShow', 'pasteDisabled',
    'showTips', 'tipData'],
    data: {
        /* 拨号盘显示控制 */
        showDialer: true,
        /* 初始化 */
        isFirstInit: true,
        /* 是否显示语音信箱相关信息，只有插入移动卡时，才显示语音信箱 */
        showVoiceMail: false,
        numText: '', // 拨号时显示的号码文本
        numTextPaddingLeft: DEFAULT_INT_VALUE, // 号码编辑框左内边距padding宽度
        viewText: '', // 用于存储视界范围内的字符串（号码后30位），
        numTextSize: NUM_TEXT_FONT_SIZE_MAX, // 号码编辑框数字初始逻辑宽度
        areaInfo: '', // 拨号时显示的电话号码信息，如：陕西 西安
        deleteButtonDisabled: true, // 删除按键是否失效
        dialButtonDisabled: true, // 拨号按键是否失效
        isTouchActive: false, // 是否开启系统触摸反馈
        dialerStyle: 'board-contacts-operate',
        boardThumbnailStyle: 'board-thumbnail-button-thumbnail',
        hideDialerTimeOutId: '',
        showDialerTimeOutId: '',
        showDialButton: 'visible', // 是否显示拨号按钮，当界面动画过程时，不显示拨号按钮，
        /* 拨号盘绿色按钮动画相关定义 */
        bordButtonMarginRight: 260, // 拨号盘 绿色按钮右侧margin值，单位:px;
        bordButtonWidth: 100, // 拨号盘绿色按钮双卡状态宽度，单位:px;
        showBoardThumbnail: false, // 是否显示拨号盘绿色图标
        thumbnailOpacity: 1, // 绿色图标按钮内部白点默认透明
        /* 普通和高清通话适配 */
        isHDMode: false, // 是否设置了高清语音通话
        /* 是否是长按事件 */
        isLongPressEvent: false,
        /* #号键长按标识，true时长按输入#号，false时长按输入 ; 号*/
        markFlag: false,
        /* 是是拨打电话状态 */
        isCallState: false,
        /* 是否是显示详情状态 */
        isShowDetailState: false,
        /* 通话记录tab页签下标 0:通话记录，1：未接来电, 2:语音信箱 */
        callLogIndex: 0,
        /* 拨号搜索匹配记录 */
        matchedRecordsList: [],
        /* 控制界面显示大标题还是小标题，0：大标题，1：小标题 */
        titleType: 0,
        /* 拨号盘触摸移动事件数据 */
        dialerTouchData: {
            touchStartX: 0,
            touchStartY: 0,
            isTouchMove: false // 拨号盘的滑动事件不会触发按钮输入
        },
        /* 单双卡样式适配 */
        isSingleCard: true, // 单卡模式为true，双卡模式为false
        simMessage: {
            simCount: 0,
            sim1State: 0,
            sim2State: 0,
            sim1SpnMessage: '',
            sim2SpnMessage: '',
            voicemailNumberSim1: '',
            voicemailNumberSim2: '',
            telephoneNumberSim1: '',
            telephoneNumberSim2: '',
            defaultSimSlot: 0,
        },
        /* 更多操作菜单样式 */
        optionMenu: {
            copyDisabled: true,
            batchDeleteDisabled: true
        },

        /* 拨号界面控件是否显示标识配置 */
        ifShowConfig: {
            showAeraInfo: false, // 是否显示号码地区信息
            showContactsOperates: false, // 是否显示新建联系人操作项
            /* 拨号界面电话标题显示控制 */
            showPhoneTitle: true,
            /* 号码显示区域控制 */
            showNumTextAera: false,
            showAttentionInfo: false, // 是否显示提示信息
            /* 通话记录相关 */
            showCallRecords: false,
            /* 拨号搜索相关 */
            showMatchedList: false,
        },

        /* 部分组件动态样式列表 */
        dynamicStyle: {
            boardThumbnailButtonClass: 'board-thumbnail-button', // 拨号盘缩略图标整体样式
            boardThumbnailIconClass: 'board-thumbnail-button-icon', // 拨号盘缩略图标白点样式
            boardThumbnailBoxClass: 'board-thumbnail-box',
            numTextAeraClass: 'num-text-area-num',
            /* 组件窗口样式变换数据 */
            numTextAttention: 'num-text-attention',
        },

        /* 图片资源 */
        iconResource: {
            ic_contacts_add: '/res/image/ic_contacts_add_m2.svg',
            ic_contacts_call_dial: '/res/image/ic_contacts_call_dial_56.svg.svg',
            ic_contacts_call_dial_HD: '/res/image/ic_contacts_call HD dial_56.svg.svg',
            ic_contacts_delete: '/res/image/ic_contacts_Delete_m.svg',
            ic_contacts_name: '/res/image/ic_contacts_name_m.svg',
            ic_contacts_voicemail: '/res/image/ic_contacts_voicemail_mini.svg',
            ic_contacts_dialer: '/res/image/ic_contacts_dialer.svg',
            ic_video_m: '/res/image/ic_video_m.svg',
            ic_message: '/res/image/ic_meetime_24x24_message.svg',
            ic_more: '/res/image/ic_more_24x24.svg',
            ic_contacts_dial_HD_1: '/res/image/ic_contacts_dial call HD_1_m.svg',
            ic_contacts_dial_HD_2: '/res/image/ic_contacts_dial call_HD_2_m.svg',
            ic_contacts_dial_1: '/res/image/ic_contacts_dial call_1_m.svg',
            ic_contacts_dial_2: '/res/image/ic_contacts_dial call_2_m.svg',
            ic_detail_public: '/res/image/ic_public_about_m.svg',
        },
        /* 剪切板内容 */
        clipboardData: {
            showClipboard: false,
            number: '',
            showClipboardInit: false,
            bottomDst: DIALER_ANIMATION_DISTANCE_OPTION,
        },
        /* 分页信息 */
        pageInfo: {
            pageIndex: 0,
            pageSize: 20,
            pageIndexMissedCalls: 0,
            pageSizeMissedCalls: 20,
            pageIndexMatchedList: 0,
            pageSizeMatchedList: 200, // 拨号搜索一页匹配数
            totalCount: 0,
        },
        /* 拨号搜索列表长按菜单数据 */
        matchedMenuData: {
            index: '',
            itemId: [],
            name: '',
            number: '',
            showMatchedMenuTimeOutId: 0,
        },
        // 快速拨号数据获取key
        speedDetailsDataKey: 'speedDetailsDataKey',
        // 快速拨号下标
        routerIndex: -1,
        speedIndex: -1, // 记录快速拨号下标，在长按设置快速拨号联系人时使用
        speedNum: 9,
        // 缓存快速拨号数组
        speedTempList: [],
        speedTempItem: null,
        callLogTouchData: {
            touchStartX: 0,
            touchStartY: 0,
            firstLeftDst: 0, // 表示当前触摸的列表项(list-item)的向左偏移位置
            currentIndex: 0, // 记录当前触摸列表的index
            leftItemIndex: null, // 已偏移的列表项index记录
            touchEventTaskId: 0,
        },
        secreteCodeMessage: {
            meid: '',
            pesn: '',
            imei1: '',
            imei2: '',
            sn: '',
        },
        /* 通话记录合并规则 'from_time':按时间合并， 'from_contact': 按联系人合并*/
        callLogMergeRule: '',
        pinYinArr: [] // 拨号盘拼音组合结果
    },
    /* 生命周期函数 */
    onInit() {
        LOG.info(TAG + 'onInit......');
        this.numText = this.$app.$def.dialerStateData.numTextDialer;
        // 适配界面的拨号与删除按钮是否需要置灰
        this.deleteButtonDisabled = true;
        // 初始化sim卡相关信息
        this.initSimCardMessage();
        this.numText = this.$app.$def.dialerStateData.numTextDialer;
        // 注册刷新回调函数，在父页面onShow时调用。
        this.$app.$def.globalData.refreshFunctions.push(() => {
            LOG.info(TAG + 'onInit' + ' editNumber = ');
            if (this.$app.$def.dialerStateData.isEditNumber) { // 如果是其他页面通过呼叫前编辑到达，则展示呼叫前编辑界面。
                this.numText = this.$app.$def.dialerStateData.numTextDialer;
                this.$app.$def.dialerStateData.isEditNumber = false;
                this.$app.$def.dialerStateData.numTextDialer = '';
            }
            this.initSimCardMessage();
            this.checkIfShow();
        });
        // 注册返回键回调函数，在navigation的onBackPress触发时调用。
        this.$app.$def.globalData.navigationBackPressFunctions.push(() => {
            LOG.info(TAG + 'onInit' + ' onBackPress Dialer!');
            if (this.numText.length > 0) {
                this.numText = '';
                this.checkIfShow();
                return true;
            }
            return false;
        });
        this.isFirstInit = this.$app.$def.globalData.storage.getSync('showAttention', true);
        this.checkIfShow();
    },
    onReady() {
        LOG.info(TAG + 'onReady......');
    },
    onShow() {
        LOG.info(TAG + 'onShow......');
    },
    onHide() {
        LOG.info(TAG + 'onHide......');
    },
    onDestroy() {
        LOG.info(TAG + 'onDestroy......');
        this.$app.$def.globalData.refreshFunctions.pop();
        this.$app.$def.globalData.navigationBackPressFunctions.pop();
    },
    /* 拨号盘状态刷新 */
    onRefreshDialerState() {
        LOG.info(TAG + 'onRefreshDialerState' + ' this.onRefreshDialerState: ' + this.onRefreshDialerState);
        this.refreshCallLog();
        this.resetItemState(); // 通话记录左滑状态重置
        this.checkIfShow();
    },
    sendMessage(number, name) {
        var params = [];
        params.push({
            contactsName: name,
            telephone: number,
            telephoneFormat: number,
        });

        this.$app.$def.sendMessage(params);
        this.$app.$def.dialerStateData.isNeedShowDialer = false;
    },

    changeTitle(e) {
        LOG.info(TAG + 'changeTitle' + 'logMessage changeTitle type = ');
        this.titleType = e.detail.type;
    },
    touchStartDialer(e) {
        /* 记录拨号盘触摸起点 */
        this.dialerTouchData.touchStartX = e.touches[0].globalX;
        this.dialerTouchData.touchStartY = e.touches[0].globalY;
    },
    touchMoveDialer(e) {
        /* 拨号盘上向下滑动距离大于100px并且大于横向滑动距离时，触发隐藏拨号盘 */
        var offsetY = e.touches[0].globalY - this.dialerTouchData.touchStartY;
        if ((offsetY > 100) && offsetY > Math.abs(e.touches[0].globalX - this.dialerTouchData.touchStartX)
        && !this.dialerTouchData.isTouchMove) {
            // 添加!this.dialerTouchData.isTouchMove 防止重复触发touchmove事件重复调用动画
            this.dialerTouchData.isTouchMove = true;
            this.hideDialer();
        }
    },
    buttonTouchStart() {
        if (!Utils.isEmpty(this.numText)) { // 在界面无输入时，触发touchStart振动
            this.vibrateByConfig();
        }
    },
    /* 拨号按钮触摸开始 */
    dialButtonTouchStart() {
        /* 置换拨号按钮为深绿色点击图标 */
        this.iconResource.ic_contacts_call_dial = '/res/image/ic_contacts_call_dial_56_clicked.svg.svg';
        this.iconResource.ic_contacts_call_dial_HD = '/res/image/ic_contacts_call HD dial_56_clicked.svg.svg';
        if (!Utils.isEmpty(this.numText)) { // 在界面无输入时，触发touchStart振动
            this.vibrateByConfig();
        }
    },
    /* 拨号按钮触摸结束 */
    dialButtonTouchEnd() {
        /* 回置拨号按钮为原图标 */
        this.iconResource.ic_contacts_call_dial = '/res/image/ic_contacts_call_dial_56.svg.svg';
        this.iconResource.ic_contacts_call_dial_HD = '/res/image/ic_contacts_call HD dial_56.svg.svg';
    },
    buttonTouchEnd(keyValue) {
        if (Utils.isEmpty(this.numText) && !this.isLongPressEvent) { // 界面无输入且非长按事件时，touchEnd触发振动
            this.vibrateByConfig();
        }
        if (!this.isLongPressEvent && !this.dialerTouchData.isTouchMove) {
            this.appendNumText(keyValue);
            this.markFlag = false;
        }
        this.isLongPressEvent = false;
        this.dialerTouchData.isTouchMove = false;
    },
    /* 拨号盘各按键长按事件 */
    buttonLongPress(keyValue) {
        // 长按事件触发振动
        this.vibrateByConfig();
        this.isLongPressEvent = true;
        switch (keyValue) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
            // 快速拨号判断：界面无输入时进行快速拨号，界面有输入时，长按输入对应数字
                if (Utils.isEmpty(this.numText)) {
                    this.speedCall(keyValue);
                } else { // 有输入时，长按输入对应数字
                    this.appendNumText(keyValue);
                }
                break;
        /* 长按0键 */
            case 0:
                this.appendNumText('+')
                break;
        /* 长按*键 */
            case '*':
                if (this.numText.length == 0) {
                    this.appendNumText('*');
                } else {
                    this.appendNumText(',');
                }
                this.markFlag = false;
                break;
        /* 长按#键 */
            case '#':
                if (this.numText.length == 0) {
                    this.appendNumText('#');
                    this.markFlag = false;
                } else if (this.markFlag) {
                    this.appendNumText('#');
                    this.markFlag = false;
                } else {
                    this.appendNumText(';');
                    this.markFlag = true;
                }
                break;
            default:
                break;
        }
    },
    appendNumText(keyValue) {
        this.numText = this.numText + keyValue;
        this.numberPressCheck();
    },

    comb(arr) {
        let temp = []
        for (let i in arr[0]) {
            for (let j in arr[1]) {
                temp.push(`${arr[0][i]}${arr[1][j]}`)
            }
        }
        arr.splice(0, 2, temp)
        if (arr.length > 1) {
            this.comb(arr)
        } else {
            return temp
        }
        return arr[0];
    },


    buttonTouchStartX() {
        if (this.numText.length == 0) {
            LOG.info(TAG + 'buttonTouchStartX' + 'numText length is empty.');
        }
    },
    buttonTouchEndX() {
        if (!this.isLongPressEvent) { // 删除按键非常按时，touchEnd触发振动
            this.vibrateByConfig();
        } else {
            this.isLongPressEvent = false; // 回置长按事件标识
        }
        if (this.numText.length > 0) {
            this.numText = this.numText.trim();
            this.numText = this.numText.substr(0, this.numText.length - 1).trim();
        }
        if (this.numText.length >= 6) {
            this.showAeraInfo = true;
        } else {
            this.showAeraInfo = false;
        }
        this.numberPressCheck();
    },
    clearNumText() { // 长按时清空号码及区域信息，显示输入提示信息
        this.isLongPressEvent = true;
        this.vibrateByConfig();
        this.numText = '';
        this.checkIfShow();
    },
    /* 根据系统触摸反馈配置，进行振动 */
    vibrateByConfig: function () {
        if (this.isTouchActive) { // 激活系统触摸反馈
        }
    },
    numberPressCheck() {
        this.ifNeedSpace();
        this.checkIfSecretCode(); // 暗码相关功能校验
        this.checkIfShow();
    },
    ifNeedSpace() {
        if (this.numText.length >= 6) {
            this.showAeraInfo = true;
        } else {
            this.showAeraInfo = false;
        }
        switch (this.numText.length) {
            case 3:
                if (this.checkNeedNumberSpace(this.numText)) {
                    this.numText = this.numText + ' ';
                }
                break;
            case 8:
                this.numText = this.numText + ' ';
                break;
            default:
                break;
        }
    },
    /* 校验当前号码串是否添加空格，存在特殊字符且不是+号开头的情况不添加空格 */
    checkNeedNumberSpace(numText) {
        let isSpace = /[\+;,#\*]/g;
        let isRule = /^\+.*/;
        if (isSpace.test(numText)) { // 号码字符串中包含特殊字符则不添加空格
            if (isRule.test(numText)) {
                return true;
            } else {
                return false;
            }
        }
        return true;
    },
    getMatchedList() {
        if (!this.numText.startsWith('1') && !this.numText.startsWith('0')
        && !this.numText.startsWith('*') && !this.numText.startsWith('#')
        && !this.numText.startsWith('+') && !this.numText.startsWith(',')
        && !this.numText.startsWith(';')) {
            var a = {
                2: 'abc',
                3: 'def',
                4: 'ghi',
                5: 'jkl',
                6: 'mno',
                7: 'pqr',
                8: 'stu',
                9: 'vwxyz'
            }
            var number = Utils.removeSpace(this.numText);
            let code = number.split('').map(ee => a[ee]);
            if (code.length == 1) {
                this.pinYinArr = code[0].split('');
            } else {
                this.pinYinArr = this.comb(code);
            }
        }
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        var searchText = Utils.removeSpace(this.numText);
        var data = {
            likeValue: searchText,
            pinYinArr: this.pinYinArr
        }
        searchContactModel.searchContacts(DAHelper, data, result => {
            var matchedList = [];
            var contactMap = new Map();
            var phoneNumberMap = new Map();
            if (result.code == 0 && !Utils.isEmptyList(result.data)) { // 存在联系人信息
                result.data.forEach(contactElement => {
                    if (!contactMap.has(contactElement.contactId) && !Utils.isEmptyList(contactElement.phoneNumbers)) { // 已经在列表内的和没有电话号码的联系人不显示
                        var matchedElement = {};
                        matchedElement.phone = contactElement.phoneNumbers[0].phoneNumber;
                        matchedElement.name = contactElement.emptyNameData;
                        for (var i = 0; i < contactElement.phoneNumbers.length; i++) {
                            var number = contactElement.phoneNumbers[i].phoneNumber;
                            if (Utils.removeSpace(number).indexOf(Utils.removeSpace(this.numText)) > -1) {
                                matchedElement.phone = number;
                                try {
                                    matchedElement.formatNumber = number; // await telephony.formatPhoneNumber(number);
                                } catch {
                                    matchedElement.formatNumber = number;
                                }
                                break;
                            }

                        }
                        matchedElement.callTag = ''; // TODO：此处后续需适配获取号码归属地接口
                        this.fillMatchedElementProperty(matchedElement);
                        matchedList.push(matchedElement);
                        contactMap.set(contactElement.contactId);
                        phoneNumberMap.set(contactElement.phone);
                    }
                });
            }
            if (this.numText.length >= 3) { // 只有号码数字大于3时，才搜索通话记录列表
                /* 联系人追加完后， 添加通话记录数据 */
                this.getMatchedCallLog(matchedList, contactMap, phoneNumberMap);
            } else {
                this.matchedRecordsList = matchedList;
                this.ifShowConfig.showContactsOperates = false;
                this.ifShowConfig.showMatchedList = true;
            }
            this.viewNumberTextProc();
            this.checkMoreMenuState();
        });
    },
    /* 获取通话记录列表 */
    getMatchedCallLog(matchedList, contactMap, phoneNumberMap) {
        this.matchedRecordsList = [];
        if (!Utils.isEmpty(this.$app.$def.globalData.callLogTotalData.callLogList)) {
            for (var i = 0; i < this.$app.$def.globalData.callLogTotalData.callLogList.length; i++) {
                var element = this.$app.$def.globalData.callLogTotalData.callLogList[i];
                if (!Utils.isEmpty(element.contactKey) && contactMap.has(element.contactKey)) { // 避免重复号码匹配
                    continue;
                }
                if (!Utils.isEmpty(element.phone) && phoneNumberMap.has(element.phone)) {
                    continue;
                }
                if (Utils.removeSpace(element.phone).indexOf(Utils.removeSpace(this.numText)) > -1) { // 电话号码匹配
                    this.fillMatchedElementProperty(element);
                    matchedList.push(element);
                    phoneNumberMap.set(element.phone);
                }
            }
        } else {
            LOG.info(TAG + 'getMatchedCallLog' + 'logMessage callLogList is empty!');
        }
        if (matchedList.length > 0) { // 存在匹配记录
            setTimeout(() => {
                this.matchedRecordsList = matchedList;
                this.ifShowConfig.showContactsOperates = false;
                this.ifShowConfig.showMatchedList = true;
            }, 0);
        } else { // 不存在匹配记录
            if (this.showDialer) {
                this.ifShowConfig.showContactsOperates = true;
            }
            this.ifShowConfig.showMatchedList = false;
        }

    },
    /* 完善匹配列表item项特有属性 */
    fillMatchedElementProperty(element) {
        var matchedString = Utils.getMatchedString(element.formatNumber, this.numText);
        if (!Utils.isEmpty(element.formatNumber)) {
            var startIndex = element.formatNumber.indexOf(matchedString);
            element.firstPart = element.formatNumber.substring(0, startIndex);
            element.matchedPart = element.formatNumber.substr(startIndex, matchedString.length);
            LOG.info(TAG + 'fillMatchedElementProperty' + 'logMessage element.matchedPart = '
            + ' startIndex = ' + startIndex);
            element.endPart = element.formatNumber.substr(startIndex + matchedString.length);
        } else {
            element.firstPart = element.phone;
            element.matchedPart = '';
            element.endPart = '';
        }
    },
    /* 拨号盘编辑框中输入数字时，获取匹配列表 */
    getMatchedRecordList() {
        var matchedList = [];
        if (!Utils.isEmpty(this.$app.$def.globalData.callLogTotalData.callLogList)) {
            this.$app.$def.globalData.callLogTotalData.callLogList.forEach((element) => {
                if (Utils.removeSpace(element.phone).indexOf(Utils.removeSpace(this.numText)) > -1) { // 电话号码匹配
                    this.fillMatchedElementProperty(element)
                    matchedList.push(element);
                }
            });
        } else {
            LOG.info(TAG + 'getMatchedRecordList' + 'logMessage callLogList is empty! callLogList = ');
        }
        if (matchedList.length > 0) { // 存在匹配记录
            this.matchedRecordsList = matchedList;
            this.ifShowConfig.showContactsOperates = false;
            this.ifShowConfig.showMatchedList = true;
        } else { // 不存在匹配记录
            if (this.showDialer) {
                this.ifShowConfig.showContactsOperates = true;
            }
            this.ifShowConfig.showMatchedList = false;
        }
    },
    /* 隐藏拨号盘 touchEnd*/
    hideDialer(e) {
        clearTimeout(this.hideDialerTimeOutId);
        var delay = 0;
        // 切换文本提示为长框
        LOG.info(TAG + 'hideDialer' + 'logMessage showDialer = ');
        if (this.$app.$def.dialerStateData.showDialer) {
            this.dialerAnimationProc(false); // 隐藏拨号盘
            this.$app.$def.dialerStateData.showDialer = false;
        }
        if (this.ifShowConfig.showAttentionInfo) {
            this.hideDialerTimeOutId = setTimeout(() => {
                this.dynamicStyle.numTextAttention = 'num-text-attention-all'
                this.$app.$def.dialerStateData.showDialer = false;
            }, delay);
        }
    },
    /* 拨号盘绿色大缩略图 */
    boardThunmbnailTouchStart() { // 点击时绿色背景圆缩小，白色圆点变大
        this.dynamicStyle.boardThumbnailButtonClass = 'board-thumbnail-button-onpress';
        this.dynamicStyle.boardThumbnailBoxClass = 'board-thumbnail-box-onpress';
        this.dynamicStyle.boardThumbnailIconClass = 'board-thumbnail-button-icon-onpress';

    },
    /* 显示拨号盘 */
    showNumBoard() {
        /* 按钮样式恢复 */
        this.dynamicStyle.boardThumbnailBoxClass = 'board-thumbnail-box';
        this.dynamicStyle.boardThumbnailIconClass = 'board-thumbnail-button-icon';
        this.dialerAnimationProc(true); // 显示拨号盘
        this.$app.$def.dialerStateData.showDialer = true;
        clearTimeout(this.showDialerTimeOutId);
        this.showDialerTimeOutId = setTimeout(() => {
            this.dynamicStyle.numTextAttention = 'num-text-attention'
        }, 300); // 切换提示文本组件样式为短框
        if (this.numText.length > 0) {
            this.showContactsOperates = true; // 显示联系人操作组件
        }
    },
    /* 设定拨号盘显示状态的基本参数 */
    dialerStateShow() {
        this.dialerMarginBottom = DIALER_MARGIN_BOTTOM_SHOW; // 拨号盘底部margin值设置为0
        this.bordButtonMarginRight = DIALER_BUTTON_MARGIN_HIDE; // 按钮隐藏状态的margin值
        this.thumbnailOpacity = DIALER_BUTTON_OPACITY_HIDE; // 内部白点隐藏状态透明度
        this.showBoardThumbnail = false; // 隐藏绿色缩略按钮
        this.showDialer = true; // 拨号盘显示状态置为true
        this.showDialButton = 'visible';
        this.$app.$def.dialerStateData.showDialer = true; // 全局拨号盘显示状态置为true
    },
    /* 设定拨号盘隐藏状态的基本参数 */
    dialerStateHide() {
        this.dialerMarginBottom = this.ifShowConfig.showContactsOperates ?
            DIALER_MARGIN_BOTTOM_OPTION_HIDE : DIALER_MARGIN_BOTTOM_HIDE;
        this.bordButtonMarginRight = DIALER_BUTTON_MARGIN_SHOW;
        this.thumbnailOpacity = DIALER_BUTTON_OPACITY_SHOW;
        this.showBoardThumbnail = true; // 显示绿色按钮
        this.showDialer = false;
        this.showDialButton = 'hidden';
        this.$app.$def.dialerStateData.showDialer = false;
    },
    /* 使用拨号盘呼出电话 */
    callOutByDialer(simIndex) {
        LOG.info(TAG + 'onInit' + 'logMessage this.numText:'  + 'this.simIndex:' + simIndex);
        this.callOut(this.numText, simIndex);
    },
    /* 使用通话记录呼出电话 */
    callOutByLog(e) {
        if (this.isSingleCard) { // 单卡模式则直接呼出
            this.callOut(e.detail.number, this.simMessage.defaultSimSlot);
        } else {
            // 双卡模式则转到呼叫编辑界面
            this.editNumberBefore(e.detail.number);
        }
    },
    /* 使用拨号搜索列表呼出电话 */
    callOutByMatchedList: function (index) {
        if (this.isSingleCard) { // 单卡模式则直接呼出
            this.callOut(this.matchedRecordsList[index].phone);
        } else { // 双卡模式则转到呼叫编辑界面
            this.editNumberBefore(this.matchedRecordsList[index].formatNumber)
        }
    },
    /* 单卡模式 */
    singleCardMode() {
        this.isSingleCard = true;
    },
    /* 双卡模式 */
    doubleCardMode() {
        this.isSingleCard = false;
    },
    getNumTextCursorPosition() {
        var numTextObj = this.$element('numTextId');
        var cursorPosition = -1;
        if (numTextObj.selectionStart) {
            cursorPosition = numTextObj.selectionStart;
        }
    },
    /* 关闭提示弹框 */
    cancelSchedule(e) {
        this.$element('simpledialog').close();
    },
    /* 显示匹配列表通话记录详情 */
    showRecordDetailsByMatchedList(index) {
        LOG.info(TAG + 'showRecordDetailsByMatchedList' + 'logMessage:index=' + index);
        this.$app.$def.dialerStateData.isNeedShowDialer = false;
        var newNumberContactDetail = this.matchedRecordsList[index];
        this.showDetails(newNumberContactDetail);
    },
    /* 显示具体通话记录细节 */
    showRecordDetailsByLog: function (e) {
        this.$app.$def.dialerStateData.isNeedShowDialer = false;
        var newNumberContactDetail = {};
        if (this.callLogIndex == 2) {
            newNumberContactDetail = this.voicemailList[e.detail.logIndex];
        } else if (this.callLogIndex == 1) {
            newNumberContactDetail = this.missedList[e.detail.logIndex];
        } else {
            newNumberContactDetail = this.recordList[e.detail.logIndex];
        }
        this.showDetails(newNumberContactDetail);
    },
    /* 跳转到详情页面函数 */
    showDetails(newNumberContactDetail) {
        LOG.info(TAG + 'showDetails' + ' newNumberContactDetail = ' + newNumberContactDetail);
        router.push({
            uri: 'pages/contacts/contactDetail/contactDetail',
            params: {
                sourceFromCallRecord: true,
                isNewNumber: true,
                phoneNumberShow: newNumberContactDetail.formatNumber,
                newNumberContactDetail: newNumberContactDetail
            }
        });
    },
    copyObj(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    /**
     * 获取联系人详细数据
     *
     * @param code 2005 FA与PA通行协议码
     * @param data  contactId 联系人ID
     */
    getContactDetailByPhoneNum: function (code, phoneNumberShow, newNumberContactDetail) {
        var requestData = {};
        requestData.phoneNumber = phoneNumberShow.replace(/\s+/g, '');
    },
    /* 获取SIM卡信息方法 */
    async getSimCardMessage() {
    },
    /* 获取系统触摸反馈配置 */
    getTouchActiveConfig: function () {
    },
    getCorrectMessage(simMessage) {
        switch (simMessage) {
            case 'CHINA MOBILE': // 移动
                return this.$t('phone.simMsgYiDong');
            case 'CHINA UNICOM': // 联通
                return this.$t('phone.simMsgLianTong');
            case 'CHINA TELECOM': // 电信
                return this.$t('phone.simMsgDianXin');
            default:
                return simMessage;
        }
    },
    /* 复制方法 */
    copy(data) {
        // 获取系统剪切板：
        var systemPasteBoard = pasteboard.getSystemPasteboard();
        // 将复制的内容封装为PasteData
        var pasteData = pasteboard.createPlainTextData(data);
        // 将复制的内容写入系统剪切板。
        systemPasteBoard.setPasteData(pasteData, (error, msg) => {
            if (error) {
                LOG.error('logMessage Failed to set PasteData. Cause: ');
                return;
            }
            // 成功复制后，将复制的数据存入storage，用于与后续的粘贴数据内容做比较，判断是否显示剪切板tip
            this.$app.$def.globalData.storage.putSync('clipboardTempKey', data);
            LOG.info(TAG + 'systemPasteBoard' + ' PasteData set successfully. data = ');
        });
    },

    /* 粘贴方法 */
    paste() {
        // 获取系统剪切板：
        var systemPasteBoard = pasteboard.getSystemPasteboard();
        systemPasteBoard.getPasteData((error, pasteData) => {
            if (error) {
                LOG.error('logMessage Failed to obtain PasteData. Cause: ');
                return;
            }
            var text = pasteData.getPrimaryText(); // 获取剪切板的内容。
            LOG.info(TAG + 'paste' + 'logMessage paste text = ');
            var numTemp = Utils.getNumberString(text); // 将原始数据处理为拨号盘合法字符串。
            this.editNumberBefore(numTemp);
        });
    },
    /* 新建联系人 */
    addContacts(number) {
        var phoneNumber = number.replace(/[^0123456789+]*/g, ''); // 去除所有空格及非数字或+号的字符
        var show = false;
        if (phoneNumber.length > 0) {
            show = true;
        }
        this.$app.$def.dialerStateData.isNeedShowDialer = false;
        router.push({
            uri: 'pages/contacts/accountants/accountants',
            params: {
                phoneNumbers: [
                    {
                        'labelId': 2,
                        'labelName': this.$t('accountants.phone'),
                        'phoneNumber': phoneNumber,
                        'phoneAddress': 'N',
                        'showP': show,
                        'blueStyle': true
                    }
                ]
            },
        });
    },

    /* 格式化电话号码 */
    async formatPhoneNumber(number) {
    },

    /* 电话呼出接口 */
    callOut(phoneNumber, simIndex) {
        this.$app.$def.dialerStateData.isCallState = true;
        /* simIndex：0：卡一或默认卡拨号，1：卡二拨号，-1：通话记录拨号 */
        var dailNumber = '';
        if (phoneNumber.length == 0 && this.recordList.length > 0) { // 未输入电话号码时，默认拨出通话记录第一条
            dailNumber = this.recordList[0].phone;
        } else if (phoneNumber.length > 0) {
            dailNumber = phoneNumber; // 传入需要格式化的电话号码。
        }
        this.$app.$def.call(dailNumber);
        this.numText = '';
        this.checkIfShow();
    },
    requestLogByPage() {
        this.pageInfo.pageIndex++;
        LOG.info(TAG + 'requestLogByPage' + ' onRequestItem index=' + this.pageInfo.pageIndex);
        this.$emit('getLogPage', {
            pageIndex: this.pageInfo.pageIndex,
            logIndex: ALL_CALLS_INDEX
        });
    },
    requestMissedCallsByPage() {
        this.pageInfo.pageIndexMissedCalls++;
        this.$emit('getLogPage', {
            pageIndex: this.pageInfo.pageIndexMissedCalls,
            logIndex: MISSED_CALLS_INDEX
        });
    },
    /* 更多菜单项显示校验 */
    checkMoreMenuState() {
        if (this.recordList.length > 0 && this.callLogIndex == ALL_CALLS_INDEX) {
            this.optionMenu.batchDeleteDisabled = false;
        } else if (this.missedList.length > 0 && this.callLogIndex == MISSED_CALLS_INDEX) {
            this.optionMenu.batchDeleteDisabled = false;
        } else if (this.voicemailList.length > 0 && this.callLogIndex == VOICE_MAIL_INDEX) {
            this.optionMenu.batchDeleteDisabled = false;
        }
        else {
            this.optionMenu.batchDeleteDisabled = true;
        }
    },
    /* 修改通话记录tag下标 */
    changeCallLogIndex(e) {
        this.callLogIndex = e.detail.logIndex;
        LOG.info(TAG + 'changeCallLogIndex' + ' changeCallLogIndex this.callLogIndex = ' + this.callLogIndex);
        this.resetItemState();
        this.checkMoreMenuState();
    },
    /* sim卡信息适配函数 */
    getSimMessage: function (simCardState, simCardMessage) {
        if (Utils.isEmpty(simCardMessage)) { // 不存在运营商信息则判断
            switch (parseInt(simCardState)) {
                case 0: // 未获取到sim信息
                case 1: // 卡槽无卡
                    return this.$t('phone.notInService'); // 无服务
                case 2: // sim卡锁定状态
                case 3: // sim卡在卡槽但未准备好提供服务
                    return this.$t('phone.emergencyCall'); // 仅限紧急呼叫
                case 4:
                case 5: // 正常服务
                    return this.getCorrectMessage(simCardMessage);
                default:
                    break;
            }
        }
        return this.getCorrectMessage(simCardMessage);
    },
    /* 拨号页面更多菜单选项事件 */
    onMoreMenuSelected(e) {
        this.$app.$def.dialerStateData.isNeedShowDialer = false;
        switch (parseInt(e.value)) {
            case 0: // 粘贴
                this.paste();
                break;
            case 1: // 批量删除
                this.$emit('batchDelete', {});
                var tempList = [];
                if (this.callLogIndex == VOICE_MAIL_INDEX) {
                    tempList = this.$app.$def.globalData.voicemailTotalData.voicemailList;
                } else if (this.callLogIndex == MISSED_CALLS_INDEX) {
                    tempList = this.$app.$def.globalData.callLogTotalData.missedList;
                } else {
                    tempList = this.$app.$def.globalData.callLogTotalData.callLogList;
                }
                router.push({
                    uri: 'pages/dialer/calllogdelete/calllogdelete',
                    params: {
                        batchDelete: 1,
                        logIndex: this.callLogIndex,
                        callLogList: tempList,
                        singleCardMode: this.isSingleCard,
                    }
                });
                break;
            case 2:
                break;
            case 3: // 设置(暂时跳转到快速拨号设置页面)
                router.push({
                    uri: 'pages/dialer/speeddial/speeddial'
                });
                break;
            case 4: // 设置(跳转至关于页)
                router.push({
                    uri: 'pages/contacts/settings/about/about',
                    params: {}
                })
                break;
            case 5: // TODO:当前为方便跳转批量选择联系人界面临时添加，后续删除
                router.push({
                    uri: 'pages/contacts/batchselectcontacts/batchselectcontacts',
                    params: {
                        selectType: 0,
                    }
                })
                break;
            case 6: // TODO:当前为方便测试临时添加，后续根据实际情况适配
                this.callLogSettings();
                break;
            case 7:
                router.push({
                    uri: 'pages/dialer/greeting/greeting'
                });
                break;
            case 8:
                router.push({
                    uri: 'pages/index_demo/index'
                });
                break;
            default:
                break;
        }
    },
    callLogSettings: function () {
        this.getCallLogMergeRule();
    },
    closeCallLogDialog: function () {
        this.$element('logSettingDialog').close();
    },
    /* 页面最终组件显示校验 */
    checkIfShow() {
        /* 电话号码长度大于0时组件显示及隐藏情况 */
        if (this.numText.trim().length > 0) {
            this.ifShowConfig.showPhoneTitle = false;
            this.ifShowConfig.showAttentionInfo = false;
            this.ifShowConfig.showNumTextAera = true;
            this.ifShowConfig.showCallRecords = false;
            this.deleteButtonDisabled = false;
            this.dialButtonDisabled = false;
            if (this.numText.trim().length < 3) {
                if (this.showDialer) {
                    this.ifShowConfig.showContactsOperates = true;
                    this.clipboardData.bottomDst = BOTTOM_MENU_HEIGHT + DIALER_ANIMATION_DISTANCE_OPTION;
                }
                this.ifShowConfig.showMatchedList = false;
                if (!this.numText.startsWith('1')) {
                    this.getMatchedList();
                }
            } else {
                this.getMatchedList()
            }
            /* 号码编辑区域可视号码处理 */
            this.viewNumberTextProc();
        } else {
            /* 电话号码长度为0的情况 */
            this.numTextPaddingLeft = DEFAULT_INT_VALUE; // 重置偏移量为初始值
            this.numTextSize = NUM_TEXT_FONT_SIZE_MAX; // 重置字体大小为初始值
            this.ifShowConfig.showNumTextAera = false;
            this.dynamicStyle.numTextAttention = 'num-text-attention'; // 切换提示文本组件样式为短框
            this.deleteButtonDisabled = true;
            this.ifShowConfig.showPhoneTitle = true;
            this.ifShowConfig.showMatchedList = false;
            this.ifShowConfig.showContactsOperates = false;
            this.clipboardData.bottomDst = BOTTOM_MENU_HEIGHT + DIALER_ANIMATION_DISTANCE_DEFAULT;
            if (this.recordList.length > 0) { // 存在通话记录或语音信箱
                this.ifShowConfig.showAttentionInfo = false;
                this.ifShowConfig.showCallRecords = true;
                this.dialButtonDisabled = false;
                if (this.isFirstInit) { // 当通话记录初次大于0时，将提示信息存入storage，并设置初始属性为false
                    this.isFirstInit = false;
                    this.$app.$def.globalData.storage.putSync('showAttention', false);
                    this.$app.$def.globalData.storage.flushSync();
                }
            } else if (this.voicemailList.length > 0) {
                this.ifShowConfig.showAttentionInfo = false;
                this.ifShowConfig.showCallRecords = true;
                this.dialButtonDisabled = true;
            } else { // 不存在通话记录
                this.dialButtonDisabled = true;
                if (!this.isFirstInit) {
                    this.ifShowConfig.showAttentionInfo = false;
                    this.ifShowConfig.showCallRecords = true;
                } else {
                    this.ifShowConfig.showCallRecords = false;
                    this.ifShowConfig.showAttentionInfo = true;
                }
            }

        }
        /* 更多菜单显示项 */
        this.checkMoreMenuState();
    },
    /* 暗码校验，如果是暗码，则显示暗码信息 */
    checkIfSecretCode: function () {
        switch (Utils.removeSpace(this.numText)) {
            case SECRETE_CODE_1:
                this.numText = '';
                this.secretCode1Proc(); // 手机信息弹窗处理
                break;
            case SECRETE_CODE_2:
            // TODO: 适配跳转到关于手机界面
                this.numText = '';
                break;
            case SECRETE_CODE_3:
            // TODO: 适配跳转到工程菜单
                this.numText = '';
                break;
            default:
                break;
        }
    },
    secretCode1Proc: async function () {
        var meIdString = '';
        var pesnString = '';
        var imei1String = '';
        var imei2String = '';
        var snString = '';
        try {
            // TODO: 需后续适配获取meID接口
        } catch {
            LOG.info(TAG + 'secretCode1Proc' + 'logMessage get meid error');
        }
        this.secreteCodeMessage.meid = meIdString;
        try {
            // TODO: 需后续适配获取pesn接口
        } catch {
            LOG.info(TAG + 'secretCode1Proc' + 'logMessage get pesn error');
        }
        this.secreteCodeMessage.pesn = pesnString;
        try {
            imei1String = await radio.getIMEI(0);
        } catch {
            LOG.info(TAG + 'secretCode1Proc' + 'logMessage get imei1 error');
        }
        this.secreteCodeMessage.imei1 = imei1String;
        try {
            imei2String = await radio.getIMEI(1);
        } catch {
            LOG.info(TAG + 'secretCode1Proc' + 'logMessage get imei2 error');
        }
        this.secreteCodeMessage.imei2 = imei2String;
        try {
            // TODO:需后续适配获取sn码接口
        } catch {
            LOG.info(TAG + 'secretCode1Proc' + 'logMessage get sn error');
        }
        this.secreteCodeMessage.pesn = pesnString;
        this.$element('codeDialog').show(); // 显示暗码弹框
    },
    /* 关闭暗码弹窗 */
    closeCodeDialog: function () {
        this.$element('codeDialog').close();
    },
    clickOut: function () {
        this.$element('codeDialog').focus();
    },
    /* 号码编辑框可视号码处理函数, 当拨号盘界面有电话号码时，是界面渲染的最后一步 */
    viewNumberTextProc() {
        var numStringNoSpace = Utils.removeSpace(this.numText);
        this.viewText = numStringNoSpace.length > NUM_TEXT_MAX_LENGTH ?
            numStringNoSpace.substr(numStringNoSpace.length - NUM_TEXT_MAX_LENGTH) : this.numText;
        var spaceCount = 0; // 字符串中包含的空格数
        if (/[\s]/g.test(this.viewText)) {
            spaceCount = this.viewText.match(/[\s]/g).length;
        }
        if (this.viewText.trim().length > NUM_TEXT_MAXSIZE_LENGTH) { // 最大字体情况下，最多容纳16位数字，超过16位数字时，font-size随viewText的长度作适当改变
            this.viewText = Utils.removeSpace(this.viewText);
            if (this.viewText.trim().length <= NUM_TEXT_MAXSIZE_LENGTH) { // 防止长度为16位时，删除空格后导致左内边距偏移错误
                this.numTextPaddingLeft = NUM_TEXT_PADDING_LEFT_MAX - NUM_TEXT_OFFSET_UNIT * this.viewText.trim().length;
            } else {
                this.numTextSize = NUM_TEXT_FONT_SIZE_MAX * NUM_TEXT_MAXSIZE_LENGTH / (this.viewText.trim().length); // 可视号码在16-25位时，适配font-size
            }
        } else { // 数字在16位以下时，padding-left长度适应居中，每个数字缩短20px(逻辑像素)的内边距偏移,若存在空格，则偏移10px
            this.numTextPaddingLeft = NUM_TEXT_PADDING_LEFT_MAX - NUM_TEXT_OFFSET_UNIT * this.viewText.trim().length
            + spaceCount * NUM_TEXT_SPACE_OFFSET_UNIT;
        }
    },
    /* 由通话记录到呼叫前编辑 */
    editNumberBeforeByLog(e) {
        this.editNumberBefore(e.detail.number);
    },
    /* 呼叫前编辑 */
    editNumberBefore(number) {
        this.numText = number;
        this.showNumBoard()
        /* 刷新页面状态 */
        this.checkIfShow();
    },
    /* 号码复制 */
    copyNumber(e) {
        LOG.info(TAG + 'copyNumber' + 'logMessage copy Number 1');
        var number = '';
        /* 所有非数字及+号的字符替换为空字符串 */
        number = e.detail.number.replace(/[^0123456789+;,#*-]*/g, '');
        this.copy(number);
    },
    /* 通过点击提示文本的方式粘贴号码到号码编辑框 */
    pasteNumber() { // 粘贴号码并隐藏剪切板
        this.paste();
        this.$emit('hideTips', {});
    },
    /* 删除单条记录 */
    removeCall(e) {
        /* 此处为了使界面删除操作展示流畅，先在界面处理，不必等待后台结果返回 */
        var tempList = [];
        var missedTempList = [];
        var voicemailTempList = [];
        for (let i = 0; i < this.recordList.length; i++) {
            if (this.recordList[i].ids != e.detail.id) {
                tempList.push(this.recordList[i]);
            }
        }
        for (let j = 0; j < this.missedList.length; j++) {
            if (this.missedList[j].ids != e.detail.id) {
                missedTempList.push(this.missedList[j]);
            }
        }
        for (let k = 0; k < this.voicemailList.length; k++) {
            if (this.voicemailList[k].ids != e.detail.id) {
                voicemailTempList.push(this.voicemailList[k]);
            }
        }
        this.$emit('updateLogList', {
            recordList: tempList,
            missedList: missedTempList,
            voicemailList: voicemailTempList
        });
        if (this.callLogIndex == 2) { // 从语音信箱删除
            var DAHelper = this.$app.$def.getDAHelper(Constants.uri.VOICEMAIL_DB_URI);
            callLogService.deleteVoicemailByIds(DAHelper, e.detail.id, () => {
                this.refreshVoicemailList();
            })
        } else { // 从通话记录删除
            var mergeRule = this.$app.$def.globalData.storage.getSync('call_log_merge_rule', 'from_time');
            var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CALLLOG_DB_URI);
            if (mergeRule == 'from_contact') {
                callLogService.deleteCallLogByNumbersOrContacts(DAHelper, e.detail.phoneNumber, e.detail.contactKey, () => {
                    this.refreshCallLogData();
                });
            } else {
                callLogService.deleteCallLogByIds(DAHelper, e.detail.id, () => {
                    this.refreshCallLogData();
                });
            }
        }
    },
    /* 拨号盘界面刷新通话记录数据 */
    refreshCallLogData() {
        var mergeRule = this.$app.$def.globalData.storage.getSync('call_log_merge_rule', 'from_time');
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CALLLOG_DB_URI);
        callLogService.getAllCalls(DAHelper, mergeRule, data => {
            this.$app.$def.globalData.callLogTotalData = data;
            this.checkIfShow();
        });
    },
    /* 拨号盘界面刷新通话记录数据 */
    refreshVoicemailList() {
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.VOICEMAIL_DB_URI);
        callLogService.getVoicemailList(DAHelper, (voicemailList) => {
            this.$app.$def.globalData.voicemailTotalData.voicemailList = voicemailList;
            this.$app.$def.globalData.voicemailTotalData.voicemailCount = voicemailList.length;
        });
    },
    /* 点击剪切板区域以外的地方时，隐藏剪切板 */
    hideClipBoard(e) {
        this.$emit('hideTips', {});
    },
    speedCall: function (keyValue) {
        if (keyValue == 1) { // 语音信箱
            var value = this.$app.$def.globalData.voicemailNumber;
            if (value !== '') {
                this.$app.$def.call(value);
            } else {
                if (this.simMessage.simCount == 0) {
                    this.$element('NotvoicemalDialog').show();
                } else {
                    var simIndex = 0;
                    if (this.simMessage.sim2State > 3) {
                        simIndex = 1;
                    }
                    this.goToVoicemailSettings(simIndex);
                }
            }
        } else {
            this.speedIndex = keyValue - 1; // 快速拨号列表下标比键值小1
            var speedItemString = this.$app.$def.globalData.storage.getSync('speedDial' + this.speedIndex, '');
            if (!Utils.isEmpty(speedItemString)) { // 已设置快速拨号时，直接拨打电话
                this.callOut(JSON.parse(speedItemString).speedNumber);
            } else { // 不存在快速拨号时，弹出是否设置快速拨号弹框
                this.$element('simpledialog').show();
            }
        }
    },

    cancelNotVoicemailDialog: function () {
        this.$element('NotvoicemalDialog').close();
    },

    cancelVoicemailDialog: function () {
        this.$element('voicemailDialog').close();
    },
    goToVoicemailSettings(simIndex) {
        var voicemailNumber = this.$app.$def.globalData.storage.getSync('voicemailNumber', '');
        if (Utils.isEmpty(voicemailNumber)) {
            if (simIndex == 0) {
                voicemailNumber = this.simMessage.voicemailNumberSim1;
            } else {
                voicemailNumber = this.simMessage.voicemailNumberSim2;
            }
        }
        /* 跳转至语音信箱设置 */
        router.push({
            uri: 'pages/dialer/voicemailsettings/voicemailsettings',
            params: {
                voiceMailNumber: voicemailNumber
            }
        });
    },
    setSchedule: function () {
        if (this.speedIndex > 0) {
            this.$element('simpledialog').close();
            // 点击跳转至选择联系人界面
            router.push({
                uri: 'pages/dialer/speeddial/selectcontact/selectcontact',
                params: {
                    type: 'saveSpeedDial',
                    speedDialIndex: this.speedIndex,
                }
            });
        }
    },
    /* 长按显示单条记录菜单项 */
    showMatchedListMenu(index) {
        LOG.info(TAG + 'showMatchedListMenu...: ' + this.matchedRecordsList[index]);
        this.matchedMenuData.index = index;
        this.matchedMenuData.itemId = this.matchedRecordsList[index].ids;
        this.matchedMenuData.name = this.matchedRecordsList[index].name;
        this.matchedMenuData.number = this.matchedRecordsList[index].formatNumber;
        var tempX = this.dialerTouchData.touchStartX;
        var tempY = this.dialerTouchData.touchStartY;

        /* 控制菜单在屏幕的左右及上下的出现位置，数字代表的为逻辑像素px */
        if (this.dialerTouchData.touchStartX > 360) {
            tempX = 360;
        }
        clearTimeout(this.matchedMenuData.showMatchedMenuTimeOutId);
        /* 此处需要异步延时显示菜单，否则值刷新不过来 */
        this.matchedMenuData.showMatchedMenuTimeOutId = setTimeout(() => {
            this.vibrateByConfig(); // 弹出菜单时，若触摸反馈开启，则需振动一下
            this.$element('matchedListMenu').show({
                x: tempX,
                y: tempY
            });
        }, 100);
        LOG.info(TAG + 'showMatchedListMenu' + 'logMessage showMatchedListMenu!');
    },
    saveToContacts(numText) {
        this.$app.$def.dialerStateData.isNeedShowDialer = false;
        router.push({
            uri: 'pages/contacts/selectContactsList/selectContactsList',
            params: {
                type: 'saveContacts',
                number: numText,
            }
        });
    },
    /* 拨号搜索长按菜单 */
    onMatchedListSelected(e) {
        switch (parseInt(e.value)) {
            case 1: // 新建联系人this.onMatchedListSelected.number,
                this.addContacts(this.matchedMenuData.number);
                break;
            case 2: // 保存至已有联系人
                this.saveToContacts(this.matchedMenuData.number);
                break;
            case 3: // 发送信息
                this.sendMessage(this.matchedMenuData.number, this.matchedMenuData.name);
                break;
            case 4: // 呼叫前编辑
                this.editNumberBefore(this.matchedMenuData.number);
                break;
            case 5: // 加入黑名单
                break;
            default:
                break;
        }
    },
    /**
      * 参数说明：
      * 截取字符串的前五个字符外加.. 例如：'哈哈哈哈哈哈哈哈' => '哈哈哈哈哈..'
      * @param str 对象字符串
      * 返回值： 处理结果字符串
      */
    subStringWithEllipsis(str) {
        let len = 7;
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
        return newStr;
    },
    touchStartMatchedItem: function () {
    },
    phoneNumberIndexOf: function (phoneNumbers, phoneNumber) {
        var indexOf = -1;
        for (var i = 0; i < phoneNumbers.length; i++) {
            if (phoneNumber == phoneNumbers[i].phoneNumber) {
                indexOf = i;
                break;
            }
        }
        return indexOf;
    },
    /* 拨号盘动画核心函数: 参数show=true时表示显示拨号盘，false时隐藏拨号盘 */
    dialerAnimationProc(show) {
        if (show) {
            setTimeout(() => {
                this.showBoardThumbnail = false;
            }, 500);
            this.dialerStyle = 'dialer-display';
            this.boardThumbnailStyle = 'board-thumbnail-button-hide';
        } else {
            this.showBoardThumbnail = true;
            this.dialerStyle = 'dialer-hide';
            this.boardThumbnailStyle = 'board-thumbnail-button-display';
        }
    },
    /* 通话记录列表左滑功能，此处touchStartItem、touchMoveItem、touchEndItem共同完成一次完整的列表触摸滑动事件 */
    touchStartItem(e) {
        LOG.info(TAG + 'touchStartItem' + 'logMessage touchStartItem !!!!!');
        this.callLogTouchData.touchStartX = e.detail.positionX;
        this.callLogTouchData.touchStartY = e.detail.positionY;
        var firstLeftDst = 0;
        if (this.callLogIndex == VOICE_MAIL_INDEX) {
            firstLeftDst = this.voicemailList[e.detail.index].leftDst;
        } else if (this.callLogIndex == MISSED_CALLS_INDEX) {
            firstLeftDst = this.missedList[e.detail.index].leftDst;
        } else {
            firstLeftDst = this.recordList[e.detail.index].leftDst;
        }
        this.callLogTouchData.firstLeftDst = firstLeftDst;
        this.callLogTouchData.currentIndex = e.detail.index; // 记录当前列表index，防止touchEnd时，已移动到其他item的情况导致错误
        LOG.info(TAG + 'touchStartItem' + 'logMessage firstLeftDst = ');
        if (this.callLogTouchData.leftItemIndex != null && this.callLogTouchData.leftItemIndex
        != this.callLogTouchData.currentIndex) { // 当前滑动的是另一个item
            if (this.callLogIndex == VOICE_MAIL_INDEX) {
                this.voicemailList[this.callLogTouchData.leftItemIndex].leftDst = 0;
            } else if (this.callLogIndex == MISSED_CALLS_INDEX) {
                this.missedList[this.callLogTouchData.leftItemIndex].leftDst = 0;
            } else {
                this.recordList[this.callLogTouchData.leftItemIndex].leftDst = 0;
            }
            this.callLogTouchData.leftItemIndex = null; // 已被左滑的item 标记置空
        }
    },
    touchMoveItem(e) {
        var offsetX = e.detail.positionX - this.callLogTouchData.touchStartX;
        var offsetY = e.detail.positionY - this.callLogTouchData.touchStartY;
        if (Math.abs(offsetX) > Math.abs(offsetY) && Math.abs(offsetX) < LOG_ITEM_ANIMATION_MAX_DISTANCE) { // 横向偏移大于竖向偏移时，才会触发左滑
            this.setItemMoveState(offsetX); // 根据横向偏移offsetX设置item左滑move状态
        }
    },
    /* 单条通话记录触摸结束事件，主要用来确定是否需要显示左滑状态 */
    touchEndItem(e) {
        var offsetX = e.detail.positionX - this.callLogTouchData.touchStartX;
        var offsetY = e.detail.positionY - this.callLogTouchData.touchStartY;
        if (Math.abs(offsetX) > Math.abs(offsetY) && Math.abs(offsetX) >= 50) { // 左滑或右滑距离大于50px，且大于纵向滑动距离
            this.setItemEndState(offsetX); // 根据横向偏移offsetX设置item左滑最终状态
        } else if (Math.abs(offsetX) > Math.abs(offsetY) && Math.abs(offsetX) < 50) { // 左滑或右滑距离小于50px,则值不做改动
            if (this.callLogIndex == VOICE_MAIL_INDEX) {
                this.voicemailList[this.callLogTouchData.currentIndex].leftDst = this.callLogTouchData.firstLeftDst
            } else if (this.callLogIndex == MISSED_CALLS_INDEX) {
                this.missedList[this.callLogTouchData.currentIndex].leftDst = this.callLogTouchData.firstLeftDst
            } else {
                this.recordList[this.callLogTouchData.currentIndex].leftDst = this.callLogTouchData.firstLeftDst;
            }
        }
    },
    /* 设置list-item 左滑移动状态 */
    setItemMoveState(offsetX) {
        if (this.callLogIndex == VOICE_MAIL_INDEX) { // 语音信箱列表
            if (offsetX < 0) { // 左滑
                this.voicemailList[this.callLogTouchData.currentIndex].leftDst =
                    this.callLogTouchData.firstLeftDst == LOG_ITEM_ANIMATION_INIT_DISTANCE ?
                    offsetX : this.callLogTouchData.firstLeftDst;
            } else { // 右滑
                this.voicemailList[this.callLogTouchData.currentIndex].leftDst =
                    this.callLogTouchData.firstLeftDst == LOG_ITEM_ANIMATION_INIT_DISTANCE ?
                    0 : this.callLogTouchData.firstLeftDst + offsetX;
            }
        } else if (this.callLogIndex == MISSED_CALLS_INDEX) { // 未接来电列表
            if (offsetX < 0) { // 左滑
                this.missedList[this.callLogTouchData.currentIndex].leftDst =
                    this.callLogTouchData.firstLeftDst == LOG_ITEM_ANIMATION_INIT_DISTANCE ?
                    offsetX : this.callLogTouchData.firstLeftDst;
            } else { // 右滑
                this.missedList[this.callLogTouchData.currentIndex].leftDst =
                    this.callLogTouchData.firstLeftDst == LOG_ITEM_ANIMATION_INIT_DISTANCE ?
                    0 : this.callLogTouchData.firstLeftDst + offsetX;
            }
        } else if (offsetX < 0) { // 左滑
            this.recordList[this.callLogTouchData.currentIndex].leftDst =
                this.callLogTouchData.firstLeftDst == LOG_ITEM_ANIMATION_INIT_DISTANCE ?
                offsetX : this.callLogTouchData.firstLeftDst;
        } else { // 右滑
            this.recordList[this.callLogTouchData.currentIndex].leftDst =
                this.callLogTouchData.firstLeftDst == LOG_ITEM_ANIMATION_INIT_DISTANCE ?
                0 : this.callLogTouchData.firstLeftDst + offsetX;
        }
    },
    /* 设置list-item 左滑后最终状态 */
    setItemEndState(offsetX) {
        if (offsetX < 0) { // 左滑
            if (this.callLogTouchData.firstLeftDst == LOG_ITEM_ANIMATION_INIT_DISTANCE) { // 初始为未滑动状态
                if (this.callLogIndex == VOICE_MAIL_INDEX) {
                    this.voicemailList[this.callLogTouchData.currentIndex].leftDst = -LOG_ITEM_ANIMATION_MAX_DISTANCE;
                } else if (this.callLogIndex == MISSED_CALLS_INDEX) {
                    this.missedList[this.callLogTouchData.currentIndex].leftDst = -LOG_ITEM_ANIMATION_MAX_DISTANCE;
                } else {
                    this.recordList[this.callLogTouchData.currentIndex].leftDst = -LOG_ITEM_ANIMATION_MAX_DISTANCE;
                }
            }
            this.callLogTouchData.leftItemIndex = this.callLogTouchData.currentIndex; // 刷新已左滑item的index
            this.callLogTouchData.firstLeftDst = LOG_ITEM_ANIMATION_MAX_DISTANCE;
        } else { // 右滑
            if (this.callLogTouchData.firstLeftDst != LOG_ITEM_ANIMATION_INIT_DISTANCE) {
                if (this.callLogIndex == VOICE_MAIL_INDEX) {
                    this.voicemailList[this.callLogTouchData.currentIndex].leftDst = LOG_ITEM_ANIMATION_INIT_DISTANCE;
                } else if (this.callLogIndex == MISSED_CALLS_INDEX) {
                    this.missedList[this.callLogTouchData.currentIndex].leftDst = LOG_ITEM_ANIMATION_INIT_DISTANCE;
                } else {
                    this.recordList[this.callLogTouchData.currentIndex].leftDst = LOG_ITEM_ANIMATION_INIT_DISTANCE;
                }
            }
            this.callLogTouchData.leftItemIndex = null; // 置空已左滑的item下标
            this.callLogTouchData.firstLeftDst = LOG_ITEM_ANIMATION_INIT_DISTANCE;
        }
    },
    /* 重置记录列表左滑状态为初始状态 */
    resetItemState() {
        /* 若原列表存在左滑项则回置 */
        if (this.callLogTouchData.leftItemIndex != null) {
            if (this.callLogIndex == VOICE_MAIL_INDEX) { // 语音信箱
                this.voicemailList[this.callLogTouchData.leftItemIndex].leftDst = LOG_ITEM_ANIMATION_INIT_DISTANCE;
            } else if (this.callLogIndex == MISSED_CALLS_INDEX) { // 未接来电
                this.missedList[this.callLogTouchData.leftItemIndex].leftDst = LOG_ITEM_ANIMATION_INIT_DISTANCE;
            } else { // 通话记录
                this.recordList[this.callLogTouchData.leftItemIndex].leftDst = LOG_ITEM_ANIMATION_INIT_DISTANCE
            }
            this.callLogTouchData.leftItemIndex = null;
            this.callLogTouchData.firstLeftDst = LOG_ITEM_ANIMATION_INIT_DISTANCE;
        }
    },
    /* 左滑删除单条通话记录 */
    deleteSingleLog: function (e) {
        LOG.info(TAG + 'deleteSingleLog' + 'logMessage deleteSingleLog  e = ' + JSON.stringify(e))
        this.callLogTouchData.leftItemIndex = null;
        this.callLogTouchData.firstLeftDst = LOG_ITEM_ANIMATION_INIT_DISTANCE;
        this.removeCall(e);
    },
    checkMergeRule: function (type) {
        this.setCallLogMergeRule(type);
        this.pageInfo.pageIndex = 0;
        this.$emit('refreshCallLog', {});
        this.closeCallLogDialog();
    },
    /* 存储通话记录合并类型 */
    setCallLogMergeRule(merge_rule) {
        this.callLogMergeRule = merge_rule;
        this.$app.$def.globalData.storage.putSync('call_log_merge_rule', merge_rule);
        this.$app.$def.globalData.storage.flushSync();
    },
    /* 获取通话记录合并类型 */
    getCallLogMergeRule() {
        var mergeRule = this.$app.$def.globalData.storage.getSync('call_log_merge_rule', 'from_time');
        this.callLogMergeRule = mergeRule;
        this.$element('logSettingDialog').show();
    },
    /* 初始化sim卡相关数据 */
    async initSimCardMessage() {
        var hasCard1 = false;
        try {
            hasCard1 = await sim.hasSimCard(0);
        } catch {
            LOG.info(TAG + 'initSimCardMessage' + 'check sim1 error!');
        }
        if (hasCard1) { // 存在卡1的情况下，获取卡一状态及运营商信息
            try {
                this.simMessage.sim1State = await sim.getSimState(0);
                var simSpn1 = await radio.getNetworkState(0);
                var spnMsg1 = Utils.isEmpty(simSpn1.longOperatorName) ? '' : simSpn1.longOperatorName.toUpperCase();
                if ('CHINA MOBILE' == spnMsg1) { // 只有移动卡才会激活语音信箱
                    this.showVoiceMail = true;
                }
                this.simMessage.sim1SpnMessage = this.getSimMessage(this.simMessage.sim1State, spnMsg1);
                this.simMessage.voicemailNumberSim1 = await sim.getVoiceMailNumber(0)
                this.simMessage.telephoneNumberSim1 = await sim.getSimTelephoneNumber(0)
            } catch {
                this.simMessage.sim1State = 0;
                this.simMessage.sim1SpnMessage = '';
                this.simMessage.voicemailNumberSim1 = '';
                this.simMessage.telephoneNumberSim1 = '';
                LOG.error('logMessage get sim1 message has error!');
            }
        }
        var hasCard2 = false
        try {
            hasCard2 = await sim.hasSimCard(1);
        } catch {
            LOG.info(TAG + 'initSimCardMessage' + 'check sim2 error!');
        }
        if (hasCard2) { // 存在卡2情况下，获取卡2的状态及运营商信息
            try {
                this.simMessage.sim2State = await sim.getSimState(1);
                var simSpn2 = await radio.getNetworkState(1);
                var spnMsg2 = Utils.isEmpty(simSpn2.longOperatorName) ? '' : simSpn2.longOperatorName.toUpperCase();
                if ('CHINA MOBILE' == spnMsg2) { // 只有移动卡才会激活语音信箱
                    this.showVoiceMail = true;
                }
                this.simMessage.sim2SpnMessage = this.getSimMessage(this.simMessage.sim2State, spnMsg2);
                this.simMessage.voicemailNumberSim2 = await sim.getVoiceMailNumber(1);
                this.simMessage.telephoneNumberSim2 = await sim.getSimTelephoneNumber(1);
            } catch {
                this.simMessage.sim2State = 0;
                this.simMessage.sim2SpnMessage = '';
                this.simMessage.voicemailNumberSim2 = '';
                this.simMessage.telephoneNumberSim2 = '';
                LOG.error('logMessage get sim2 message has error!!');
            }
        }
        try {
            this.simMessage.defaultSimSlot = await sim.getDefaultVoiceSlotId(); // 获取默认卡槽，单卡拨号时，使用默认卡槽拨出
        } catch {
            this.simMessage.defaultSimSlot = 0;
            LOG.error('get default sim slot error!');
        }
        if (hasCard1 && hasCard2) { // 两个卡槽都有卡
            this.simMessage.simCount = 2;
            this.doubleCardMode();
        } else if (hasCard1 || hasCard2) {
            this.simMessage.simCount = 1;
            this.singleCardMode();
        } else {
            this.simMessage.simCount = 0;
            LOG.info(TAG + 'initSimCardMessage' + 'no sim card!');
        }
    }
}
