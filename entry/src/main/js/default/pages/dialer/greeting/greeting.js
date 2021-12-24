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
import prompt from '@system.prompt';
import LOG from '../../../utils/ContactsLog.js';
import Constants from '../../../common/constants/Constants.js';
import greetingService from '../../../../default/model/GreetingModel.js';

var TAG = 'greeting';

export default {
    data: {
        greetingList: [],
        isDelete: true,
        progressStart: '00:00',
        progressNum: 0,
        showStartRecordBtn: true,
        timeOutId: '',
        greetingName: '',
        randomId: '',
        greetingId: '',
        isMaxGreeting: false,
    },

    onShow() {
        var requestData = {
            page: 0,
            limit: 20000,
        };
        this.initGreeting(22004, requestData);
    },

    onDestroy() {
    },
    onRadioChange: function (index) {
        this.greetingList.forEach(element => {
            element.radio = false;
        });
        this.greetingList[index].radio = true;
    },
    deleteGreeting: function () {
        this.isDelete = false;
    },
    closeAddGreetingDialog() {
        this.$element('addGreetingDialog').close();
        clearInterval(this.timeOutId);
        this.progressStart = '00:00';
        this.progressNum = 0;
        this.showStartRecordBtn = true;
    },
    startRecord() {
        this.showStartRecordBtn = false;
        this.progressNum = 0;
        this.progressStart = '00:00';
        var index = 0;
        this.timeOutId = setInterval(() => {
            index++;
            if (index < 10) {
                this.progressStart = '00:0' + index;
            } else {
                this.progressStart = '00:' + index;
            }

            //最大时间15秒，根据当前时间算进度条
            this.progressNum = index / 15 * 100;
            if (index > 14) {
                clearInterval(this.timeOutId);
                this.$element('addGreetingDialog').close();
                this.$element('confirmAddGreeting').show();
            }
        }, 1000);

        //保存录音产生的文件
    },
    addGreetingDialog: function () {
        this.showStartRecordBtn = false;
        this.progressNum = 0;
        this.progressStart = '00:00';
        clearInterval(this.timeOutId);
        this.$element('addGreetingDialog').close();
        this.$element('confirmAddGreeting').show();
    },
    cancelAddGreeting() {
        this.$element('confirmAddGreeting').close();
        this.progressStart = '00:00';
        this.progressNum = 0;
        this.showStartRecordBtn = true;
        //删除录音产生的文件
    },

    groupNameChanged: function (e) {
        this.greetingName = e.value;
    },

    saveGreetingFile() {
        //把保存文件名和应答语名称传给后台
        this.$element('confirmAddGreeting').close();
        //调用后台接口保存
        var voiceMailUri = 'file:///data/accounts/account_0/appdata/com.telephony.demo.call/files/audioRecord.mp4';
        var data = {
            'name': this.greetingName,
            'voiceMailUri': voiceMailUri
        }
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.VOICEMAIL_DB_URI);
        greetingService.insertGreeting(DAHelper, data, resultId => {
            if (resultId > 0) {
                var addList = [{
                                   id: resultId.toString(),
                                   name: this.greetingName,
                                   radio: false,
                                   checked: false
                               }];
                this.greetingList = this.greetingList.concat(addList);
                if (this.greetingList.length == 11) {
                    this.isMaxGreeting = true;
                }
                clearTimeout(this.greetingId);
                this.greetingId = setTimeout(() => {
                    this.$app.$def.globalData.storage.putSync('phone_setting_greeting_data', JSON.stringify(this.greetingList));
                    this.$app.$def.globalData.storage.flushSync();
                }, 0);
            } else {
                prompt.showToast({
                    message: 'Failed to insert greeting data.'
                });
            }
        });
    },
    sleep: function (milliSeconds) {
        var startTime = new Date().getTime();
        while (new Date().getTime() < startTime + milliSeconds) {
            LOG.info(TAG + 'sleep wait...');
        }
    },

    //返回上层页面
    back: function () {
        router.back();
    },
    //保存设置
    saveGreeting: function () {
        var checkedId = '';
        var uncheckedIds = [];
        LOG.info(TAG + 'saveGreeting result is ---------' + this.greetingLis);
        this.greetingList.forEach(element => {
            if (element.checked) {
                checkedId = element.id;
            } else {
                uncheckedIds.push(element.id);
            }
        });
        clearTimeout(this.greetingId);
        this.greetingId = setTimeout(() => {
            this.$app.$def.globalData.storage.putSync('phone_setting_greeting_data', JSON.stringify(this.greetingList));
            this.$app.$def.globalData.storage.flushSync();
        }, 0);
        var data = {
            'checkedId': checkedId,
            'uncheckedIds': uncheckedIds
        }
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.VOICEMAIL_DB_URI);
        greetingService.saveCheckedGreeting(DAHelper, data, result => {
            if (result == 0) {
                router.back();
            } else {
                prompt.showToast({
                    message: 'Failed to update checked greeting data.'
                });
            }
        });
    },


    changePage: function (e) {
        this.isDelete = e.detail.isDelete;
        this.greetingList = e.detail.greetingList;
        this.isMaxGreeting = this.greetingList.length < 11 ? false : true;
    },
    clickAddGreeting: function () {
        this.showStartRecordBtn = true;
        this.$element('addGreetingDialog').show();
    },
    /**
     * 获取应答语列表数据
     *
     * @param code 2005 FA与PA通行协议码
     * @param data  contactId 联系人ID
     */
    initGreeting: function (code, data) {
        var defaultList = [{
                               id: '-1',
                               name: '',
                               radio: true,
                               checked: false
                           }];
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.VOICEMAIL_DB_URI);
        greetingService.queryGreeting(DAHelper, data, result => {
            if (result.code == 0) {
                this.greetingList = defaultList.concat(result.greetingList);
                this.initGreetingConfig();
            } else {
                prompt.showToast({
                    message: 'Failed to init greeting data.'
                });
            }
        });

    },

    initGreetingConfig: function () {
        var defaultData = [{
                               id: '-1',
                               name: '',
                               radio: true,
                               checked: false
                           }];
        let ret = this.$app.$def.globalData.storage.getSync('phone_setting_greeting_data', 'false');
        this.storageValue = ret == 'false' ? defaultData : JSON.parse(ret);
        this.greetingList.forEach(element => {
            this.storageValue.some(function (item) {
                if (element.id == item.id) {
                    element.radio = item.radio;
                    return true;
                }
            });
        });
        if (this.greetingList.length == 11) {
            this.isMaxGreeting = true;
        }
    }
}