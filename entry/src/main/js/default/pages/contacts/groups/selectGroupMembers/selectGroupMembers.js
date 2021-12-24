/**
 * @file 选择组成员
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
import utils from '../../../../../default/utils/utils.js';
import prompt from '@system.prompt';
import groupReq from '../../../../../default/model/GroupsModel.js';
import LOG from '../../../../utils/ContactsLog.js';
import Constants from '../../../../../default/common/constants/Constants.js';

var TAG = 'selectGroupMembers...:';

const PHONE_ITEM_TYPE = 'phone';
const EMAIL_ITEM_TYPE = 'email';
const NAME_ITEM_TYPE = 'name';
const SEARCH_TYPE_IN_GROUP = 2; // 群组内搜索

/**
 * @file 选择组成员
 */
export default {
    data: {
        page: 0,
        limit: 100, // 一页显示条目数量
        title: '', // 标题
        type: '', // 操作类型
        groupId: 0, // 群组id
        checkedNum: 0, // 已选择联系人数量
        contactsList: [], // 联系人列表
        matchingResults: [], // 搜索结果
        checkedList: [], // 已选中的数据
        phoneNumberLabelNames: [], // 电话号码标签集合
        emailsLabelNames: [], // 邮箱标签集合
        showEmptyPage: false, // 显示空页面
        noMatchingResults: false, // 显示搜索结果为空
        showSelectAll: true, // 全选,
        layoutState: true, // 简洁布局
        showContactList: true, // 显示联系人列表
        showMatchContactsList: false, // 显示搜索结果
        addMemberDisabled: true,
        showPhoneNumber: true, // 是否是展示电话号码
        showEmail: false, // 是否是展示邮箱
        pageParams: '', // 最近联系人参数
        startDate: '', // 最近联系人参数开始时间
        endDate: '', // 最近联系人参数结束时间
        index: ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
        'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '…']
    },
    onInit() {
        LOG.info(TAG + 'onInit success');
        this.phoneNumberLabelNames = [this.$t('accountants.house'), this.$t('accountants.phone'),
        this.$t('accountants.unit'), this.$t('accountants.unit fax'), this.$t('accountants.home fax'),
        this.$t('accountants.pager'), this.$t('accountants.others'), '', '', '', '',
        this.$t('accountants.switchboard')];

        this.emailsLabelNames = [this.$t('accountants.private'), this.$t('accountants.unit'),
        this.$t('accountants.others')];

        this.title = this.$t('value.contacts.groupsPage.noSelect');
        if (this.type == 'sendMsg') {
            this.showPhoneNumber = true;
            this.showEmail = false;
        }

        if (this.type == 'sendEmail') {
            this.showPhoneNumber = false;
            this.showEmail = true;
        }
        this.conciseLayoutInit();

        if (this.type == 'recentContacts') {
            this.getRecentContacts();
        } else {
            this.getGroupMemberList();
        }
    },

    // 简洁布局选项初始化
    conciseLayoutInit: function () {
        let data = this.$app.$def.globalData.storage.getSync('contacts_settings_concise_layout_switch', 'false');
        this.layoutState = data == 'true' ? false : true;
    },

    /**
     * 获取群组列表
     */
    getGroupMemberList: function () {
        let filterItem = '';
        if (this.showPhoneNumber) {
            filterItem = PHONE_ITEM_TYPE;
        }
        if (this.showEmail) {
            filterItem = EMAIL_ITEM_TYPE;
        }
        var actionData = {
            page: this.page,
            limit: this.limit,
            groupId: this.groupId,
            filterItem: filterItem,
            phoneNumberLabelNames: this.phoneNumberLabelNames,
            emailsLabelNames: this.emailsLabelNames
        };
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        groupReq.getGroupMemberList(DAHelper, actionData, result => {
            LOG.info(TAG + 'getGroupMemberList result' + result);
            if (result.code == 0 && result.resultList.length > 0) {
                LOG.info(TAG + 'members count is :' + result.resultList.length);
                result.resultList.forEach((item) => {
                    this.conditionOne(item);
                    this.conditionTwo(item);
                });
                LOG.info(TAG + 'this.contactsList length is :' + this.contactsList.length);
                this.showSelectAll = false;
                this.addMemberDisabled = false;
                this.updateTitle();
            } else if (result.code != 0) {
                prompt.showToast({
                    message: 'Failed to init data.'
                });
            } else {
                LOG.info(TAG + 'contactsList is null.');
            }
            if (this.contactsList.length == 0) {
                this.showEmptyPage = true;
            } else {
                this.showEmptyPage = false;
            }
        });
    },

    conditionOne: function (item) {
        LOG.info(TAG + 'conditionOne item' + item);
        if (this.showPhoneNumber && item.phoneNumbers && item.phoneNumbers.length != 0) {
            let tempContacts = utils.copy(item);
            tempContacts.phoneNumbers.length = 0; // 将电话数组置为空
            item.phoneNumbers.forEach((phoneNumber, index) => {
                phoneNumber.backGroundColor = '#FFFFFF';
                if (index == 0) {
                    this.checkedNum++;
                    phoneNumber.checked = true;
                } else {
                    phoneNumber.checked = false;
                }
                if (this.indexOf(tempContacts.phoneNumbers, phoneNumber.phoneNumber) == -1) {
                    tempContacts.phoneNumbers.push(phoneNumber);
                }
            });
            this.contactsList.push(tempContacts);
        }
    },

    conditionTwo: function (item) {
        LOG.info(TAG + 'conditionTwo item' + item);
        if (this.showEmail && item.emails && item.emails.length != 0) {
            let tempContacts = utils.copy(item);
            tempContacts.emails.length = 0; // 将电话数组置为空
            item.emails.forEach((email, index) => {
                if (index == 0) {
                    this.checkedNum++;
                    email.checked = true;
                } else {
                    email.checked = false;
                }
                if (this.indexOf(tempContacts.emails, email.email) == -1) {
                    tempContacts.emails.push(email);
                }
            });
            this.contactsList.push(tempContacts);
        }
    },

    /**
     * 获取最近联系人列表
     */
    getRecentContacts: function () {
        let filterItem = '';
        if (this.showPhoneNumber) {
            filterItem = PHONE_ITEM_TYPE;
        }
        if (this.showEmail) {
            filterItem = EMAIL_ITEM_TYPE;
        }
        var actionData = {
            page: this.page,
            limit: this.limit,
            filterItem: filterItem,
            endDate: this.endDate,
            startDate: this.startDate,
            phoneNumberLabelNames: this.phoneNumberLabelNames,
            emailsLabelNames: this.emailsLabelNames
        };
        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        groupReq.getRecentContacts(DAHelper, actionData, result => {
            if (result.code == 0 && result.resultList.length > 0) {
                LOG.info(TAG + 'getGroupMemberList members count is :' + result.resultList.length);
                this.setContacts(result);
                this.showSelectAll = false;
                this.addMemberDisabled = false;
                this.updateTitle();
            } else if (result.code != 0) {
                prompt.showToast({
                    message: 'Failed to init data.'
                });
            } else {
                LOG.info(TAG + 'contactsList is null.');
            }
            if (this.contactsList.length == 0) {
                this.showEmptyPage = true;
            } else {
                this.showEmptyPage = false;
            }
        });
    },
    setContacts(result) {
        result.resultList.forEach((item) => {
            if (this.showPhoneNumber && item.phoneNumbers && item.phoneNumbers.length != 0) {
                let tempContacts = utils.copy(item);
                tempContacts.phoneNumbers.length = 0; // 将电话数组置为空
                item.phoneNumbers.forEach((phoneNumber, index) => {
                    phoneNumber.backGroundColor = '#FFFFFF';
                    if (index == 0) {
                        this.checkedNum++;
                        phoneNumber.checked = true;
                    } else {
                        phoneNumber.checked = false;
                    }
                    if (this.indexOf(tempContacts.phoneNumbers, phoneNumber.phoneNumber) == -1) {
                        tempContacts.phoneNumbers.push(phoneNumber);
                    }
                });
                this.contactsList.push(tempContacts);
            }
            if (this.showEmail && item.emails && item.emails.length != 0) {
                let tempContacts = utils.copy(item);
                tempContacts.emails.length = 0; // 将电话数组置为空
                item.emails.forEach((email, index) => {
                    if (index == 0) {
                        this.checkedNum++;
                        email.checked = true;
                    } else {
                        email.checked = false;
                    }
                    if (this.indexOf(tempContacts.emails, email.email) == -1) {
                        tempContacts.emails.push(email);
                    }
                });
                this.contactsList.push(tempContacts);
            }
        });
    },

    clickSearch: function (e) {
        LOG.info(TAG + 'clickSearch e' + e);
        // 搜索输入框
        if (e.text) {
            this.showContactList = false;
            this.showMatchContactsList = true;
            this.searchRequest(e.text);
        } else {
            this.matchingResults = [];
            this.updateOperateButton(this.contactsList);
            this.showContactList = true;
            this.showMatchContactsList = false;
            this.noMatchingResults = false;
        }
    },

    /**
     * 搜索请求后台
     *
     * @param {string} keyText 输入框文本内容
     */
    searchRequest: function (keyText) {
        let searchProperty = [NAME_ITEM_TYPE];
        if (this.showEmail) {
            searchProperty.push(EMAIL_ITEM_TYPE);
        }
        if (this.showPhoneNumber) {
            searchProperty.push(PHONE_ITEM_TYPE);
        }
        var requestData = {
            likeValue: keyText,
            searchType: SEARCH_TYPE_IN_GROUP,
            groupId: this.groupId,
            searchProperty: searchProperty
        };

        var DAHelper = this.$app.$def.getDAHelper(Constants.uri.CONTACT_DB_URI);
        groupReq.searchContacts(DAHelper, requestData, result => {
            this.matchingResults = [];
            if (result.code == 0 && result.contactCount > 0) {
                // 判断如果是已经选中的，则初始化为选中状态
                result.data.forEach((item) => {
                    this.conditionThree(item);
                    this.conditionFour(item);
                });
                this.updateOperateButton(this.matchingResults);
            } else {
                this.matchingResults.length = 0;
                this.showSelectAll = true;
                LOG.error(TAG + 'select contact request error');
            }
            if (this.matchingResults && this.matchingResults.length == 0) {
                this.noMatchingResults = true;
            } else {
                this.noMatchingResults = false;
            }
            LOG.info(TAG + 'select search request  result');
        });
    },

    conditionThree: function (item, keyText) {
        LOG.info(TAG + 'conditionThree item' + item);
        if (this.showPhoneNumber && item.phoneNumbers && item.phoneNumbers.length != 0) {
            let tempContacts = utils.copy(item);
            tempContacts.phoneNumbers = []; // 将电话数组置为空
            item.phoneNumbers.forEach((phoneNumber) => {
                if (this.indexOf(tempContacts.phoneNumbers, phoneNumber.phoneNumber) == -1) {
                    tempContacts.phoneNumbers.push(phoneNumber);
                    phoneNumber.checked = false;
                    phoneNumber.backGroundColor = '#FFFFFF';

                    // 初始化可变名称
                    this.variableName(item, keyText);

                    // 初始化可变手机号
                    this.variablePhoneNumber(item, keyText);
                    this.contactsList.forEach((checkedContact) => {
                        // 如果联系人id一样，则初始化选中状态
                        if (checkedContact.contactId == item.contactId) {
                            checkedContact.phoneNumbers.forEach((checkedPhoneNumber) => {
                                if (checkedPhoneNumber.phoneNumber == phoneNumber.phoneNumber
                                && checkedPhoneNumber.checked) {
                                    phoneNumber.checked = true;
                                }
                            });
                        }
                    });
                }
            });
            this.matchingResults.push(item);
        }
    },

    conditionFour: function (item, keyText) {
        LOG.info(TAG + 'conditionFour item' + item);
        if (this.showEmail && item.emails && item.emails.length != 0) {
            let tempContacts = utils.copy(item);
            tempContacts.emails = []; // 将电话数组置为空
            item.emails.forEach((email) => {
                if (this.indexOf(tempContacts.emails, email.email) == -1) {
                    tempContacts.emails.push(email);
                    email.checked = false;

                    // 初始化可变名称
                    this.variableName(item, keyText);
                    // 初始化可变邮箱号
                    this.variableEmail(item, keyText);

                    this.contactsList.forEach((checkedContact) => {
                        // 如果联系人id一样，则初始化选中状态
                        if (checkedContact.contactId == item.contactId) {
                            checkedContact.emails.forEach((checkedEmail) => {
                                if (checkedEmail.email == email.email && checkedEmail.checked) {
                                    email.checked = true;
                                }
                            });
                        }
                    });
                }
            });
            this.matchingResults.push(item);
        }
    },

    contactItemClick: function (phoneNumIndex, contactItem) {
        LOG.info(TAG + 'contactItemClick contactItem' + contactItem);
        contactItem.phoneNumbers[phoneNumIndex].checked = !contactItem.phoneNumbers[phoneNumIndex].checked;
        if (contactItem.phoneNumbers[phoneNumIndex].checked) {
            this.checkedNum++;
        } else {
            this.checkedNum--;
        }
        this.updateOperateButton(this.contactsList);
        this.updateTitle();
    },
    searchContactItemClick: function (phoneNumIndex, contactItem) {
        LOG.info(TAG + 'searchContactItemClick contactItem' + contactItem);
        contactItem.phoneNumbers[phoneNumIndex].checked = !contactItem.phoneNumbers[phoneNumIndex].checked;
        if (contactItem.phoneNumbers[phoneNumIndex].checked) {
            this.checkedNum++;
        } else {
            this.checkedNum--;
        }
        // 修改contactList数据的选中状态
        this.contactsList.forEach((checkedContact) => {
            // 如果联系人id一样，则初始化选中状态
            if (checkedContact.contactId == contactItem.contactId) {
                checkedContact.phoneNumbers.forEach((checkedPhoneNumber) => {
                    if (checkedPhoneNumber.phoneNumber == contactItem.phoneNumbers[phoneNumIndex].phoneNumber) {
                        checkedPhoneNumber.checked = contactItem.phoneNumbers[phoneNumIndex].checked;
                    }
                });
            }
        });
        this.updateOperateButton(this.matchingResults);
        this.updateTitle();
    },

    /**
     * email选中事件
     *
     * @param {number} emailIndex 邮件索引
     * @param {Object} emailItem 邮件对象
     */
    emailItemClick: function (emailIndex, emailItem) {
        LOG.info(TAG + 'emailItemClick emailIndex' + emailIndex + 'emailItem' + emailItem);
        emailItem.emails[emailIndex].checked = !emailItem.emails[emailIndex].checked;
        if (emailItem.emails[emailIndex].checked) {
            this.checkedNum++;
        } else {
            this.checkedNum--;
        }
        this.updateOperateButton(this.contactsList);
        this.updateTitle();
    },
    searchEmailItemClick: function (emailNumIndex, contactItem) {
        LOG.info(TAG + 'searchEmailItemClick emailNumIndex' + emailNumIndex);
        contactItem.emails[emailNumIndex].checked = !contactItem.emails[emailNumIndex].checked;
        if (contactItem.emails[emailNumIndex].checked) {
            this.checkedNum++;
        } else {
            this.checkedNum--;
        }
        // 修改contactList数据的选中状态
        this.contactsList.forEach((checkedContact) => {
            // 如果联系人id一样，则初始化选中状态
            if (checkedContact.contactId == contactItem.contactId) {
                checkedContact.emails.forEach((checkedEmail) => {
                    if (checkedEmail.email == contactItem.emails[emailNumIndex].email) {
                        checkedEmail.checked = contactItem.emails[emailNumIndex].checked;
                    }
                });
            }
        });
        this.updateOperateButton(this.matchingResults);
        this.updateTitle();
    },

    /**
     * 跳转至发送短信或者邮件界面
     */
    clickAddMember: function () {
        if (this.showPhoneNumber) {
            let checkedList = [];
            this.contactsList.forEach((item) => {
                item.phoneNumbers.forEach((phoneNumber) => {
                    if (phoneNumber.checked) {
                        let obj = {
                            contactsName: item.emptyNameData,
                            telephone: phoneNumber.phoneNumber,
                            telephoneFormat: phoneNumber.phoneNumber,
                            id: item.contactId
                        };
                        checkedList.push(obj);
                    }
                });
            });
            this.$app.$def.sendMessage(checkedList);
        }

        if (this.showEmail) {
            let params = '';
            this.contactsList.forEach((item) => {
                item.emails.forEach((email) => {
                    if (email.checked) {
                        params = email.email + ';';
                    }
                });
            });
            this.sendEmails(params);
        }
    },
    sendEmails: function (emails) {
        var actionData = {};
        actionData.openContent = emails;
    },
    onTouchStart: function (phoneNumber) {
        phoneNumber.backGroundColor = '#FFDDDCDC';
    },
    onTouchMove: function (phoneNumber) {
        phoneNumber.backGroundColor = '#FFFFFF';
    },

    // 更新操作按钮状态
    updateOperateButton: function (contactList) {
        LOG.info(TAG + 'updateOperateButton contactList' + contactList);
        var checkedList = [];
        contactList.forEach((contact) => {
            if (this.showPhoneNumber) {
                for (var i = 0; i < contact.phoneNumbers.length; i++) {
                    if (contact.phoneNumbers[i].checked) {
                        checkedList.push(contact);
                        break;
                    }
                }
            }
            if (this.showEmail) {
                for (var i = 0; i < contact.emails.length; i++) {
                    if (contact.emails[i].checked) {
                        checkedList.push(contact);
                        break;
                    }
                }

            }
        });
        if (checkedList.length == contactList.length) {
            this.showSelectAll = false;
        } else {
            this.showSelectAll = true;
        }
        if (this.checkedNum == 0) {
            this.addMemberDisabled = true;
        } else {
            this.addMemberDisabled = false;
        }
    },

    /**
     * 全选事件
     */
    clickSelectAll: function () {
        var temNum = 0;
        if (this.showMatchContactsList) {
            this.matchingResults.forEach((item) => {
                if (this.showPhoneNumber && !item.phoneNumbers[0].checked) {
                    temNum++;
                    item.phoneNumbers[0].checked = true;
                }
                if (this.showEmail && !item.emails[0].checked) {
                    temNum++;
                    item.emails[0].checked = true;
                }
            });
            this.syncCheckedState();
        }
        if (this.showContactList) {
            this.contactsList.forEach((item) => {
                if (this.showPhoneNumber && !item.phoneNumbers[0].checked) {
                    temNum++;
                    item.phoneNumbers[0].checked = true;
                }
                if (this.showEmail && !item.emails[0].checked) {
                    temNum++;
                    item.emails[0].checked = true;
                }
            });
        }

        this.checkedNum = this.checkedNum + temNum;
        if (this.showMatchContactsList) {
            this.updateOperateButton(this.matchingResults);
        } else {
            this.updateOperateButton(this.contactsList);
        }
        this.updateTitle();
    },

    /**
     * 同步搜索结果的数据状态到联系人列表
     */
    syncCheckedState: function () {
        if (this.showPhoneNumber) {
            for (let i = 0; i < this.contactsList.length; i++) {
                for (let j = 0; j < this.contactsList[i].phoneNumbers.length; j++) {
                    for (let m = 0; m < this.matchingResults.length; m++) {
                        if (this.matchingResults[m].contactId == this.contactsList[i].contactId) {
                            for (let n = 0; n < this.matchingResults[m].phoneNumbers.length; n++) {
                                if (this.matchingResults[m].phoneNumbers[n].phoneNumber
                                == this.contactsList[i].phoneNumbers[j].phoneNumber) {
                                    this.contactsList[i].phoneNumbers[j].checked
                                    = this.matchingResults[m].phoneNumbers[n].checked;
                                    break;
                                }
                            }
                            break;
                        }
                    }
                }
            }
        }
        if (this.showEmail) {
            for (let i = 0; i < this.contactsList.length; i++) {
                for (let j = 0; j < this.contactsList[i].emails.length; j++) {
                    for (let m = 0; m < this.matchingResults.length; m++) {
                        if (this.matchingResults[m].contactId == this.contactsList[i].contactId) {
                            for (let n = 0; n < this.matchingResults[m].emails.length; n++) {
                                if (this.matchingResults[m].emails[n].email == this.contactsList[i].emails[j].email) {
                                    this.contactsList[i].emails[j].checked = this.matchingResults[m].emails[n].checked;
                                    break;
                                }
                            }
                            break;
                        }
                    }
                }
            }
        }
    },

    /**
     * 取消全选事件
     */
    clickCancelSelectAll: function () {
        var temNum = 0;
        if (this.showContactList) {
            this.contactsList.forEach((item) => {
                if (this.showPhoneNumber) {
                    item.phoneNumbers.forEach((phoneNumber) => {
                        if (phoneNumber.checked) {
                            temNum++;
                            phoneNumber.checked = false;
                        }
                    });
                }
                if (this.showEmail) {
                    item.emails.forEach((email) => {
                        if (email.checked) {
                            temNum++;
                            email.checked = false;
                        }
                    });
                }
            });
        }

        if (this.showMatchContactsList) {
            this.matchingResults.forEach((item) => {
                if (this.showPhoneNumber) {
                    item.phoneNumbers.forEach((phoneNumber) => {
                        if (phoneNumber.checked) {
                            temNum++;
                            phoneNumber.checked = false;
                        }
                    });
                }
                if (this.showEmail) {
                    item.emails.forEach((email) => {
                        if (email.checked) {
                            temNum++;
                            email.checked = false;
                        }
                    });
                }
            });
            this.syncCheckedState();
        }

        this.checkedNum = this.checkedNum - temNum;
        if (this.showMatchContactsList) {
            this.updateOperateButton(this.matchingResults);
        } else {
            this.updateOperateButton(this.contactsList);
        }
        this.updateTitle();
    },

    /**
     * 更新标题
     */
    updateTitle: function () {
        if (this.checkedNum != 0) {
            this.title = this.$t('value.contacts.groupsPage.alreadySelect').replace('num', this.checkedNum + '');
        } else {
            this.title = this.$t('value.contacts.groupsPage.noSelect');
        }
    },

    // 返回上层页面
    back: function () {
        router.back();
    },

    indexOf: function (arr, val) {
        LOG.info(TAG + 'indexOf arr' + arr);
        LOG.info(TAG + 'indexOf val' + val);
        for (var i = 0; i < arr.length; i++) {
            if (this.showPhoneNumber && arr[i].phoneNumber == val) {
                return i;
            }
            if (this.showEmail && arr[i].email == val) {
                return i;
            }
        }
        return -1;
    },

    // 初始化可变颜色邮箱号
    variableEmail(item, keyText) {
        LOG.info(TAG + 'variableEmail item' + item);
        for (var i = 0; i < item.emails.length; i++) {
            var email = item.emails[i].email;
            var matchStringEmail = utils.getMatchedString(email, keyText);
            if (utils.isEmpty(matchStringEmail) || utils.isEmpty(keyText.trim())) {
                item.emails[i].startEmail = '';
                item.emails[i].middleEmail = '';
                item.emails[i].endEmail = email;
            } else {
                var emailIndex = email.indexOf(matchStringEmail);
                item.emails[i].startEmail = email.substr(0, emailIndex);
                item.emails[i].middleEmail = email.substr(emailIndex, matchStringEmail.length);
                item.emails[i].endEmail = email.substr(emailIndex + matchStringEmail.length);
            }
        }
    },

    // 初始化可变颜色名称
    variableName(item, keyText) {
        LOG.info(TAG + 'variableName item' + item);
        var matchString = utils.getMatchedString(item.emptyNameData, keyText);
        if (utils.isEmpty(matchString) || utils.isEmpty(keyText.trim())) {
            item.name.searchTextStart = '';
            item.name.searchTextMiddle = '';
            item.name.searchTextEnd = item.emptyNameData;
        } else {
            var name = item.emptyNameData;
            var index = name.indexOf(matchString);
            item.name.searchTextStart = name.substr(0, index);
            item.name.searchTextMiddle = name.substr(index, matchString.length);
            item.name.searchTextEnd = name.substr(index + matchString.length);
        }
    },

    // 初始化可变颜色号码
    variablePhoneNumber(item, keyText) {
        LOG.info(TAG + 'variablePhoneNumber item' + item);
        for (var i = 0; i < item.phoneNumbers.length; i++) {
            var phoneNumber = item.phoneNumbers[i].phoneNumber;
            var matchStringPhone = utils.getMatchedString(phoneNumber, keyText);
            if (utils.isEmpty(matchStringPhone) || utils.isEmpty(keyText.trim())) {
                item.phoneNumbers[i].startPhone = '';
                item.phoneNumbers[i].middlePhone = '';
                item.phoneNumbers[i].endPhone = phoneNumber;
            } else {
                var phoneIndex = phoneNumber.indexOf(matchStringPhone);
                item.phoneNumbers[i].startPhone = phoneNumber.substr(0, phoneIndex);
                item.phoneNumbers[i].middlePhone = phoneNumber.substr(phoneIndex, matchStringPhone.length);
                item.phoneNumbers[i].endPhone = phoneNumber.substr(phoneIndex + matchStringPhone.length);
            }
        }
    }
};
