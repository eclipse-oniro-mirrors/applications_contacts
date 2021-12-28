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
import router from '@system.router';
import Utils from '../../../../default/utils/utils.js'
import LOG from '../../../utils/ContactsLog.js';

var TAG = 'speedDial';

export default {
    data: {
        num: 9,
        speedList: [],
        searchContactList: [],
        isClick: true,
        routerIndex: -1,
        currentIndex: -1, //当前item在speedList中的下标。
        ic_contacts_voicemail: '/res/image/ic_contacts_voicemail_s.svg',
    },
    onInit() {
        this.initData();
    },
    back() {
        //返回
        router.back();
    },
    onShow() {
        this.initData(); //刷新快速拨号面板
    },
    initData: function () {
        this.speedList = []; //清空数组，重新刷新数据。
        //初始化默认数据
        for (let index = 0; index < this.num; index++) {
            var speedItemString = this.$app.$def.globalData.storage.getSync('speedDial'+index,'');
            if (index == 0) { //第一位固定为语音信箱
                let item = {};
                item.emptyNameData = this.$t('value.callRecords.voiceMails');
                item.image = this.ic_contacts_voicemail;
                item.routerIndex = index + 1;
                this.speedList.push(item);
            } else if (!Utils.isEmpty(speedItemString)) { //已经设置快速拨号，则直接取已设置的联系人
                this.speedList.push(JSON.parse(speedItemString));
            } else {
                let item = {};
                item.emptyNameData = this.$t('value.speedDial.page.add');
                item.image = this.$t('svg.speedDial.add');
                item.routerIndex = index + 1;
                this.speedList.push(item)
            }
        }
        LOG.info(TAG + 'initData' + 'logMessage speedDail 4 speedList = ' + this.speedList);
    },
/**
     * 点击事件
     * **/
    itemClick(index) {
        this.currentIndex = index;
        if (index == 0) {// 表示语音信箱设置，则跳转语音信箱设置页面
            router.push({
                uri: 'pages/dialer/voicemailsettings/voicemailsettings'
            });
        } else if (this.isAdd(index)) {
            this.$element('simpledialog').show();
        } else {
            this.noAddData(index);
        }
    },
    noAddData: function (index) {
        // 快速拨号item 点击
        var that = this;
        if (this.isClick) {
            this.isClick = false;
            //事件
            LOG.info(TAG + 'noAddData speedDial itemClick===>' + index);
            that.routerPage(index);
            //定时器,一秒内不能重复点击
            setTimeout(function () {
                that.isClick = true;
            }, 1000);
        }
    },
    routerPage: function (index) {
        //点击跳转至选择联系人界面
        router.push({
            uri: 'pages/dialer/speeddial/selectcontact/selectcontact',
            params: {
                type: 'saveSpeedDial',
                speedDialIndex: index,
            }
        });
    },
    isAdd: function (index) {
        return!Utils.isEmpty(this.speedList[index].contactId);
    },
/**
     * 删除
     * **/
    deleteSpeed: function () {
        if (this.currentIndex > 0) { //删除在当前index中设置的快速拨号联系人
            this.$app.$def.globalData.storage.deleteSync('speedDial'+this.currentIndex);
            this.$app.$def.globalData.storage.flushSync();
            this.initData();
            this.$element('simpledialog').close();
        }
    },
/**
     * 修改
     * **/
    updateSpeed: function () {
        if (this.currentIndex > 0) {
            this.$element('simpledialog').close();
            //点击跳转至选择联系人界面
            router.push({
                uri: 'pages/dialer/speeddial/selectcontact/selectcontact',
                params: {
                    type: 'saveSpeedDial',
                    speedDialIndex: this.currentIndex,
                }
            });
        }
    },
/**
     * 取消
     * **/
    cancelSchedule: function () {
        this.$element('simpledialog').close();
    },
}
