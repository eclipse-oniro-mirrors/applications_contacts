/**
 * @file: 新建联系人model
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

import Utils from '../../default/utils/utils.js';
import ohosDataAbility from '@ohos.data.dataability';
import Constants from '../common/constants/Constants.js';
import LOG from '../utils/ContactsLog.js';
import backgroundColor from '../common/constants/color.js';

// 头像背景默认颜色
var PortraitColor = backgroundColor.Color;
// 头像背景深色颜色
var DetailsBgColor = backgroundColor.detailColor;
var TAG = 'accountantsModel';
export default {

    /**
     * 添加联系人
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} addParams 联系人信息
     * @param {Object} callBack 回调
    */
    addContact: async function (DAHelper, addParams, callBack) {
        // 添加联系人
        var stringValue = {
            'display_name': this.getDisplayName(addParams),
        };
        DAHelper.insert(
            Constants.uri.ROW_CONTACTS_URI,
            stringValue,
        ).then(data => {
            addParams.contactId = data;
            this.dealParam(DAHelper, addParams, false);
            callBack(data);
        }).catch(error => {
            LOG.error(TAG + 'addContact' + 'insert contact error: ' + error);
        });
    },

    /**
     * 编辑联系人
     *
     * @param {Object} addParams 联系人信息
     * @return {string} 联系人姓名
    */
    getDisplayName: function (addParams) {
        let displayName = '';
        if (addParams.name != undefined && addParams.name.fullName.length > 0) {
            displayName = addParams.name.fullName;
        } else if (addParams.name.fullName.length == 0 && addParams.name.familyNamePhonetic.length > 0) {
            displayName = addParams.name.familyNamePhonetic;
        } else if (addParams.hasOwnProperty('organization') && addParams.organization.name.length > 0) {
            displayName = addParams.organization.name;
        } else if (addParams.hasOwnProperty('organization') && addParams.organization.title.length > 0) {
            displayName = addParams.organization.title;
        } else if (addParams.hasOwnProperty('phoneNumbers') && addParams.phoneNumbers.length > 0) {
            displayName = addParams.phoneNumbers[0].phoneNumber;
        } else if (addParams.hasOwnProperty('emails') && addParams.emails.length > 0) {
            displayName = addParams.emails[0].email;
        } else if (addParams.hasOwnProperty('nickName') && addParams.nickName.nickName.length > 0) {
            displayName = addParams.nickName.nickName;
        }
        return displayName;
    },

    /**
     * 将数据转换 存进数据库
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} addParams 联系人信息
     * @param {boolean} isCard 是否为名片信息
    */
    dealParam: function (DAHelper, addParams, isCard) {
        var result = addParams.contactId;
        var uri = isCard ? Constants.uri.PROFILE_CONTACT_DATA_URI : Constants.uri.CONTACT_DATA_URI;
        // vnd.item/name 44
        this.dataContact(addParams, DAHelper, result, uri);
        // vnd.item/organization 41
        this.organizationContact(addParams, DAHelper, result, uri);
        // vnd.item/note 备注 48
        this.noteContact(addParams, DAHelper, result, uri);
        // 电话号码 vnd.item/phone 42
        this.phoneContact(addParams, DAHelper, result, uri);
        // 邮箱  vnd.item/email 38
        this.emailContact(addParams, DAHelper, result, uri);
        // vnd.item/postal_address 地址 45
        this.postalContact(addParams, DAHelper, result, uri);
        // 昵称vnd.item/nickname 40
        this.nickContact(addParams, DAHelper, result, uri);
        // 日期vnd.item/contact_event 49
        this.eventContact(addParams, DAHelper, result, uri);
        // vnd.item/im 即时消息 39
        this.imContact(addParams, DAHelper, result, uri);
        // vnd.item/group_membership 群组
        this.groupsContact(addParams, DAHelper, result, uri);
        // vnd.item/website网址 50
        this.websiteContact(addParams, DAHelper, result, uri);
        // vnd.item/relation 关联人 51
        this.relationsContact(addParams, DAHelper, result, uri);
    },

    /**
     * 联系人姓名存入数据库
     *
     * @param {Object} addParams 联系人信息
     * @param {string} DAHelper 数据库路径
     * @param {string} result 联系人ID
     * @param {string} uri 数据库地址
     */
    dataContact: function (addParams, DAHelper, result, uri) {
        var displayName = '';
        if (addParams.name != undefined && addParams.name.fullName.length > 0) {
            let middleName = addParams.name.middleName == undefined ? '' : addParams.name.middleName;
            displayName = addParams.name.fullName + middleName + addParams.name.givenName;
        } else if ((addParams.name.familyNamePhonetic) != undefined && addParams.name.familyNamePhonetic.length > 0) {
            displayName = addParams.name.familyNamePhonetic;
        }
        if (displayName.length > 0) {
            var dataContact = {
                'raw_contact_id': result,
                'detail_info': displayName,
                'alpha_name': addParams.name.fullName,
                'phonetic_name': addParams.name.familyNamePhonetic,
                'other_lan_last_name': addParams.name.middleName,
                'other_lan_first_name': addParams.name.givenName,
                'content_type': 'name'
            };
            DAHelper.insert(
                uri,
                dataContact
            ).catch(error => {
                LOG.error(TAG + 'dataContact' + 'insert contact error:' + error);
            });
        }
    },

    /**
     * 联系人群组信息存入数据库
     *
     * @param {Object} addParams 联系人信息
     * @param {string} DAHelper 数据库路径
     * @param {string} result 联系人ID
     * @param {string} uri 数据库地址
     */
    organizationContact: function (addParams, DAHelper, result, uri) {
        if (addParams.organization != undefined) {
            var organizationContact = {};
            if (addParams.organization.name.length > 0 || addParams.organization.title.length > 0) {
                organizationContact = {
                    'raw_contact_id': result,
                    'detail_info': addParams.organization.name,
                    'position': addParams.organization.title,
                    'content_type': 'organization'
                };
                DAHelper.insert(
                    uri,
                    organizationContact
                ).catch(error => {
                    LOG.error(TAG + 'organizationContact' + 'insert contact error:' + error);
                });
            }
        }
    },

    /**
     * 联系人备注信息存入数据库
     *
     * @param {Object} addParams 联系人信息
     * @param {string} DAHelper 数据库路径
     * @param {number} result 联系人ID
     * @param {string} uri 数据库地址
     */
    noteContact: function (addParams, DAHelper, result, uri) {
        if (addParams.note != undefined && addParams.note.noteContent.length > 0) {
            var noteContact = {
                'raw_contact_id': result,
                'detail_info': addParams.note.noteContent,
                'content_type': 'note'
            };
            DAHelper.insert(
                uri,
                noteContact
            ).catch(error=>{
                LOG.error(TAG + 'noteContact' + 'insert contact error:' + error);
            });
        }
    },

    /**
     * 联系人手机号信息存入数据库
     *
     * @param {Object} addParams 联系人信息
     * @param {string} DAHelper 数据库路径
     * @param {number} result 联系人ID
     * @param {string} uri 数据库地址
     */
    phoneContact: function (addParams, DAHelper, result, uri) {
        if (addParams.phoneNumbers != undefined && addParams.phoneNumbers.length > 0) {
            addParams.phoneNumbers.forEach(element => {
                var phoneContact = {
                    'raw_contact_id': result,
                    'detail_info': element.phoneNumber,
                    'extend7': element.labelId + '',
                    'custom_data': element.labelName,
                    'content_type': 'phone'
                };
                DAHelper.insert(
                    uri,
                    phoneContact
                ).catch(error => {
                    LOG.error(TAG + 'phoneContact' + 'insert contact error:' + error);
                });
            });
        }
    },

    /**
     * 联系人邮箱信息存入数据库
     *
     * @param {Object} addParams 联系人信息
     * @param {string} DAHelper 数据库路径
     * @param {number} result 联系人ID
     * @param {string} uri 数据库地址
     */
    emailContact: function (addParams, DAHelper, result, uri) {
        if (addParams.emails != undefined && addParams.emails.length > 0) {
            addParams.emails.forEach(element => {
                var emailContact = {
                    'raw_contact_id': result,
                    'detail_info': element.email,
                    'extend7': element.labelId + '',
                    'custom_data': element.labelName,
                    'content_type': 'email'
                };
                DAHelper.insert(
                    uri,
                    emailContact
                ).catch(error => {
                    LOG.error(TAG + 'emailContact' + 'insert contact error:' + error);
                });
            });
        }
    },

    /**
     * 联系人地址信息存入数据库
     *
     * @param {Object} addParams 联系人信息
     * @param {string} DAHelper 数据库路径
     * @param {number} result 联系人ID
     * @param {string} uri 数据库地址
     */
    postalContact: function (addParams, DAHelper, result, uri) {
        if (addParams.postalAddresses != undefined && addParams.postalAddresses.length > 0) {
            addParams.postalAddresses.forEach(element => {
                var postalContact = {
                    'raw_contact_id': result,
                    'detail_info': element.postalAddress,
                    'extend7': element.labelId + '',
                    'custom_data': element.labelName,
                    'content_type': 'postal_address'
                };
                DAHelper.insert(
                    uri,
                    postalContact
                ).catch(error => {
                    LOG.error(TAG + 'postalContact' + 'insert contact error:' + error);
                });
            });
        }
    },

    /**
     * 联系人昵称信息存入数据库
     *
     * @param {Object} addParams 联系人信息
     * @param {string} DAHelper 数据库路径
     * @param {number} result 联系人ID
     * @param {string} uri 数据库地址
     */
    nickContact: function (addParams, DAHelper, result, uri) {
        if (addParams.nickName != undefined && addParams.nickName.nickName.length > 0) {
            var nickContact = {
                'raw_contact_id': result,
                'detail_info': addParams.nickName.nickName,
                'content_type': 'nickname'
            };
            DAHelper.insert(
                uri,
                nickContact
            ).catch(error => {
                LOG.error(TAG + 'nickContact' + 'insert contact error:' + error);
            });
        }
    },

    /**
     * 联系人特殊日期信息存入数据库
     *
     * @param {Object} addParams 联系人信息
     * @param {string} DAHelper 数据库路径
     * @param {number} result 联系人ID
     * @param {string} uri 数据库地址
     */
    eventContact: function (addParams, DAHelper, result, uri) {
        if (addParams.events != undefined && addParams.events.length > 0) {
            addParams.events.forEach(element => {
                var eventContact = {
                    'raw_contact_id': result,
                    'detail_info': element.eventDate,
                    'extend7': element.labelId + '',
                    'content_type': 'contact_event'
                };
                DAHelper.insert(
                    uri,
                    eventContact
                ).catch(error => {
                    LOG.error(TAG + 'eventContact' + 'insert contact error:' + error);
                });
            });
        }
    },

    /**
     * 联系人IMA信息存入数据库
     *
     * @param {Object} addParams 联系人信息
     * @param {string} DAHelper 数据库路径
     * @param {number} result 联系人ID
     * @param {string} uri 数据库地址
     */
    imContact: function (addParams, DAHelper, result, uri) {
        if (addParams.imAddresses != undefined && addParams.imAddresses.length > 0) {
            addParams.imAddresses.forEach(element => {
                var imContact = {
                    'raw_contact_id': result,
                    'detail_info': element.imAddress,
                    'extend7': element.labelId + '',
                    'custom_data': element.labelName,
                    'content_type': 'im'
                };
                DAHelper.insert(
                    uri,
                    imContact
                ).then(data => {
                    LOG.info(TAG + 'imContact' + 'logMessage insert data success! data = ' + data);
                }).catch(error => {
                    LOG.error(TAG + 'imContact' + 'insert contact error:' + error);
                });
            });
        }
    },

    /**
     * 联系人群组信息存入数据库
     *
     * @param {Object} addParams 联系人信息
     * @param {string} DAHelper 数据库路径
     * @param {number} result 联系人ID
     * @param {string} uri 数据库地址
     */
    groupsContact: function (addParams, DAHelper, result, uri) {
        if (addParams.groups != undefined && addParams.groups.length > 0) {
            addParams.groups.forEach(element => {
                var groupsContact = {
                    'raw_contact_id': result,
                    'detail_info': element.groupId,
                    'content_type': 'group_membership'
                };
                DAHelper.insert(
                    uri,
                    groupsContact
                ).then(data => {
                    LOG.info(TAG + 'groupsContact' + 'logMessage insert data success! data = ' + data);
                }).catch(error => {
                    LOG.error(TAG + 'groupsContact' + 'insert contact error:' + error);
                });
            });
        }
    },

    /**
     * 联系人website信息存入数据库
     *
     * @param {Object} addParams 联系人信息
     * @param {string} DAHelper 数据库路径
     * @param {number} result 联系人ID
     * @param {string} uri 数据库地址
     */
    websiteContact: function (addParams, DAHelper, result, uri) {
        if (addParams.websites != undefined && addParams.websites.length > 0) {
            addParams.websites.forEach(element => {
                var websiteContact = {
                    'raw_contact_id': result,
                    'detail_info': element.website,
                    'content_type': 'website'
                };
                DAHelper.insert(
                    uri,
                    websiteContact
                ).then(data => {
                    LOG.info(TAG + 'websiteContact' + 'logMessage insert data success! data = ' + data);
                }).catch(error => {
                    LOG.error(TAG + 'websiteContact' + 'insert contact error:' + error);
                });
            });
        }
    },

    /**
     * 联系人relation信息存入数据库
     *
     * @param {Object} addParams 联系人信息
     * @param {string} DAHelper 数据库路径
     * @param {number} result 联系人ID
     * @param {string} uri 数据库地址
     */
    relationsContact: function (addParams, DAHelper, result, uri) {
        if (addParams.relations != undefined && addParams.relations.length > 0) {
            addParams.relations.forEach(element => {
                var relationsContact = {
                    'raw_contact_id': result,
                    'detail_info': element.relationName,
                    'extend7': element.labelId + '',
                    'custom_data': element.labelName,
                    'content_type': 'relation'
                };
                DAHelper.insert(
                    uri,
                    relationsContact
                ).then(data => {
                    LOG.info(TAG + 'relationsContact' + 'logMessage insert data success! data = ' + data);
                }).catch(error => {
                    LOG.error(TAG + 'relationsContact' + 'insert contact error:' + error);
                });
            });
        }
    },

    /**
     * 处理联系人数据库字段
     *
     * @param {Object} resultSet 结果集
     * @param {Object} contactDetailInfo 联系人详情
     * @param {Object} actionData 联系人信息
     */
    dealResult: function (resultSet, contactDetailInfo, actionData) {
        // 联系人id
        var contactId = resultSet.getString(resultSet.getColumnIndex('contact_id'));
        // 收藏字段
        var favorite = resultSet.getString(resultSet.getColumnIndex('favorite'));
        // 名称最后一个汉字
        var nameSuffix = resultSet.getString(resultSet.getColumnIndex('photo_first_name'));
        // 字段类型
        var typeText = resultSet.getString(resultSet.getColumnIndex('content_type'));
        // 字段值
        var detailInfo = resultSet.getString(resultSet.getColumnIndex('detail_info'));
        // 姓名
        var displayName = resultSet.getString(resultSet.getColumnIndex('display_name'));
        // 姓名
        var alphaName = resultSet.getString(resultSet.getColumnIndex('alpha_name'));
        // 拼音
        var familyNamePhonetic = resultSet.getString(resultSet.getColumnIndex('phonetic_name'));
        // 标签id
        var labelId = resultSet.getString(resultSet.getColumnIndex('extend7'));
        // 自定义标签名
        var labelName = resultSet.getString(resultSet.getColumnIndex('custom_data'));
        labelName = labelName ? labelName : '';
        // 职位
        var position = resultSet.getString(resultSet.getColumnIndex('position'));
        // 是否是默认号码
        var isPrimaryNum = resultSet.getString(resultSet.getColumnIndex('is_preferred_number'));

        contactDetailInfo.emptyNameData = displayName;

        if (favorite == 0) {
            contactDetailInfo.favorite = false;
            contactDetailInfo.starred = 0;
        } else {
            contactDetailInfo.favorite = true;
            contactDetailInfo.starred = 1;
        }
        // 如果是搜索，则将匹配类型传出
        if (!Utils.isEmpty(actionData) && actionData.searchMimetype) {
            if (detailInfo.indexOf(actionData.searchValue) != -1) {
                contactDetailInfo.searchMimetype.push('/' + typeText);
            }
        }
        // 头像里汉字
        contactDetailInfo.nameSuffix = nameSuffix;
        // contactId
        contactDetailInfo.contactId = contactId;
        // 头像颜色
        contactDetailInfo.portraitColor = PortraitColor[contactId % 6];
        // 背景颜色
        contactDetailInfo.detailsBgColor = DetailsBgColor[contactId % 6];
        var dealResultInfo = {
            'contactId': contactId,
            'favorite': favorite,
            'nameSuffix': nameSuffix,
            'typeText': typeText,
            'detailInfo': detailInfo,
            'displayName': displayName,
            'alphaName': alphaName,
            'familyNamePhonetic': familyNamePhonetic,
            'labelId': labelId,
            'labelName': labelName,
            'position': position,
            'isPrimaryNum': isPrimaryNum,
            'contactDetailInfo': contactDetailInfo
        }
        this.switchTypeText(dealResultInfo);
     },

     switchTypeText: function (dealResultInfo) {
         switch (dealResultInfo.typeText) {
             case 'email':
                 var email = {
                     'email': dealResultInfo.detailInfo,
                     'labelId': dealResultInfo.labelId,
                     'labelName': dealResultInfo.labelName,
                     'showP': true
                 };
                 if (dealResultInfo.contactDetailInfo.emails) {
                     dealResultInfo.contactDetailInfo.emails.push(email);
                 } else {
                     dealResultInfo.contactDetailInfo.emails = [email];
                 }
                 break;
             case 'im':
                 var imAddress = {
                     'imAddress': dealResultInfo.detailInfo,
                     'labelId': dealResultInfo.labelId,
                     'labelName': dealResultInfo.labelName,
                     'showP': true
                 };
                 if (dealResultInfo.contactDetailInfo.imAddresses) {
                     dealResultInfo.contactDetailInfo.imAddresses.push(imAddress);
                 } else {
                     dealResultInfo.contactDetailInfo.imAddresses = [imAddress];
                 }
                 break;
             case 'nickname':
                 dealResultInfo.contactDetailInfo.nickName = {
                     'nickName': dealResultInfo.detailInfo
                 };
                 break;
             case 'organization':
                 dealResultInfo.contactDetailInfo.organization = {
                     'name': dealResultInfo.detailInfo,
                     'title': dealResultInfo.position
                 };
                 break;
             case 'phone':
                 var phoneNumber = {
                     'isPrimary': dealResultInfo.isPrimaryNum,
                     'labelId': dealResultInfo.labelId,
                     'labelName': dealResultInfo.labelName,
                     'phoneAddress': 'N',
                     'phoneNumber': dealResultInfo.detailInfo,
                     'showP': true,
                     'blueStyle': false
                 };
                 if (dealResultInfo.contactDetailInfo.phoneNumbers) {
                     dealResultInfo.contactDetailInfo.phoneNumbers.push(phoneNumber);
                 } else {
                     dealResultInfo.contactDetailInfo.phoneNumbers = [phoneNumber];
                 }
                 break;
             case 'name':
                 dealResultInfo.contactDetailInfo.name = {
                     'familyNamePhonetic': dealResultInfo.familyNamePhonetic,
                     'fullName': dealResultInfo.detailInfo,
                     'middleName': '',
                     'givenName': '',
                     'nameSuffix': dealResultInfo.nameSuffix,
                     'alphaName': dealResultInfo.alphaName
                 };
                 break;
             case 'postal_address':
                 var postalAddress = {
                     'labelId': dealResultInfo.labelId,
                     'labelName': dealResultInfo.labelName,
                     'postalAddress': dealResultInfo.detailInfo,
                     'showP': true
                 };
                 if (dealResultInfo.contactDetailInfo.postalAddresses) {
                     dealResultInfo.contactDetailInfo.postalAddresses.push(postalAddress);
                 } else {
                     dealResultInfo.contactDetailInfo.postalAddresses = [postalAddress];
                 }
                 break;
             case 'photo':
                 break;
             case 'group_membership':
                 break;
             case 'note':
                 dealResultInfo.contactDetailInfo.note = {
                     'noteContent': dealResultInfo.detailInfo
                 };
                 break;
             case 'contact_event':
                 var event = {
                     'labelId': dealResultInfo.labelId,
                     'labelName': dealResultInfo.labelName,
                     'eventDate': dealResultInfo.detailInfo,
                     'showP': true,
                     'showF': true,
                     'showS': true
                 };
                 if (dealResultInfo.contactDetailInfo.events) {
                     dealResultInfo.contactDetailInfo.events.push(event);
                 } else {
                     dealResultInfo.contactDetailInfo.events = [event];
                 }
                 break;
             case 'website':
                 var website = {
                     'website': dealResultInfo.detailInfo,
                     'showP': false
                 };
                 if (dealResultInfo.contactDetailInfo.websites) {
                     dealResultInfo.contactDetailInfo.websites.push(website);
                 } else {
                     dealResultInfo.contactDetailInfo.websites = [website];
                 }
                 break;
             case 'relation':
                 var relation = {
                     'labelId': dealResultInfo.labelId,
                     'labelName': dealResultInfo.labelName,
                     'relationName': dealResultInfo.detailInfo,
                     'showP': true
                 };
                 if (dealResultInfo.contactDetailInfo.relations) {
                     dealResultInfo.contactDetailInfo.relations.push(relation);
                 } else {
                     dealResultInfo.contactDetailInfo.relations = [relation];
                 }
                 break;
             default:
                 break;
         }
     },



    /**
     * 创建名片
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} addParams  联系人信息
     * @param {Object} callBack 联系人ID
     */
    addMyCard: function (DAHelper, addParams, callBack) {
        // 添加联系人
        var stringValue = {
            'display_name': '',
        };
        DAHelper.insert(
            Constants.uri.PROFILE_ROW_CONTACTS_URI,
            stringValue,
        ).then(data => {
            addParams.contactId = data;
            this.dealParam(DAHelper, addParams, true);
            callBack(data);
        }).catch(error => {
            LOG.error(TAG + 'addMyCard' + 'insert contact error: ' + error);
        });
    },

    /**
     * 编辑我的名片
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} addParams  联系人信息
     * @param {Object} callBack 联系人ID
     */
    updateMyCard: function (DAHelper, addParams, callBack) {
        var condition = new ohosDataAbility.DataAbilityPredicates();
        condition.equalTo('raw_contact_id', addParams.contactId + '');
        DAHelper.delete(
            Constants.uri.PROFILE_CONTACT_DATA_URI,
            condition,
        ).then(data => {
            this.dealParam(DAHelper, addParams, true);
            callBack(addParams.contactId);
        }).catch(error => {
            LOG.error(TAG + 'updateMyCard' + 'update contact error: ' + error);
        });
    },

    /**
     * 编辑联系人信息
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} addParams  联系人信息
     * @param {Object} callBack 联系人ID
     */
    updateContact: async function (DAHelper, addParams, callBack) {
        var condition = new ohosDataAbility.DataAbilityPredicates();
        condition.equalTo('raw_contact_id', addParams.contactId + '');
        DAHelper.delete(
            Constants.uri.CONTACT_DATA_URI,
            condition,
        ).then(data => {
            this.dealParam(DAHelper, addParams);
            callBack(addParams.contactId);
        }).catch(error=>{
            LOG.error(TAG + 'updateContact' + 'update contact error: ' + error);
        });
    },

    /**
     * 获取我的名片信息
     *
     * @param {string} DAHelper 数据库路径
     * @param {number} contactId  联系人ID
     * @param {Object} callBack 返回联系人data
     */
    getCardDetails: function (DAHelper, contactId, callBack) {
        var resultColumns = [
            'contact_id',
            'favorite',
            'display_name',
            'detail_info',
            'type_id',
            'content_type',
            'alpha_name',
            'position',
            'extend7',
            'custom_data',
            'is_preferred_number',
            'photo_first_name',
            'phonetic_name'
        ];
        var condition = new ohosDataAbility.DataAbilityPredicates();
        if (!Utils.isEmpty(contactId)) {
            condition.equalTo('contact_id', contactId);
        }
        DAHelper.query(Constants.uri.PROFILE_CONTACT_DATA_URI, resultColumns, condition).then(resultSet => {
            var contactDetailInfo = {};
            do {
                this.dealResult(resultSet, contactDetailInfo);
            } while (resultSet.goToNextRow());
            resultSet.close();
            LOG.info(TAG + 'getCardDetails' + ' card contactDetailInfo is ==' + contactDetailInfo);
            var res = {};
            res.data = contactDetailInfo;
            callBack(res);
        }).catch(error => {
            LOG.info(TAG + 'getCardDetails' + 'logMessage get call log error:' + error);
        });
    },

    /**
     * 获取我的名片的contactId,display_name
     *
     * @param {string} DAHelper 数据库路径
     * @param {Object} callBack 返回名片详情
     */
    getMyCardId: function (DAHelper, callBack) {
        var resultColumns = [
            'contact_id',
            'display_name'
        ];
        var condition = new ohosDataAbility.DataAbilityPredicates();
        DAHelper.query(Constants.uri.PROFILE_ROW_CONTACTS_URI, resultColumns, condition).then(resultSet => {
            var cardMainInfo = '';
            if (!Utils.isEmpty(resultSet) && resultSet.rowCount > 0) {
                resultSet.goToFirstRow();
                cardMainInfo = {
                    cardId: resultSet.getString(0),
                    cardName: resultSet.getString(1)
                };
            } else {
                LOG.info(TAG + 'getMyCardId' + 'card info is empty!');
            }
            resultSet.close();
            callBack(cardMainInfo);
        }).catch(error => {
            LOG.info(TAG + 'getMyCardId' + 'logMessage get call log error:' + error);
        });
    }
};