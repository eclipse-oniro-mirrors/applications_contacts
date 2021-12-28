/**
 * @file: 通话记录
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
import LOG from '../../utils/ContactsLog.js';

var TAG = 'callLog';

export default {
    props: ['allCalls', 'batchDelete', 'missedCallLogs', 'voicemailList', 'singleCardMode', 'showVoicemail'],
    data: {
        voicemailIntervalId: 0,
        tabIndex: 0, // 当前页签页，默认为全部通话（第一页）
        lastVoicemailDetailIndex: -1, // 记录最后一次显示详情的语音信箱下标。如果后续点击其他的语音信息，则上次打开的详情复原。
        /* 是否显示tab-bar标题栏 */
        showTabTitle: false, // 当列表滑动到顶部时，显示出tab-bar，当列表滑动到底部时，隐藏tab-bar
        isFirstTop: true,
        /* 图标资源 */
        icContactsCallIn: '/res/image/ic_contacts_call_in_mini.svg',
        icContactsCallMissed: '/res/image/ic_contacts_call_missed_mini.svg',
        icContactsCallRejected: '/res/image/ic_contacts_call_rejected_mini.svg',
        icContactsCallOut: '/res/image/ic_contacts_callout_mini.svg',
        icContactsVoicemailMini: '/res/image/ic_contacts_voicemail_mini.svg', // 语音信箱左侧小图标
        icContactsSim1: '/res/image/ic_contacts_sim_1_mini.svg',
        icContactsSim2: '/res/image/ic_contacts_sim_2_mini.svg',
        icContactsHd: '/res/image/ic_contacts_HD_mini.svg',
        icDetailPublic: '/res/image/ic_public_about_m.svg',
        icContactsEmptyCallLog: '/res/image/ic_contacts_empty_calllog_72.svg',
        icContactsEmptyVoicemail: '/res/image/ic_contacts_empty_voicemaile_72.svg',
        icDeleteM: '/res/image/ic_delete_white.svg',
        /* 语音信箱UI资源 */
        icVoicemailPlay: '/res/image/ic_play_filled_m.svg',
        icVoicemailPause: '/res/image/ic_contacts_pause voicemail_m.svg',
        icVoicemailVolume: '/res/image/ic_volume_m.svg', // 扬声器
        icVoicemailEarpiece: '/res/image/ic_contacts_Earpiece_m.svg',
        icVoicemailMessage: '/res/image/ic_massage_m.svg',
        icVoicemailPhone: '/res/image/ic_phonecall_m_block.svg',
        icVoicemailDelete: '/res/image/ic_delete_m.svg',
        /* 是否显示复选框 */
        useCheckBox: true,
        checked: true,
        /* 是否需要切换父页面小标题 */
        needSmallTitle: true,
        touchMoveData: {
            touchStartX: 0,
            touchStartY: 0,
            lastFrameX: 0,
            lastFrameY: 0,
            isTouchMove: false
        },
        listAnimateId: 0,
        /* 长按通话记录，弹出子菜单信息 */
        callMenuData: {
            index: '',
            itemId: [],
            name: '',
            number: ''
        },
        /* 异步menu加载id */
        showMenuTimeOutId: '',
        contactCount: 0,
        contacts: [],
        numRecords: []
    },
    onInit() {
        LOG.info(TAG + 'onInit' + 'logMessage: onInit calllog: length = ' + this.allCalls.length);
        this.$app.$def.globalData.refreshFunctions.push(() => {
            LOG.info(TAG + 'onInit' + 'logMessage callBack callLog!');
            if (this.$app.$def.dialerStateData.isGoToMissedCalls) { // 初次跳转到未接来电页签
                this.tabIndex = 1;
                this.showTabTitle = true;// 显示标签主题
                this.$app.$def.dialerStateData.isGoToMissedCalls = false;
            }
        });
        this.useCheckBox = this.batchDelete;
    },
    onShow() {
        this.isFirstTop = true;
    },
    onDestroy() {
        LOG.info(TAG + 'onDestroy' + 'logMessage onDestroy callLog!');
        this.$app.$def.globalData.refreshFunctions.pop();
    },

    /**
     * 播放或者暂停
     *
     * @param {number} index 下标
     */
    startOrPause: function (index) {
        LOG.info(TAG + 'startOrPause' + 'logMessage startOrPause index = ' + index);
        if (this.voicemailList[index].playState == 'start') {
            this.voicemailIntervalId = setInterval(() => {
                this.voicemailList[index].percentProgress += 1;
                if (this.voicemailList[index].percentProgress % 10 == 0) {
                    var displayValue = this.voicemailList[index].percentProgress / 10;
                    this.voicemailList[index].start = displayValue < 10 ? '00:0' + displayValue : '00:' + displayValue;
                }
                this.voicemailList[index].percent = parseInt(parseFloat(this.voicemailList[index].percentProgress)
                / parseFloat(this.voicemailList[index].timeDuration) * 10, 10);

                // 播放完成
                if (this.voicemailList[index].percentProgress
                == this.voicemailList[index].timeDuration * 10) {
                    clearInterval(this.voicemailIntervalId);
                    this.voicemailList[index].playState = 'start';
                    this.voicemailList[index].start = '00:00';
                    this.voicemailList[index].percentProgress = 0;
                    this.voicemailList[index].percent = 0;
                }
            }, 100);
            this.voicemailList[index].playState = 'pause';
        } else {
            clearInterval(this.voicemailIntervalId);
            this.voicemailList[index].playState = 'start';
        }
        LOG.info(TAG + 'onInit' + 'logMessage startOrPause voicemailList = ' + this.voicemailList);
    },

    /**
     * 改变声音大小
     *
     * @param {number} index 下标
     */
    changeVolume: function (index) {
        LOG.info(TAG + 'changeVolume' + 'logMessage changeVolume index = ' + index);
        if (this.voicemailList[index].volumeState == 'volume') {
            this.voicemailList[index].volumeState = 'earpiece';
        } else {
            this.voicemailList[index].volumeState = 'volume';
        }
        LOG.info(TAG + 'onInit' + 'logMessage startOrPause voicemailList = ' + this.voicemailList);
    },
    deleteVoicemail() {
        /* 由于显示详情时，已将信息存入this.callMenuData, 此处无需再作其他处理 */
        this.$element('deleteDialog').show();
    },
    /* 长按列表发送短信 */
    sendMessageByLog() {
        var params = [];
        params.push({
            contactsName: this.callMenuData.name,
            telephone: this.callMenuData.number.replace(' ','').replace(' ',''),
            telephoneFormat: this.callMenuData.number,
        });
        this.$app.$def.sendMessage(params);
    },
    /* 语音信箱详情呼叫前编辑 */
    editBeforeByLog() {
        this.$emit('editCall', {
            number: this.callMenuData.number,
        });
    },

    /**
     * 点击语音信箱信息
     *
     * @param {number} index 下标
     */
    clickVoicemailMessage: function (index) {
        this.callMenuData.index = index;
        this.callMenuData.itemId = this.voicemailList[index].ids;
        this.callMenuData.name = this.voicemailList[index].name;
        this.callMenuData.number = this.voicemailList[index].formatNumber;
        if (this.lastVoicemailDetailIndex != -1 && this.lastVoicemailDetailIndex != index) { // 若已经有其他细节被打开，则隐藏其他细节
            this.voicemailList[this.lastVoicemailDetailIndex].showMail = false;
            this.voicemailList[this.lastVoicemailDetailIndex].start = '00:00';
            this.voicemailList[this.lastVoicemailDetailIndex].percent = 0;
            this.voicemailList[this.lastVoicemailDetailIndex].percentProgress = 0;
        }
        this.voicemailList[index].showMail = !this.voicemailList[index].showMail;
        if (this.voicemailList[index].showMail) {
            this.lastVoicemailDetailIndex = index; // 记录打开细节的 item 的下标
        } else { // 若最终未打开细节，则不记录。
            this.lastVoicemailDetailIndex = -1;
        }
    },

    /**
     * 删除单条通话记录
     *
     * @param {number} index 下标
     */
    deleteSingleLog: function (index) {
        var tempList = [];
        if (this.tabIndex == 2) { // 语音信箱列表
            tempList = this.voicemailList;
        } else if (this.tabIndex == 1) { // 未接来电列表
            tempList = this.missedCallLogs;
        } else {
            tempList = this.allCalls;
        }
        this.$emit('deleteSingleCall', {
            id: tempList[index].ids,
            phoneNumber: [tempList[index].phone],
            contactKey: [tempList[index].contactKey],
            tabIndex: this.tabIndex
        });

    },

    /**
     * 批量删除的情况,点击单条通话记录则选中或取消复选框 非批量删除情况时判断卡1卡2情况拨出电话
     *
     * @param {number} index 下标
     * @param {number} type  类型
     * @param {number} e  类型
     */
    callLogProcess(index, type, e) {
        if (this.batchDelete) { // 批量删除的情况,点击单条通话记录则选中或取消复选框
            var checked = !this.allCalls[index].checked;
            this.changeCheckState(index, {'checked': checked});

        } else { // 正常点击单条通话记录
            this.$emit('callProcess', {number: Number(type) === 0 ? this.allCalls[index].formatNumber
                                                                  : this.missedCallLogs[index].formatNumber,});
        }
    },

