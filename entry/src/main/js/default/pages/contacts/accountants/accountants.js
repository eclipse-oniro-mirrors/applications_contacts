/**
 * @file 新建联系人
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
import contactReq from '../../../../default/model/AccountantsModel.js';
import configuration from '@system.configuration';
import contactDetailReq  from '../../../../default/model/ContactDetailModel.js';
import LOG from '../../../utils/ContactsLog.js';
import Constants from '../../../../default/common/constants/Constants.js';
import Prompt from '@system.prompt';

var TAG = ' accountants...: ';

export default {
    data: {
        // 新增联系人状态
        addShow: true,
        // 编辑联系人状态
        updataShow: false,
        // 名片
        carteFlag: false,
        // 编辑名片
        updateCard: false,
        /*电话号码展示*/
        phonShow: false,
        /*添加更多选项div的状态*/
        MoreDivStatus: true,
        // 拼音状态
        LetterShow: false,
        // 即时消息状态
        upMessShow: false,
        // 铃声状态
        upRingShow: false,
        // 住宅状态
        upHouseShow: false,
        // 昵称状态
        upNickShow: false,
        // 网址状态
        upWebShow: false,
        // 生日状态
        upBirthShow: false,
        // 助理
        upAssShow: false,
        /**职务隐藏**/
        showWork: false,
        /**保存图标状态控制*/
        isEmpty: false,

        /**div*/
        flexInputStyle: 'const-fisrt',
        flexImageStyle: 'const-image-div',
        flexImageSize: 'fisrt-image',
        flexInputSize: 'font-color-first',
        flexInputFont: 'font-color-note',
        flexCenterSize: 'text-note',
        ringText: '', // 电话铃声
        id: 0,
        // 添加多个email状态
        emailShow: false,
        // 添加多个即时消息装
        messShow: false,
        // 添加多个住宅状态
        houseShow: false,
        // 添加多个网址状态
        websiteShow: false,
        // 添加多个助理状态
        assisShow: false,
        // 群组list
        groups: [],
        // 新增至已有联系人
        saveContact: false,
        // 新增已有联系热number
        phoneNumber: '',
        // 页面显示群组值
        groupContext: '',
        emails: [
            {
                'id': 1,
                'email': '',
                'labelId': 1,
                'labelName': '',
                'showP': false
            }
        ],
        events: [
            {
                'id': 1,
                'eventDate': '',
                'labelId': 3,
                'showP': false,
                'showF': true,
                'showS': true
            }
        ],
        imAddresses: [
            {
                'id': 1,
                'imAddress': '',
                'labelId': 1,
                'labelName': 'AIM',
                'showP': false
            }
        ],
        phoneNumbers: [
            {
                'id': 1,
                'labelId': 2,
                'labelName': '',
                'phoneNumber': '',
                'phoneAddress': 'N',
                'blueStyle': false,
                'showP': false
            }
        ],
        postalAddresses: [
            {
                'id': 1,
                'labelId': 1,
                'labelName': '',
                'postalAddress': '',
                'showP': false
            }
        ],
        relations: [
            {
                'id': 1,
                'labelId': 1,
                'labelName': '',
                'relationName': '',
                'showP': false
            }
        ],
        websites: [
            {
                'id': 1,
                'website': '',
                'showP': false
            }
        ],
        name: {
            'fullName': '',
            'givenName': '',
            'familyName': '',
            'middleName': '',
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
        birthShow: false,
        showF: true,
        showS: true,
        // 日期类型
        types: ['3', '2', '4', '1'],
        typeShow: false,
        labType: '',
        labId: 0,
        contactForm: {},
        timeOutId: '',
        DialogStatus: true,
        year: '',
        endyear: '',
        customizeInputValue: '', // 自定义输入框的值
        oldCustomizeLabelId: '2',
        oldParam: {},
        isInitFirst: true,
        // 删除我的名片
        delCard: false,
        // 群组是否添加标识
        groupStatus: false,
        contactId: 0,
        contacts: {},
        language: '',
        // 默认中文
        langStatus: true,
        // 英文拼音状态
        usStatus: false,
        // 中英文拼音
        letter: '',
        // givenName-名
        givenName: '',
        // 英文场景出现familyName-姓、
        familyName: '',
        // middleName-中间名、
        middleName: '',
        familyNamePhonetic: '',
    },

    /* 页面初始化时触发 */
    onInit() {
        LOG.info(TAG + 'onInit......');
        this.events[0].eventDate = this.$t('accountants.date');
        this.language = configuration.getLocale().language;
        this.isInitFirst = true;
        var date = new Date();
        this.letter = this.$t('accountants.letter');
        if (this.language == 'en') {
            this.langStatus = false;
        }
        this.endyear = date.getFullYear() + 1 + '-1-1';
        LOG.info(TAG + 'onInit' + '----' + this.endyear);
        var temp = '';

        if (this.addShow && !this.groupStatus) {
            this.contactForm = {
                'emails': this.emails,
                'events': this.events,
                'favorite': false,
                'imAddresses': this.imAddresses,
                'name': this.name,
                'nickName': this.nickName,
                'note': this.note,
                'organization': this.organization,
                'phoneNumbers': this.phoneNumbers,
                'postalAddresses': this.postalAddresses,
                'relations': this.relations,
                'show': false,
                'websites': this.websites,
                'groups': this.groups
            }
        }
        // 群组返回值拼接页面展示值
        if (!this.contactForm.groups || this.contactForm.groups.length == 0) {
            this.contactForm.groups = this.groups;
        }
        if (this.contactForm.groups.length > 0) {
            if (this.contactForm.groups.length == 1) {
                temp = this.groups[0].title;
            } else {
                this.contactForm.groups.forEach(group => {
                    temp = temp + ',' + group.title
                })
                temp = temp.substring(1, temp.length - 1);
            }
            this.groupContext = temp;
        }
        // 更新页面初始化
        if (this.updataShow && !this.groupStatus) {
            if (this.saveContact) {
                var requestData = {
                    contactId: this.contactId
                };
                var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
                contactDetailReq.getContactById(DAHelper, requestData, result => {
                    LOG.info(TAG + 'onInit' + 'getContactById .....');
                    this.initUpdateData(result.data)
                    this.contactForm = result.data;
                    if (this.contactForm.phoneNumbers.length == 1 && this.contactForm.phoneNumbers[0].phoneNumber == '') {
                        this.contactForm.phoneNumbers = [];
                    }
                    this.contactForm.phoneNumbers.push({
                        'labelId': 2,
                        'labelName': this.$t('accountants.phone'),
                        'phoneNumber': this.phoneNumber,
                        'phoneAddress': 'N',
                        'showP': false,
                        'blueStyle': true
                    })
                });
            }
            this.initUpdateData(this.contactForm);
            // 页面上number类型自动将电话号码的空格去掉了，导致数据前后不一致
            if (this.contactForm.phoneNumbers) {
                this.contactForm.phoneNumbers.forEach(element => {
                    element.phoneNumber = element.phoneNumber.replace(/\s+/g, '');
                });
            }
            this.oldParam = this.copy(this.contactForm);
            if (this.contactForm.name.fullName == undefined) {
                this.contactForm.name.fullName = '';
            }
            if (this.contactForm.name.alphaName == '') {
                this.contactForm.name.fullName = '';
            }
            if (this.contactForm.organization.title == undefined) {
                this.contactForm.organization.title = ''
            }
            // 页面上number类型自动将电话号码的空格去掉了，导致数据前后不一致
            if (this.contactForm.phoneNumbers) {
                this.contactForm.phoneNumbers.forEach(element => {
                    element.phoneNumber = element.phoneNumber.replace(/\s+/g, '');
                });
            }
            this.oldParam = this.copy(this.contactForm);
        }

        if (this.carteFlag) {
            this.isEmpty = false;
            this.contactForm = {
                'emails': this.emails,
                'events': this.events,
                'favorite': false,
                'imAddresses': this.imAddresses,
                'name': this.name,
                'nickName': this.nickName,
                'note': this.note,
                'organization': this.organization,
                'phoneNumbers': this.phoneNumbers,
                'postalAddresses': this.postalAddresses,
                'relations': this.relations,
                'show': false,
                'websites': this.websites
            }
        }

        this.flexInputStyle = 'const-fisrt';
        this.flexImageStyle = 'const-image-div';
        this.flexImageSize = 'fisrt-image';
        this.flexInputSize = 'font-color-first';
        this.flexInputFont = 'font-color-note';
        this.flexCenterSize = 'text-note';
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website': this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    onShow() {
        LOG.info(TAG + 'onShow......');
        this.initGroupData();
        if (this.groups.length > 0) {
            var temp = '';
            if (this.groups.length == 1) {
                temp = this.groups[0].title;
            } else {
                this.groups.forEach(group => {
                    temp = temp + ',' + group.title
                })
                temp = temp.substring(1, temp.length - 1);
            }
            this.groupContext = temp;
            this.isEmpty = false;
        }
    },

    // 初始化组数据
    initGroupData() {
        if (this.$app.$def.globalData.pushToGroup && this.$app.$def.globalData.groupParams) {
            let params = this.$app.$def.globalData.groupParams;
            this.contactId = params.contactId;
            this.contactForm = params.contactForm;
            this.addShow = params.addShow;
            this.updataShow = params.updataShow;
            this.screenDirection = params.screenDirection;
            this.MoreDivStatus = params.MoreDivStatus;
            this.LetterShow = params.LetterShow;
            this.upMessShow = params.upMessShow;
            this.upRingShow = params.upRingShow;
            this.upHouseShow = params.upHouseShow;
            this.upNickShow = params.upNickShow;
            this.upWebShow = params.upWebShow;
            this.upBirthShow = params.upBirthShow;
            this.upAssShow = params.upAssShow;
            this.groups = params.groups;
            this.groupStatus = params.groupStatus;
            this.$app.$def.globalData.pushToGroup = false;
        }
    },

    /**
     * 初始化时更新页面数据
     *
     * @param {Object} contact 联系人数据
     */
    initUpdateData(contact) {
        if (!contact.emails || contact.emails.length == 0) {
            contact.emails = this.emails;
        }
        if (!contact.events || contact.events.length == 0) {
            contact.events = this.events;
        } else {
            if (contact.events[0].eventDate != this.events[0].eventDate) {
                this.birthShow = true;
            }
            this.dealBirthTypes(contact.events, contact);
        }
        if (!contact.imAddresses || contact.imAddresses.length == 0) {
            contact.imAddresses = this.imAddresses;
        }
        if (!contact.phoneNumbers || contact.phoneNumbers.length == 0) {
            contact.phoneNumbers = this.phoneNumbers;
        }
        if (!contact.postalAddresses || contact.postalAddresses.length == 0) {
            contact.postalAddresses = this.postalAddresses;
        }
        if (!contact.relations || contact.relations.length == 0) {
            contact.relations = this.relations;
        }
        if (!contact.websites || contact.websites.length == 0) {
            contact.websites = this.websites;
        }
        if (!contact.name) {
            contact.name = this.name;
        }

        this.initUpdateDatas(contact);
    },
    initUpdateDatas(contact) {
        if (!contact.nickName) {
            contact.nickName = this.nickName;
        }
        if (!contact.note) {
            contact.note = this.note;
        }
        if (!contact.organization) {
            contact.organization = this.organization;
        }

        // 群组返回值拼接页面展示值
        if (!contact.groups || contact.groups.length == 0) {
            contact.groups = this.groups;
        }
        if (contact.groups.length > 0) {
            var temp = '';
            if (contact.groups.length == 1) {
                temp = contact.groups[0].title;
            } else {
                contact.groups.forEach(group => {
                    temp = temp + ',' + group.title
                })

                temp = temp.substring(1, temp.length - 1);
            }
            this.groupContext = temp;
            this.groups = contact.groups;
        }
    },

    onBackPress() {
        if (this.isEmpty) {
            return false;
        }
        this.$element('reset').show();
        return true;
    },

    back() {
        if (!this.isEmpty) {
            this.$element('reset').show();
        } else if (this.updataShow) {
            if (this.updateCard || this.carteFlag) {
                // 如果查询我的名片
                this.getCardDetail(21001);
            } else {
                router.replace({
                    uri: 'pages/contacts/contactDetail/contactDetail',
                    params: {
                        isNewSource: true,
                        contactId: this.contactForm.contactId,
                    }
                })
            }
        } else {
            router.back({
                path: 'pages/navigation/navigation'
            })
        }
    },

    // 拍照
    takePhotos: function () {
        router.push({
            uri: 'pages/contacts/accountants/takephone/takephone',
            params: {}
        });
    },

    /**
     * 处理编辑页面日期
     *
     * @param {Object} events events事件
     * @param {Object} contact 联系人数据
     */
    dealBirthTypes(events, contact) {
        var flagF = false;
        var flagS = false;
        var indexF = 0;
        var indexS = 0;
        for (let index = 0; index < events.length; index++) {
            const element = events[index];
            var dexF = 0;
            if (element.labelId == '3') {
                indexF = index;
                var dexF = this.types.indexOf('3');
                this.types.splice(index, 1);
                this.showF = false;
                flagF = true;
            }
            var dexS = 0;
            if (element.labelId == '2') {
                indexS = index;
                dexS = this.types.indexOf('2');
                this.types.splice(dexS, 1);
                this.showS = false;
                flagS = true;
            }
            if (flagS) {
                if (flagF) {
                    contact.events[indexF].showS = false;
                    contact.events[indexS].showF = false;
                }
            }
        }
    },

    onDestroy() {
        LOG.info(TAG + 'onDestroy' + 'execute accountants onDestroy.');
        this.$app.$def.groups.group = ''
    },

    // 不保存
    anSave() {
        this.$app.$def.setRefreshContacts(false);
        if (this.saveContact) {
            this.$app.$def.dialerStateData.isEditNumber = false;
            this.$app.$def.globalData.navigationType = 0; // 返回时，返回到拨号盘
            this.$app.$def.globalData.menuType = 0;
            router.back({
                path: 'pages/navigation/navigation'
            });
        } else {
            router.back();
        }
    },

    childClicked() {
        this.showWork = true;
    },

    // 自定义弹窗
    showDialog(e) {
        this.DialogStatus = true;
        this.$element('simpledialog').show()
    },

    cancelSchedule(e) {
        // 手机号码自定义
        if (this.labType == '1') {
            this.contactForm.phoneNumbers[this.labId].labelId = this.oldCustomizeLabelId;
        }
        if (this.labType == '2') {
            this.contactForm.emails[this.labId].labelId = this.oldCustomizeLabelId;
        }
        if (this.labType == '3') {
            this.contactForm.imAddresses[this.labId].labelId = this.oldCustomizeLabelId;
        }
        if (this.labType == '4') {
            this.contactForm.postalAddresses[this.labId].labelId = this.oldCustomizeLabelId;
        }
        if (this.labType == '5') {
            this.contactForm.relations[this.labId].labelId = this.oldCustomizeLabelId;
        }
        this.$element('simpledialog').close()
    },

    setSchedule(id) {
        this.$element('simpledialog').close();

        // 手机号码自定义
        if (this.labType == '1' && this.customizeInputValue) {
            this.contactForm.phoneNumbers[this.labId].labelId = '0';
            this.contactForm.phoneNumbers[this.labId].labelName = this.customizeInputValue;
        }

        // email
        if (this.labType == '2' && this.customizeInputValue) {
            this.contactForm.emails[this.labId].labelId = '0';
            this.contactForm.emails[this.labId].labelName = this.customizeInputValue;
        }

        // 即时消息
        if (this.labType == '3' && this.customizeInputValue) {
            this.contactForm.imAddresses[this.labId].labelId = '0';
            this.contactForm.imAddresses[this.labId].labelName = this.customizeInputValue;
        }

        // 自定义住宅地址
        if (this.labType == '4' && this.customizeInputValue) {
            this.contactForm.postalAddresses[this.labId].labelId = '0';
            this.contactForm.postalAddresses[this.labId].labelName = this.customizeInputValue;
        }

        // 自定义关联人
        if (this.labType == '5' && this.customizeInputValue) {
            this.contactForm.relations[this.labId].labelId = '0';
            this.contactForm.relations[this.labId].labelName = this.customizeInputValue;
        }
    },

    /**
     * 自定义标签
     *
     * @param {Object} e event事件
     */
    getLabel(e) {
        if (e.value) {
            this.DialogStatus = false;
            this.customizeInputValue = e.value;
        } else {
            this.DialogStatus = true;
        }
    },

    /**
     * 获取姓名
     *
     * @param {Object} e event事件
     */
    getName(e) {
        this.contactForm.name.fullName = e.value;
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website': this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj)
    },

    /**
     * 获取英文 只支持英文字母^[A-Za-z]+$
     *
     * @param {Object} e event事件
     */
    getLetter(e) {
        var temp = '';
        if (this.langStatus && !this.usStatus) {
            this.contactForm.name.familyNamePhonetic = e.value;
            temp = e.value;
        }
        if (this.usStatus) {
            this.contactForm.name.familyName = e.value;
            this.familyName = e.value;
            temp = this.familyName.concat(this.givenName).concat(this.middleName);
        }
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': temp,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website': this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    /**
     * 获取姓名的中间名
     *
     * @param {Object} e event事件
     */
    getMiddleName(e) {
        this.contactForm.name.middleName = e.value;
        this.middleName = e.value;
        var temp = this.middleName.concat(this.givenName).concat(this.familyName);
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': temp,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website': this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    /**
     * 姓名中的名
     *
     * @param {Object} e event事件
     */
    getGivenName(e) {
        this.contactForm.name.givenName = e.value;
        this.givenName = e.value;
        var temp = this.familyName.concat(this.givenName).concat(this.middleName);
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': temp,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website': this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    // 英文场景出现familyName-姓、 middleName-中间名、 givenName-名
    showEnDiv() {
        if (!this.langStatus) {
            this.letter = this.$t('accountants.surname');
            this.familyNamePhonetic = this.contactForm.name.familyName;
            this.usStatus = true;
        }
    },

    /**
     * 公司
     *
     * @param {Object} e event事件
     */
    getComp(e) {
        this.contactForm.organization.name = e.value;
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website': this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    /**
     * 职位
     *
     * @param {Object} e event事件
     */
    getWork(e) {
        this.contactForm.organization.title = e.value;
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website': this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    /**
     * 电话类型
     *
     * @param {string} labType select组件里切换的类型
     * @param {number} id labelId
     * @param {Object} e event事件
     */
    selectChange(labType, id, e) {
        this.labType = labType;
        var customizeLabelId = '99';
        this.labId = id;
        if (e.newValue == customizeLabelId) {
            if (labType == '1') {
                this.contactForm.phoneNumbers[this.labId].labelId = customizeLabelId;
            }
            if (labType == '2') {
                this.contactForm.emails[this.labId].labelId = customizeLabelId;
            }
            if (labType == '3') {
                this.contactForm.imAddresses[this.labId].labelId = customizeLabelId;
            }
            if (labType == '4') {
                this.contactForm.postalAddresses[this.labId].labelId = customizeLabelId;
            }
            if (labType == '5') {
                this.contactForm.relations[this.labId].labelId = customizeLabelId;
            }
            this.showDialog();
        } else {
            if (labType == '1') {
                this.contactForm.phoneNumbers[this.labId].labelId = e.newValue;
            }
            if (labType == '2') {
                this.contactForm.emails[this.labId].labelId = e.newValue;
            }
            if (labType == '3') {
                this.contactForm.imAddresses[this.labId].labelId = e.newValue;
            }
            if (labType == '4') {
                this.contactForm.postalAddresses[this.labId].labelId = e.newValue;
            }
            if (labType == '5') {
                this.contactForm.relations[this.labId].labelId = e.newValue;
            }
            this.oldCustomizeLabelId = e.newValue;
        }
    },

    /**
     * 电话号码
     *
     * @param {number} id onchange事件带过来的id
     * @param {Object} e event事件
     */
    getPhone: function (id, e) {
        if (e.value) {
            this.phonShow = true;
            this.contactForm.phoneNumbers[id].phoneNumber = e.value;
            this.contactForm.phoneNumbers[id].showP = true;
            if (!this.isInitFirst && this.contactForm.phoneNumbers[id].blueStyle && !this.saveContact) {
                this.contactForm.phoneNumbers[id].blueStyle = false;
            }
            this.isInitFirst = false;
            this.isEmpty = false;
        } else {
            this.contactForm.phoneNumbers[id].showP = false;
            this.contactForm.phoneNumbers[id].phoneNumber = '';
        }
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': e.value,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website': this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    /**
     * 重新输入电话
     *
     * @param {number} id onchange事件带过来的id
     */
    cleanNum(id) {
        let phones = JSON.parse(JSON.stringify(this.contactForm.phoneNumbers));
        if (this.contactForm.phoneNumbers.length > 1) {
            phones.splice(id, 1);
            this.contactForm.phoneNumbers = [];
            setTimeout(() => {
                this.contactForm.phoneNumbers = phones;
            }, 0);
        } else {
            this.contactForm.phoneNumbers[id].showP = false;
            this.contactForm.phoneNumbers[id].phoneNumber = '';
        }
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website': this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        setTimeout(() => {
            this.ListenParam(obj);
        }, 0);
    },

    /**新增多个电话号码*/
    addNumber: function () {
        var i = this.contactForm.phoneNumbers.length;
        this.contactForm.phoneNumbers.push({
            id: i + 1,
            labelId: '2',
            phoneNumber: '',
            showP: true,
        });
    },

    /**添加更多选项*/
    getMore: function () {
        var l = this.bigsize + 600;
        this.bigsize = l;
        this.divSize = l + 'px';
        this.MoreDivStatus = false;
        this.LetterShow = true;
        this.upMessShow = true;
        this.upRingShow = true;
        this.upHouseShow = true;
        this.upNickShow = true;
        this.upWebShow = true;
        this.upBirthShow = true;
        this.upAssShow = true;
    },

    /**
     * 获取邮箱
     *
     * @param {number} id onchange事件带过来的id
     * @param {Object} e event事件
     */
    getEmail: function (id, e) {
        this.contactForm.emails[id].email = '';
        if (e.value) {
            this.isEmpty = false;
            this.emailShow = true;
            this.contactForm.emails[id].email = e.value;
            this.contactForm.emails[id].showP = true;
        } else {
            this.contactForm.emails[id].showP = false;
            this.contactForm.emails[id].email = '';
        }
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': e.value,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website': this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    /**
     * 清除当前Email
     *
     * @param {number} id 当前Email的ID
     */
    cleanEmail(id) {
        if (this.contactForm.emails.length > 1) {
            this.contactForm.emails.splice(id, 1);
        } else {
            var param = {
                value: ''
            };
            this.contactForm.emails[id].showP = false;
            this.contactForm.emails[id].email = '';
        }
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website': this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    /**增加多个邮箱*/
    addEmail: function () {
        var i = this.contactForm.emails.length;
        this.contactForm.emails.push({
            id: i + 1,
            labelId: '1',
            email: '',
            showP: false,
        })
    },

    /**
     * 获取备注
     *
     * @param {Object} e event事件
     */
    getNote(e) {
        this.contactForm.note.noteContent = e.value;
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website': this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    /**
     * 清除消息
     *
     * @param id onchange事件带过来的id
     */
    cleanMessage(id) {
        if (this.contactForm.imAddresses.length > 1) {
            this.contactForm.imAddresses.splice(id, 1);
        } else {
            this.contactForm.imAddresses[id].imAddress = '';
            this.contactForm.imAddresses[id].showP = false;
        }
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website': this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    /**
     * 获取ima及时消息
     *
     * @param {number} id onchange事件带过来的id
     * @param {Object} e event事件
     */
    getMessage: function (id, e) {
        if (e.value) {
            this.isEmpty = false;
            this.messShow = true;
            this.contactForm.imAddresses[id].imAddress = e.value;
            this.contactForm.imAddresses[id].showP = true;
        } else {
            this.contactForm.imAddresses[id].showP = false;
            this.contactForm.imAddresses[id].imAddress = '';
        }
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': e.value,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website': this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    /*新增多条消息**/
    addMess: function () {
        var i = this.contactForm.imAddresses.length;
        this.contactForm.imAddresses.push({
            id: i + 1,
            labelId: '1',
            imAddress: '',
            showP: false,
        })
    },

    /**
     * 获取铃声
     *
     * @param {Object} e event事件
     */
    getRing(e) {
        this.ringText = e.value;
        if (this.ringText.length > 0) {
            this.isEmpty = false;
        }
    },

    /**
     * 获取住宅地址
     *
     * @param {number} id onchange事件带过来的id
     * @param {Object} e event事件
     */
    getHouText: function (id, e) {
        if (e.value.length > 0) {
            this.isEmpty = false;
            this.houseShow = true;
            this.contactForm.postalAddresses[id].postalAddress = e.value;
            this.contactForm.postalAddresses[id].showP = true;
        } else {
            this.contactForm.postalAddresses[id].showP = false;
            this.contactForm.postalAddresses[id].postalAddress = '';
        }
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': e.value,
            'nick': this.contactForm.nickName.nickName,
            'website': this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    /**
     * 获取邮箱
     *
     * @param {number} id 当前需要清除的节点的ID
     */
    cleanHouse(id) {
        if (this.contactForm.postalAddresses.length > 1) {
            this.contactForm.postalAddresses.splice(id, 1);
        } else {
            this.contactForm.postalAddresses[id].postalAddress = '';
            this.contactForm.postalAddresses[id].showP = false;
        }
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website': this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    /**新增多个住宅地址*/
    addHouse() {
        var i = this.contactForm.postalAddresses.length;
        this.contactForm.postalAddresses.push({
            id: i + 1,
            labelId: '1',
            postalAddress: '',
            showP: false,
        })
    },

    /**
     * 获取昵称
     *
     * @param {Object} e event事件
     */
    getNick(e) {
        this.contactForm.nickName.nickName = e.value;
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website': this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    /**
     * 获取网址
     *
     * @param {number} id onchange事件带过来的id
     * @param {Object} e event事件
     */
    getWebsite(id, e) {
        if (e.value) {
            this.contactForm.websites[id].website = e.value;
            this.contactForm.websites[id].showP = true;
            this.websiteShow = true;
        } else {
            this.contactForm.websites[id].website = '';
            this.contactForm.websites[id].showP = false;
        }
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website': e.value,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    /**
     * 清除当前网址
     *
     * @param {number} id 需要清除当前网址的id
     */
    cleanWebsite(id) {
        if (this.contactForm.websites.length > 1) {
            this.contactForm.websites.splice(id, 1);
        } else {
            this.contactForm.websites[id].showP = false;
            this.contactForm.websites[id].website = '';
        }
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website':  this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    /**添加更多网址*/
    addWebsite() {
        var i = this.contactForm.events.length;
        this.contactForm.websites.push({
            id: i + 1,
            website: '',
            showP: false
        })
    },

    /**
     * 获取日期类型
     *
     * @param {number} id onchange事件带过来的id
     * @param {Object} e event事件
     */
    getBirType(id, e) {
        this.contactForm.events[id].labelId = e.newValue;
        if (this.contactForm.events[id].eventDate != this.$t('accountants.date')) {
            if (this.contactForm.events[id].labelId == '3') {
                for (var index = 0; index < this.contactForm.events.length; index++) {
                    this.contactForm.events[index].showF = false;
                }
                this.contactForm.events[id].showF = true;
            }

            if (this.contactForm.events[id].labelId == '2') {
                for (var index = 0; index < this.contactForm.events.length; index++) {
                    this.contactForm.events[index].showS = false;
                }
                this.contactForm.events[id].showS = true;
            }
        }
    },

    /**
     * 获取生日
     *
     * @param {number} id onchange事件带过来的id
     * @param {Object} e event事件
     */
    getBirthText(id, e) {
        var year = e.year;
        this.year = year;
        var month = e.month + 1;
        var day = e.day
        var birthText = year + '-' + month + '-' + day;
        if (birthText.length > 0) {
            this.birthShow = true;
            this.isEmpty = false;
            this.contactForm.events[id].showP = true;
            this.contactForm.events[id].eventDate = birthText;
        }
        for (var index = 0; index < this.contactForm.events.length; index++) {
            if (this.contactForm.events[index].eventDate == this.$t('accountants.date')) {
                this.contactForm.events.splice(index, 1);
            }
        }
        for (var index = 0; index < this.contactForm.events.length; index++) {
            if (this.contactForm.events[index].eventDate != this.$t('accountants.date')) {
                if (this.contactForm.events[index].labelId == '3') {
                    this.contactForm.events[index].showF = true;
                    this.showF = false;
                } else {
                    this.contactForm.events[index].showF = false;
                }
                if (this.contactForm.events[index].labelId == '2') {
                    this.contactForm.events[index].showS = true;
                    this.showS = false;
                } else {
                    this.contactForm.events[index].showS = false;
                }
            }
        }
        for (var index = 0; index < this.contactForm.events.length; index++) {
            if (this.contactForm.events[index].eventDate == this.$t('accountants.date')) {
                this.contactForm.events.splice(index, 1);
            }
        }
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website':  this.contactForm.websites[0].website,
            'birth': birthText,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    /*新增多个重要日期**/
    addBirth: function () {
        var id = this.contactForm.events.length;
        id = id + 1;
        this.contactForm.events.push({
            id: id,
            labelId: 4,
            eventDate: this.$t('accountants.date'),
            showF: this.showF,
            showS: this.showS,
            showP: false
        })
    },

    /**
     * 清除当前的生日日期
     *
     * @param {number} id 需要清除当前的生日日期的id
     */
    cleanBirth(id) {
        if (this.contactForm.events.length > 1) {
            if (this.contactForm.events[id].labelId == '3') {
                this.contactForm.events.splice(id, 1);
                for (var index = 0; index < this.contactForm.events.length; index++) {
                    this.contactForm.events[index].showF = true;
                    this.showF = true;
                }
            } else if (this.contactForm.events[id].labelId == '2') {
                this.contactForm.events.splice(id, 1);
                for (var index = 0; index < this.contactForm.events.length; index++) {
                    this.contactForm.events[index].showS = true;
                    this.showS = true;
                }
            } else {
                this.contactForm.events.splice(id, 1);
            }

        } else {
            this.contactForm.events[id].showP = false;
            this.contactForm.events[id].eventDate = this.$t('accountants.date');
        }

        this.year = '';
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website':  this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    /**
     * 获取更多关系
     *
     * @param {number} id onchange事件带过来的id
     * @param {Object} e event事件
     */
    getAssText(id, e) {
        if (e.value.length > 0) {
            this.isEmpty = false;
            this.assisShow = true;
            this.contactForm.relations[id].relationName = e.value;
            this.contactForm.relations[id].showP = true;
        } else {
            this.contactForm.relations[id].showP = false;
            this.contactForm.relations[id].relationName = '';
        }
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website':  this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    /**
     * 清除当前关系
     *
     * @param {number} id 需要清楚当前关系的id
     */
    cleanAss(id) {
        if (this.contactForm.relations.length > 1) {
            this.contactForm.relations.splice(id, 1);
        } else {
            this.contactForm.relations[id].relationName = '';
            this.contactForm.relations[id].showP = false;
        }
        let obj = {
            'name': this.contactForm.name.fullName,
            'Pname': this.contactForm.name.familyNamePhonetic,
            'company': this.contactForm.organization.name,
            'position': this.contactForm.organization.title,
            'phone': this.contactForm.phoneNumbers[0].phoneNumber,
            'email': this.contactForm.emails[0].email,
            'note': this.contactForm.note.noteContent,
            'mess': this.contactForm.imAddresses[0].imAddress,
            'address': this.contactForm.postalAddresses[0].postalAddress,
            'nick': this.contactForm.nickName.nickName,
            'website':  this.contactForm.websites[0].website,
            'birth': this.year,
            'assistant': this.contactForm.relations[0].relationName,
            'groupContext': this.groupContext
        }
        this.ListenParam(obj);
    },

    /**添加多项*/
    addAss() {
        var id = this.contactForm.relations.length;
        id = id + 1;
        this.contactForm.relations.push({
            id: id,
            labelId: '1',
            relationName: '',
            showP: false,
        })
    },

    // 跳转至群组
    onGroup() {
        this.$app.$def.globalData.pushToGroup = true;
        router.push({
            uri: 'pages/contacts/groups/deleteGroup/deleteGroup',
            params: {
                addContactStatus: true,
                addShow: this.addShow,
                updataShow: this.updataShow,
                contactForm: this.contactForm,
                contactId: this.contactId,
                editGroup: true,
                MoreDivStatus: this.MoreDivStatus,
                LetterShow: this.LetterShow,
                upMessShow: this.upMessShow,
                upRingShow: this.upRingShow,
                upHouseShow: this.upHouseShow,
                upNickShow: this.upNickShow,
                upWebShow: this.upWebShow,
                upBirthShow: this.upBirthShow,
                upAssShow: this.upAssShow,
                groups: this.groups
            },
        });
    },

    /**
     * 将obj对象实现深拷贝
     *
     * @param {Object} obj 联系人的contactForm
     * @return
     */
    copy(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * 监控编辑页面的数据是否变动
     *
     * @param {Array} existData 已经存在的数据
     * @param {Array} newData 滨化后的新数据
     * @param {string} type = 'Object' 定义类型为'Object'
     * @return {Boolean} 返回监控数据是否变化
     */
    isSameData(existData, newData, type = 'Object') {
        if (type == 'Array') {
            if (Object.prototype.toString.call(existData) != '[object Array]' || Object.prototype.toString.call(newData) != '[object Array]') {
                throw new Error('At least one of the inputs not an array');
            }

            if (existData.length != newData.length) {
                return false;
            }
        } else if (!(existData instanceof Object && newData instanceof Object)) {
            throw new Error('At least one of the inputs not an Object');
        } else {
            LOG.info(TAG + 'isSameData' + 'type error.');
        }
        for (const key in existData) {
            if (Object.prototype.hasOwnProperty.call(newData, key)) {
                if (existData[key] instanceof Array && newData[key] instanceof Array) {
                    try {
                        if (!this.isSameData(existData[key], newData[key], 'Array')) {
                            return false;
                        }
                    } catch {
                        return false;
                    }
                } else if (existData[key] instanceof Object && newData[key] instanceof Object) {
                    try {
                        if (!this.isSameData(existData[key], newData[key], 'Object')) {
                            return false;
                        }
                    } catch {
                        return false;
                    }
                } else if (existData[key] != newData[key]) {
                    return false;
                }
            } else {
                return false;
            }
        }
        return true;
    },

    /**
     * 监听所有输入的参数
     *
     * @param {string} name 姓名
     * @param {string} Pname 姓名拼音
     * @param {string} company 公司
     * @param {string} position 职位
     * @param {string} phone 电话号码
     * @param {string} email 邮箱
     * @param {string} note 备注
     * @param {string} mess 即时消息
     * @param {string} address 住宅地址
     * @param {string} nick 昵称
     * @param {string} website 网站
     * @param {string} birth 生日
     * @param {string} assistant 助理
     * @param {string} groupContext 群组
     */


    ListenParam(obj) {
        obj.name = obj.name.trim();
        obj.Pname = obj.Pname.trim();
        obj.company = obj.company.trim();
        obj.position = obj.position.trim();
        obj.phone = obj.phone.trim();
        obj.email = obj.email.trim();
        obj.note = obj.note.trim();
        obj.mess = obj.mess.trim();
        obj.address = obj.address.trim();
        obj.nick = obj.nick.trim();
        obj.website = obj.website.trim();
        obj.address = obj.address.trim();
        obj.birth = obj.birth.trim();
        obj.assistant = obj.assistant.trim();
        obj.groupContext = obj.groupContext.trim();
        if (this.updataShow && !(JSON.stringify(this.oldParam) == '{}')) {
            if (this.isSameData(this.oldParam, this.contactForm, 'Object')) {
                this.isEmpty = true;
                return;
            } else {
                this.isEmpty = false;
            }
        }
        obj.birth = this.contactForm.events[0].eventDate;
        if (obj.birth == this.$t('accountants.date')) {
            obj.birth = '';
        }
        if (this.updateCard) {
            this.isEmpty = false;
        }
        if (obj.name || obj.Pname || obj.company || obj.position || obj.phone || obj.email || obj.note || obj.mess ||
        obj.address || obj.nick || obj.website || obj.birth || obj.assistant || obj.groupContext) {
            this.isEmpty = false;
            this.delCard = false;
        } else if (this.updateCard) {
            this.isEmpty = false;
            this.delCard = true;
        } else {
            this.isEmpty = true;
        }
    },

    // 刪除我的名片
    deleteCard() {
        LOG.info(TAG + 'deleteCard' + 'del contactForm' + this.contactForm);
        var delParams = {};
        delParams.contactId = this.contactForm.contactId;
    },

    /**新增联系人*/
    addAccountants() {
        LOG.info(TAG + 'addAccountants' + 'logMessage addAccountants is start');

        if (this.updateCard && this.delCard) {
            this.deleteCard();
            return;
        }
        var addParams = this.copy(this.contactForm);
        this.listFieldIsNull(addParams.phoneNumbers);
        this.listFieldIsNull(addParams.imAddresses);
        this.listFieldIsNull(addParams.emails);
        this.listFieldIsNull(addParams.postalAddresses);
        this.listFieldIsNull(addParams.relations);
        this.listFieldIsNull(addParams.events);
        this.listFieldIsNull(addParams.websites);
        var that = this;
        if (this.carteFlag) {
            // 增加我的名片信息
            this.addCard(addParams);
        } else if (this.updateCard) {
            // 编辑我的名片
            this.editCard(addParams);
        } else {
            that.addShow ? that.$app.$def.setAddAccount(true) : that.$app.$def.setEditContacts(true);
            if (this.addShow) {
                // 添加联系人
                this.isaddContact(addParams);
            } else {
                // 编辑联系人
                this.updateContact(addParams);
            }
        }
    },
    addCard(addParams) {
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        contactReq.addMyCard(DAHelper, addParams, (contactId) => {
            /* 新建名片完成后，延时跳转到我的名片界面，避免数据同步阻塞问题 */
            setTimeout(() => {
                this.goToMyCard(contactId);
            }, 500);
        });
    },
    editCard(addParams) {
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        contactReq.updateMyCard(DAHelper, addParams, (contactId) => {
            /* 编辑名片完成后，延时跳转到我的名片界面，避免数据同步阻塞问题 */
            setTimeout(() => {
                this.goToMyCard(contactId);
            }, 500);
        });
    },
    updateContact(addParams) {
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        contactReq.updateContact(DAHelper, addParams, (contactId) => {
            /* 插入联系人数据完成后，跳转至联系人详情页面 */
            router.replace({
                uri: 'pages/contacts/contactDetail/contactDetail',
                params: {
                    isNewSource: true,
                    contactId: contactId,
                }
            });
        });
    },
    addContacts(addParams) {
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        contactReq.addContact(DAHelper, addParams, (contactId) => {
            /* 插入联系人数据完成后，跳转至联系人详情页面 */
            router.replace({
                uri: 'pages/contacts/contactDetail/contactDetail',
                params: {
                    isNewSource: true,
                    contactId: contactId,
                }
            });
        });
    },
    isaddContact(addParams) {
        let emails = addParams.emails == '' ? false : true;
        let events = addParams.events == '' ? false : true;
        let imAddresses = addParams.imAddresses == '' ? false : true;
        let fullName = addParams.name.fullName == '' ? false : true;
        let givenName = addParams.name.givenName == '' ? false : true;
        let familyName = addParams.name.familyName == '' ? false : true;
        let middleName = addParams.name.middleName == '' ? false : true;
        let familyNamePhonetic = addParams.name.familyNamePhonetic == '' ? false : true;
        let nickName = addParams.nickName.nickName == '' ? false : true;
        let note = addParams.note.noteContent == '' ? false : true;
        let organizationName = addParams.organization.name == '' ? false : true;
        let organizationTitle = addParams.organization.title == '' ? false : true;
        let phoneNumbers = addParams.phoneNumbers == '' ? false : true;
        let postalAddresses = addParams.postalAddresses == '' ? false : true;
        let relations = addParams.relations == '' ? false : true;
        let websites = addParams.phoneNumbers == '' ? false : true;
        let groups = addParams.groups == '' ? false : true;

        if(!(emails || events || imAddresses || fullName || givenName || familyName || middleName || familyNamePhonetic ||
        nickName || note || organizationName || organizationTitle || phoneNumbers || postalAddresses || relations || websites) && groups){
            Prompt.showToast({
                message: '没有此联系人的其他信息。',
                duration: 2000,
                bottom: '150px'
            });
            router.back();
        } else {
            this.addContacts(addParams);
        }
    },

    /**
     * 删除空数据并且移除labelName字段
     * 
     * @param {Array} field 联系人的某一个数据
     */
    listFieldIsNull: function (field) {
        if (field && field.length > 0) {
            for (var index = field.length - 1;index >= 0; index--) {
                if (!field[index].showP) {
                    field.splice(index, 1);
                }
                if (field[index] && field[index].labelId != '0') {
                    delete field[index].labelName;
                }
            }
        }
    },

    /**
     * 跳转到我的名片
     * 
     * @param {number} contactId 联系人ID
     */
    goToMyCard(contactId) {
        LOG.info(TAG + 'goToMyCard' + 'logMessage goToMyCard start!');
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        contactReq.getCardDetails(DAHelper, contactId, (result) => {
            var contactForm = result.data;
            LOG.info(TAG + 'goToMyCard' + 'logMessage get card details success!');
            router.replace({
                uri: 'pages/contacts/card/card',
                params: {
                    contactForm: contactForm
                }
            });
        });
    }
}