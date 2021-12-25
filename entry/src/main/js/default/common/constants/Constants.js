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
export default {
    uri: {
        CONTACT_DB_URI: 'dataability:///com.ohos.contactsdataability', // 连接联系人数据库的uri,用于获取联系人数据库DAHelper
        VOICEMAIL_DB_URI: 'dataability:///com.ohos.voicemailability', // 连接语音信箱数据库的uri,用于获取语音信箱数据库DAHelper
        CALLLOG_DB_URI: 'dataability:///com.ohos.calllogability', // 通话记录数据库uri,用于获取通话记录数据库DAHelper
        CONTACTS_URI_PREFIX: 'dataability:///com.ohos.contactsdataability/contacts/', // 查询contacts库各种表uri前缀
        CALLS_URI_PREFIX: 'dataability:///com.ohos.calllogability/calls/', // 查询calls库各种表uri前缀
        VOICEMAIL_URI_PREFIX: 'dataability:///com.ohos.voicemailability/calls/', // 查询voicemail库各种表uri前缀
        SEARCH_CONTACT_URI: 'dataability:///com.ohos.contactsdataability/contacts/search_contact',
        ROW_CONTACTS_URI: 'dataability:///com.ohos.contactsdataability/contacts/raw_contact', // 对row_contacts表操作的uri
        CONTACT_DATA_URI: 'dataability:///com.ohos.contactsdataability/contacts/contact_data', // 对contact_data表操作的uri
        CONTACT_URI: 'dataability:///com.ohos.contactsdataability/contacts/contact',
        CONTACT_TYPE_URI: 'dataability:///com.ohos.contactsdataability/contacts/contact_type',
        GROUPS_URI: 'dataability:///com.ohos.contactsdataability/contacts/groups',
        CALL_LOG_URI: 'dataability:///com.ohos.calllogability/calls/calllog', // 通话记录表操作uri
        PROFILE_ROW_CONTACTS_URI: 'dataability:///com.ohos.contactsdataability/profile/raw_contact', // 我的名片raw_contact表操作uri
        PROFILE_CONTACT_DATA_URI: 'dataability:///com.ohos.contactsdataability/profile/contact_data', // 我的名片contact_data表操作的uri
        VOICEMAIL_URI: 'dataability:///com.ohos.voicemailability/calls/voicemail'
    },
    int: {
        Success: 0,
        Two: 2,
    }
};