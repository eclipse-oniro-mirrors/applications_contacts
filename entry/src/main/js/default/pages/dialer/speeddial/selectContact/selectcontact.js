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
import Utils from '../../../../../default/utils/utils.js'
import selectContactsAbility from '../../../../../default/model/SelectcontactsModel.js';
import Constants from '../../../../../default/common/constants/Constants.js';
import httpcontact from '../../../../../default/model/ContactModel.js';
import LOG from '../../../../utils/ContactsLog.js';
import groupReq from '../../../../model/GroupsModel.js';

var TAG = 'selectContact';

export default {
    data: {
        searchText: '',
        contactList: [],
        emptyText: '',
        searchContactList: [],
        showEmpty: false,
    //是否显示内容布局
        contentShow: false,
    //是否显示搜索标题
        searchTitleLayout: true,
    //是否显示搜索列表
        searchLayoutShow: false,
        searchPhoneNum: 0,
        searchDefaultName: '',
        phoneCheckShow: false,
        childPhoneCheckShow: false,
        showNumberList: true,
        showDefaultNumber: true,
        page: 0,
        contactCount: 0,
        limit: 200,
        routerParamsSpeedDialIndex: -1,
        defaultHead: '',
        searchRequestCode: 2012
    },
    onInit() {
        this.emptyText = this.$t('value.selectContact.page.empty');
        if (Utils.isEmpty(this.searchDefaultName)) {
            //初始化联系人数据
            this.initData();
        } else {
            this.searchText = this.searchDefaultName;
            this.onSearchTextChange(this.searchText);
        }
    },
    initData() {
        this.page = 0;
        var requestData = {
            page: this.page,
            limit: this.limit
        };
        this.requestInit(requestData);
    },
    back() {
        //返回
        router.back();
    },
    onTextChange(text) {
        //搜索输入框
        if (Utils.isEmpty(text.text)) {
            this.emptyText = this.$t('value.selectContact.page.empty');
            this.refreshLayout();
        } else {
            this.searchText = text.text;
            this.onSearchTextChange(this.searchText);
        }
    },
    touchStartSearch: function () {
        this.$element('search').focus({
            focus: true
        })
    },
    editContactsInfo(e) {
        if (!e.detail.contacts.isPushed) {
            e.detail.contacts.phoneNumbers.push({
                'labelId': 2,
                'labelName': this.$t('accountants.phone'),
                'phoneNumber': this.number,
                'phoneAddress': 'N',
                'showP': false,
                'blueStyle': true
            });
            e.detail.contacts.isPushed = true;
        }
        LOG.info(TAG + 'editContactsInfo' + 'logMessage phoneNumbers = ' + e.detail.contacts.phoneNumbers);
        router.push(
            {
                uri: 'pages/contacts/accountants/accountants',
                params: {
                    addShow: false,
                    updataShow: true,
                    showWork: true,
                    upHouseShow: true,
                    upPinShow: true,
                    saveContact: true,
                    contactForm: e.detail.contacts
                }
            });
    },
/**
     * 缓存分页加载,由组件提供的方法接口调用
     */
    requestItem: function () {
        this.page++;
        var requestData = {
            page: this.page,
            limit: this.limit
        };
        this.requestInit(requestData);
    },
/**
     * 初始化列表数据
     */
    requestInit: function (data) {
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        selectContactsAbility.queryContacts(DAHelper, resultList=>{
            if(Utils.isEmptyList(resultList)) {
                LOG.info(TAG + 'requestInit' + 'logMessage select contact list is empty!!');
            } else {
                var listTemp = [];
                var speedNumberMap = new Map();
                if (this.type == 'saveSpeedDial') {// 快速拨号跳转本页面情况下，取出所有已设置快速拨号的联系人号码放入speedNumberMap,供后续过滤已选择的联系人号码使用
                    for(let i = 1; i <=9; i++) {
                        var speedItemString = this.$app.$def.globalData.storage.getSync('speedDial'+i,'');
                        if (!Utils.isEmpty(speedItemString)) {
                            var speedItem = JSON.parse(speedItemString);
                            speedNumberMap.set(speedItem.speedNumber,null);
                        }
                    }
                }
                if (resultList.length > 0) {
                    resultList.forEach(element => {
                        element.name = {};
                        element.name.fullName = element.emptyNameData;
                        element.name.namePrefix = element.namePrefix;
                        element.name.nameSuffix = element.nameSuffix;
                        element.portraitPath = false;
                        if (!Utils.isEmpty(element.phoneNumbers) && element.phoneNumbers.length > 0) {
                            var phoneNumbersTemp = []; //创建过滤后的电话号码容器
                            element.phoneNumbers.forEach(childEle => {
                                childEle.checked = false;
                                childEle.labelName = this.getPhoneLabelNameById(childEle.labelId);
                                this.initVariableSpan(element);
                                if (!speedNumberMap.has(Utils.removeSpace(childEle.phoneNumber))) {
                                    // 快速拨号跳转本页面的情况下，如果已设置快速拨号则不添加容器
                                    phoneNumbersTemp.push(childEle);
                                }
                            })
                            if (phoneNumbersTemp.length > 0) {
                                //只有在存在未被设置为快速拨号的电话号码时，才显示在contact列表中。
                                element.phoneNumbers = phoneNumbersTemp;
                                listTemp.push(element);
                            }
                        }
                    });
                    this.contactList = listTemp;
                }
            }
            //请求数据完成刷新界面，保证空布局和数据列表正常显示
            this.refreshLayout();
        });
    },
/* 根据手机号的LabelId获取LabelName */
    getPhoneLabelNameById: function(phoneLabelId) {
        var labelName = '';
        switch (parseInt(phoneLabelId)) {
            case 1:
            labelName = this.$t('accountants.house');
            break;
            case 2:
            labelName = this.$t('accountants.phone');
            break;
            case 3:
            labelName = this.$t('accountants.unit');
            break;
            case 4:
            labelName = this.$t('accountants.unit fax');
            break;
            case 5:
            labelName = this.$t('accountants.home fax');
            break;
            case 6:
            labelName = this.$t('accountants.pager');
            break;
            case 7:
            labelName = this.$t('accountants.others');
            break;
            case 12:
            labelName = this.$t('accountants.switchboard');
            break;
            case 99:
            labelName = this.$t('accountants.customize');
            break;
            default:
                break;
        }
        return labelName;
    },

/**
     * 赋值自定义属性，为后面可变字体搜索做准备
     */
    initVariableSpan: function (item) {
        //初始化可变名称
        var matchString = Utils.getMatchedString(item.emptyNameData, this.searchText);
        if (Utils.isEmpty(matchString) || Utils.isEmpty(this.searchText.trim())) {
            item.name.searchTextStart = '';
            item.name.searchTextMiddle = '';
            item.name.searchTextEnd = item.emptyNameData
        } else {
            var name = item.emptyNameData;
            var index = name.indexOf(matchString);
            item.name.searchTextStart = name.substr(0, index);
            item.name.searchTextMiddle = name.substr(index, matchString.length);
            item.name.searchTextEnd = name.substr(index + matchString.length);
        }
        //初始化可变手机号
        for (var i = 0; i < item.phoneNumbers.length; i++) {
            var phoneNumber = item.phoneNumbers[i].phoneNumber;
            var matchStringPhone = Utils.getMatchedString(phoneNumber, this.searchText);
            if (Utils.isEmpty(matchStringPhone) || Utils.isEmpty(this.searchText.trim())) {
                item.phoneNumbers[i].startPhone = ''
                item.phoneNumbers[i].middlePhone = ''
                item.phoneNumbers[i].endPhone = phoneNumber;
            } else {
                var phoneIndex = phoneNumber.indexOf(matchStringPhone);
                item.phoneNumbers[i].startPhone = phoneNumber.substr(0, phoneIndex);
                item.phoneNumbers[i].middlePhone = phoneNumber.substr(phoneIndex, matchStringPhone.length);
                item.phoneNumbers[i].endPhone = phoneNumber.substr(phoneIndex + matchStringPhone.length);
            }
        }
    },
    /**
     * 电话号码去重
     */
    duplicateRemoval: function (result) {
        if (Utils.isEmptyList(result.data)) {
            return result;
        }
        var resultList = result.data;
        for (var i = 0; i < resultList.length; i++) {
            var item = resultList[i];
            var phoneNumbersList = [];
            //倒序排序，去重复的最后一个添加
            for (var j = item.phoneNumbers.length - 1; j >= 0; j--) {
                var indexOf = this.indexOf(item.phoneNumbers[j], phoneNumbersList);
                //不存在则添加
                if (indexOf == -1) {
                    phoneNumbersList.push(item.phoneNumbers[j]);
                }
            }
            //为了减少一次循环搜索名称颜色可变加入此处,初始化可变字体
            this.initVariableSpan(item);
            item.phoneNumbers = phoneNumbersList;
        }
        return result;
    },
//查询联系人电话是否已在电话列表中，通过电话号码去重，显示最后一次添加的
    indexOf: function (item, phoneNumbersList) {
        var index = -1;
        if (Utils.isEmptyList(phoneNumbersList)) {
            return index;
        }
        for (var i = 0; i < phoneNumbersList.length; i++) {
            LOG.info(TAG + 'indexOf' + 'select contact indexOf==>success');
            if (item.phoneNumber == phoneNumbersList[i].phoneNumber) {
                index = i;
                break;
            }
        }
        return index;
    },
/**
     * 去除已选中的联系人电话或联系人
     */
    filterContact: function (contactData, result) {
        if (Utils.isEmptyList(contactData)) {
            return result;
        }
        var resultList = [];
        var resultDataList = result.data;
        for (var i = 0; i < resultDataList.length; i++) {
            var resultItem = resultDataList[i];
            for (var index = 0; index < contactData.length; index++) {
                var routerItem = contactData[index];
                var tempNumber;
                if (routerItem.contactId == resultItem.contactId) {
                    var phoneNumbers = resultItem.phoneNumbers;
                    tempNumber = [];
                    for (var j = 0; j < phoneNumbers.length; j++) {
                        //通过电话号码和电话类型过滤
                        if (!((phoneNumbers[j].phoneNumber == routerItem.selectNumber)
                        && (phoneNumbers[j].labelId == routerItem.selectLabelId))) {
                            tempNumber.push(phoneNumbers[j]);
                        }
                    }
                    resultItem.phoneNumbers = tempNumber;
                }
            }
            //如果电话列表中没有元素
            if (resultItem.phoneNumbers.length <= 0) {
                continue;
            }
            resultList.push(resultItem);
        }
        result.data = resultList;
        return result;
    },
/**
     * 显示布局
     */
    refreshLayout() {
        if (Utils.isEmptyList(this.contactList)) {
            //联系人数据为空
            this.searchTitleLayout = false;
            this.showEmpty = true;
            this.contentShow = false;
        } else {
            //联系人数据不为空
            this.searchTitleLayout = true;
            this.showEmpty = false;
            this.contentShow = true;
            this.searchLayoutShow = false;
        }
    },
/**
     * 点击事件
     */
    selectClick: function (params) {
        if (Utils.isEmpty(this.searchDefaultName)) {
            LOG.info(TAG + 'selectClick' + 'logMessage select=====>selectClick index:' + params.detail.index + '  indexChild:');
            var item = {};
            if (this.searchLayoutShow) {
                item = this.searchContactList[params.detail.index];
            } else {
                item = this.contactList[params.detail.index];
            }
            LOG.info(TAG + 'selectClick' + 'logMessage item = '+item);
            var indexChild = params.detail.indexChild;
            if (this.type == 'saveVoicemail') { //语音信箱选择联系人号码
                var voicemailNumber = item.phoneNumbers[indexChild].phoneNumber;
                this.$app.$def.globalData.voicemailNumber = voicemailNumber;// 通过全局变量回传选中的voicemailNumber;
            } else if (this.type == 'saveSpeedDial') {//快速拨号选择联系人
                var speedNumber = item.phoneNumbers[indexChild].phoneNumber
                var speedItem = {}; //根据选择的联系人生成快速拨号数据
                speedItem.emptyNameData = item.emptyNameData;
                speedItem.routerIndex = this.speedDialIndex + 1;//显示的标识比数组坐标大1
                speedItem.contactId = item.contactId;
                speedItem.nameSuffix = item.nameSuffix;
                speedItem.portraitColor = item.portraitColor;
                speedItem.portraitPath = Utils.isEmpty(item.portraitPath)? '': item.portraitPath;
                speedItem.speedNumber = Utils.removeSpace(speedNumber);
                this.$app.$def.globalData.storage.putSync('speedDial'+this.speedDialIndex,JSON.stringify(speedItem));
                this.$app.$def.globalData.storage.flushSync();
            }
            this.$app.$def.globalData.dialogShow = true;
            router.back();
        } else {
            var contactId = this.searchContactList[params.detail.index].contactId;
            router.push({
                uri: 'pages/contacts/contactDetail/contactDetail',
                params: {
                    contactId: contactId,
                    isNewSource: true,
                }
            });
        }
    },
    onSearchTextChange: function (text) {
        this.searchRequest(this.searchRequestCode, text);
    },
/**
     * 搜索请求后台
     */
    searchRequest: function (code, keyText) {
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        var data = {};
        data.likeValue = keyText;
        groupReq.searchContacts(DAHelper, data, result => {
            if (result.code == 0 && result.contactCount > 0) {
                var resultData = this.duplicateRemoval(this.filterContact(this.contactData, result));
                this.searchContactList = resultData.data;
                this.searchPhoneNum = this.searchContactList.length;
            } else {
                this.searchContactList = [];
                LOG.error(TAG + 'searchRequest' + 'select contact request error');
            }
            this.searchPhoneNum = this.searchContactList.length;
            LOG.info(TAG + 'searchRequest' + 'select search request  result');
            this.refreshSearchList(keyText, this.searchContactList);
        });
    },
/**
     * 刷新搜索界面
     */
    refreshSearchList: function (keyText, searchContactList) {
        if (Utils.isEmpty(keyText)) {
            this.searchLayoutShow = false;
            this.emptyText = this.$t('value.selectContact.page.empty');
            this.showEmpty = true;
            this.contentShow = false;
            this.searchLayoutShow = false;
        } else {
            if (Utils.isEmptyList(searchContactList)) {
                //搜索列表为空,更新搜索文字描述
                this.emptyText = this.$t('value.selectContact.page.emptyText');
                this.showEmpty = true;
                this.contentShow = false;
                this.searchLayoutShow = false;
            } else {
                this.searchLayoutShow = true;
                this.contentShow = true;
                this.showEmpty = false;
                this.emptyText = this.$t('value.selectContact.page.empty');
            }
        }
    },
/**
     * 查找可变字体下标
     * **/
    searchIndexOf: function (keyText, source) {
        return source.indexOf(keyText);
    }
}
