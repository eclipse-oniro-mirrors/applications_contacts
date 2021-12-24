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
var TAG = 'voicemailSettings';
export default {
    data: {
        voiceMailNumber: '',
        newNumberTemp:'', //暂存旧的语音信箱值，用于在弹框中显示待确认的voiceNumber
        dialogInputActive: false,
    },
//初始化页面
    onInit() {
        /* 从storage读取语音信箱号码 */
        this.voiceMailNumber = this.$app.$def.globalData.storage.getSync('voicemailNumber',this.$t('value.callRecords.noSettings'));
        if (this.$t('value.callRecords.noSettings') != this.voiceMailNumber) {
            this.$app.$def.globalData.voicemailNumber = this.voiceMailNumber; //设置全局语音信箱号码，方便在初次onShow展示
        }
    },
    onShow() {
        /* 返回后，弹框中显示新设置的语音信箱号码 */
        if (this.$app.$def.globalData.dialogShow == true) {
            setTimeout(() => {
                this.newNumberTemp = this.$app.$def.globalData.voicemailNumber;
            }, 200);
            setTimeout(() => {
                this.$element('editVoiceMailNumber').show();
            }, 500);
        }
    },
    onDestroy() {

    },
    copy(value){
        var newValue = value;
        return newValue;
    },
    back: function () {
        this.$app.$def.globalData.dialogShow = false;
        router.back();
    },
/* 语音信箱号码编辑跳转选择联系人界面 */
    selectContacts: function () {
        router.push({
            uri: 'pages/dialer/speeddial/selectcontact/selectcontact',
            params: {
                type: 'saveVoicemail',
            }
        });
    },
    changeStyle: function () {
        this.dialogInputActive = true;
    },
/* 编辑服务提供商事件 */
    editProvider:function() {
        this.$element('myProvider').show();
    },
/* 编辑语音信箱号码事件 */
    editVoiceNumber:function() {

        /* 弹框时，默认显示原voiceMailNumber */
        this.$element('editVoiceMailNumber').show();
        if (this.voiceMailNumber != this.$t('value.callRecords.noSettings')) {
            this.newNumberTemp = this.voiceMailNumber;
        }
    },
    cancelEdit: function () {
        this.$element('editVoiceMailNumber').close();
        this.newNumberTemp = this.voiceMailNumber;
        this.$app.$def.globalData.voicemailNumber = this.voiceMailNumber; //此处也需要将全局voicemailNumber设置为原值。
    },
    changeVoicemailNumber: function (e) {
        this.newNumberTemp = e.value;
    },
    confirmVoiceNumber:function() {
        this.voiceMailNumber = this.newNumberTemp; // 将号码设置为新值。
        this.$app.$def.globalData.storage.putSync('voicemailNumber',this.newNumberTemp);
        this.$app.$def.globalData.storage.flushSync();// 将新的号码持久化存储。
        this.$element('editVoiceMailNumber').close();
    },
    cancelProvider:function() {
        this.$element('myProvider').close();
    },
    confirmProvider:function() {
        this.$element('myProvider').close();
    }

}