/* list滑动到页面顶端事件 */
    listScrollTop() {
        if (!this.batchDelete) { // 批量删除时，不显示标签栏
            this.showTabTitle = true; // 显示tab-bar标题栏
            this.needSmallTitle = true;
            this.$emit('changeTitle', {
                type: 0 // 大标题
            });
        }
    },

/* list滑动到页面底端事件 */
    listScrollBottom() {
        this.showTabTitle = false; // 隐藏tab-bar标题栏
    },
    listScroll(e) {
        if (this.isFirstTop && e.scrollY < 0 && !this.batchDelete) {
            this.showTabTitle = true; // 初次加载并且向下滑动时，显示标题栏
            this.isFirstTop = false; // 回置
        }
    },

    /**
     * 显示具体通话记录细节
     *
     * @param {number} id 当前通话记录的ID
     * @param {Object} e event事件
     */
    showRecordDetails: function (id, e) {
        this.$emit('showDetails', {
            logIndex: id,
            tabIndex: this.tabIndex
        });
    },

    /**
     * 改变选中状态
     *
     * @param {number} index 下标
     * @param {Object} e event事件
     */
    changeCheckState(index, e) {
        this.$emit('changeChecked', {
            checked: e.checked,
            index: index,
            num: this.allCalls[index].num
        }); // 将列表参数向上传递到批量删除页面
    },

    /**
     * 选中通话
     *
     * @param {number} index 下标
     */
    selectCall(index) {
        this.$emit('checkCall', {
            id: this.allCalls[index].id,
            index: index
        });
    },
    // 请求通话记录
    requestCallLog() {
        this.$emit('requestLog', {});
    },
    requestMissedCalls() {
        this.$emit('requestMissed', {});
    },

    /**
     * 开始触摸通话list子元素事件
     *
     * @param {number} index 下标
     * @param {Object} e event事件
     */
    touchStartListItemDiv(index, e) {
        if (this.batchDelete) { // 批量删除状态下不触发左滑
            return;
        }
        LOG.info(TAG + 'touchStartListItemDiv' + 'logMessage touchStartListItemDiv : ' + e);
        this.touchMoveData.touchStartX = e.touches[0].globalX;
        this.touchMoveData.touchStartY = e.touches[0].globalY;
        this.$emit('itemTouchStart', {
            index: index,
            positionX: e.touches[0].globalX,
            positionY: e.touches[0].globalY,
        });
    },

    /**
     * 滑动通话list子元素事件
     *
     * @param {number} index 下标
     * @param {Object} e event事件
     */
    touchMoveListItem(index, e) {
        if (this.batchDelete) { // 批量删除状态下不触发左滑
            return;
        }
        this.$emit('itemTouchMove', {
            index: index,
            positionX: e.touches[0].globalX,
            positionY: e.touches[0].globalY,
        });
    },

    /**
     * 结束触摸通话list子元素事件
     *
     * @param {number} index 下标
     * @param {Object} e event事件
     */
    touchEndListItem(index, e) {
        if (this.batchDelete) { // 批量删除状态下不触发左滑
            return;
        }
        this.$emit('itemTouchEnd', {
            index: index,
            positionX: e.changedTouches[0].globalX,
            positionY: e.changedTouches[0].globalY,
        });
    },

    /**
     * 长按显示单条记录菜单项
     *
     * @param {number} index 下标
     * @param {number} type 类型
     */
    showCallMenu(index, type) {
        if (this.batchDelete) { // 批量删除时，不显示长按菜单
            return;
        }
        if (type == 2) { // 语音信箱列表
            this.callMenuData.index = index;
            this.callMenuData.itemId = this.voicemailList[index].ids;
            this.callMenuData.name = this.voicemailList[index].name;
            this.callMenuData.number = this.voicemailList[index].formatNumber;
        } else if (type  == 1) { // 未接来电列表
            this.callMenuData.index = index;
            this.callMenuData.itemId = this.missedCallLogs[index].ids;
            this.callMenuData.name = this.missedCallLogs[index].name;
            this.callMenuData.number = this.missedCallLogs[index].formatNumber;
        } else { // 通话记录列表
            this.callMenuData.index = index;
            this.callMenuData.itemId = this.allCalls[index].ids;
            this.callMenuData.name = this.allCalls[index].name;
            this.callMenuData.number = this.allCalls[index].formatNumber;
        }
        var tempX = this.touchMoveData.touchStartX;
        var tempY = this.touchMoveData.touchStartY;

        /* 控制菜单在屏幕的左右及上下的出现位置，数字代表的为逻辑像素px */
        if (this.touchMoveData.touchStartX > 360) {
            tempX = 360;
        }
        if (this.callMenuData.name == '' || this.callMenuData.name == undefined) { // 无联系人姓名
            if ((tempX > 320 && tempX < 330) && tempY > 450) {
                tempY = 450;
            } else if (tempX < 320 && tempY > 510) {
                tempY = 510;
            } else if (tempY > 420) {
                tempY = 420;
            }
        } else { // 有联系人
            tempY = tempY > 700 ? 700 : tempY;
        }
        clearTimeout(this.showMenuTimeOutId);
        /* 此处需要异步延时显示菜单，否则值刷新不过来 */
        this.showMenuTimeOutId = setTimeout(() => {
            this.$element('callLogMenu').show({
                x: tempX,
                y: tempY
            });
        }, 100);
    },

    /**
     * 长按菜单项各操作处理
     *
     * @param {Object} e event事件
     */
    onCallMenuSelected(e) {
        switch (parseInt(e.value, 10)) {
            case 1: // 新建联系人this.callMenuData.number,
                router.push({
                    uri: 'pages/contacts/accountants/accountants',
                    params: {
                        phoneNumbers: [
                            {
                                'labelId': 2,
                                'labelName': '手机',
                                'phoneNumber': this.callMenuData.number,
                                'phoneAddress': 'N',
                                'showP': true,
                                'blueStyle': true
                            }
                        ]
                    },
                });
                break;
            case 2: // 保存至已有联系人
                router.push({
                    uri: 'pages/contacts/selectContactsList/selectContactsList',
                    params: {
                        type: 'saveContacts',
                        number: this.callMenuData.number,
                    }
                });
                break;
            case 3: // 发送信息
                this.sendMessageByLog();
                break;
            case 4: // 复制号码
                this.$emit('copyNumber', {
                    number: this.callMenuData.number
                });
                break;
            case 5: // 呼叫前编辑
            /* 将号码传递给上层组件dialer */
                this.$emit('editCall', {
                    number: this.callMenuData.number,
                });
                break;
            case 6: // 加入黑名单
                break;
            case 7: // 删除通话记录
                this.$element('deleteDialog').show();
                break;
            default:
                break;
        }
    },
    doDelete() {
        this.$emit('removeCall', {
            id: this.callMenuData.itemId,
            index: this.callMenuData.index
        });
    },

    /**
     * 监测滑动距离判断拨号盘是否需要隐藏
     *
     * @param {Object} e event事件
     */
    touchMoveContent(e) {
        /* 向下滑屏距离大于100px时，显示标题 */
        if (e.touches[0].globalY - this.touchMoveData.touchStartY > 100 && !this.touchMoveData.isTouchMove) {
            /* 隐藏拨号盘 */
            this.$emit('hideDialer', {});
            if (!this.batchDelete && this.allCalls.length > 0) {
                this.showTabTitle = true;
            }
            this.touchMoveData.isTouchMove = true;
        }
        /* 向上滑屏距离大于100px时，隐藏标题 */
        if ((e.touches[0].globalY - this.touchMoveData.touchStartY < -100) && this.allCalls.length > 0
        && !this.touchMoveData.isTouchMove) {
            this.$emit('hideDialer', {});
            this.showTabTitle = false;
            if (this.needSmallTitle) {
                this.$emit('changeTitle', {
                    type: 1
                });
                this.needSmallTitle = false;
            }
            this.touchMoveData.isTouchMove = true;
        }
    },
    touchEndContent: function () {
        this.touchMoveData.isTouchMove = false;
    },

    /**
     * 通话记录与未接来电切换事件
     *
     * @param {Object} e event事件
     */
    changeCallListTab(e) {
        this.tabIndex = e.index; // 设置当前通话记录页签为所切换的页签。
        this.$emit('changeLog', {
            logIndex: e.index,
        });
    },

    /**
      * 参数说明：
      *
      * 截取字符串的前五个字符外加.. 例如：'哈哈哈哈哈哈哈哈' => '哈哈哈哈哈..'
      * @param {string} str 对象字符串
      * @return {string} newStr 截取之后的字符串
      */
    subStringWithEllipsis(str) {
        let newLength = 0;
        let len = 7;
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
    }
};