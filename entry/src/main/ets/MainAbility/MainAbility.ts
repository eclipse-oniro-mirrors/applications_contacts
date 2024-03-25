/**
 * Copyright (c) 2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Ability from '@ohos.app.ability.UIAbility'
import Window from '@ohos.window'
import WorkFactory, { WorkerType } from "../workers/WorkFactory";
import { HiLog } from '../../../../../common/src/main/ets/util/HiLog';
import Want from '@ohos.app.ability.Want';
import SimManager from '../feature/sim/SimManager';
import { missedCallManager } from '../feature/missedCall/MissedCallManager';
import PresenterManager from '../presenter/PresenterManager';
import dataShare from '@ohos.data.dataShare';
import settings from '@ohos.settings';
import DataShareHelper from "@ohos.data.dataShare";
const SETTING_TIME_FORMAT_URI ='dataShare:///com.phos.settingsdata/entry/settingsdata/SETTINGSDATA?Proxy=true&key='
settings.data.TIME_FORMAT;
const TAG = 'MainAbility ';

export default class MainAbility extends Ability {
    storage: LocalStorage;
    simManager: SimManager;
    mDataWorker = WorkFactory.getWorker(WorkerType.DataWorker);
    settingDataShareHelper: DataShareHelper.DataShareHelper = null;

    updateBreakpoint(windowWidth: number) {
        let windowWidthVp: number = px2vp(windowWidth);
        let breakpoint: string;
        if (windowWidthVp < 520) {
            breakpoint = 'sm';
        } else if (windowWidthVp < 840) {
            breakpoint = 'md';
        } else {
            breakpoint = 'lg';
        }
        this.storage.setOrCreate('breakpoint', breakpoint);
    }

    onRequest(want: Want, isOnCreate: boolean) {
        if (!want || !want.parameters) {
            return;
        }
        const data: any = want.parameters["missedCallData"];
        const action = want.parameters["action"];
        HiLog.i(TAG, `onRequest action: ${action}`);
        if (action != undefined && data != undefined) {
            missedCallManager.requestMissedCallAction(action, data);
        }
    }

    onCreate(want, launchParam) {
        HiLog.i(TAG, 'Application onCreate start');
        globalThis.isFromOnCreate = true;
        globalThis.context = this.context;
        globalThis.abilityWant = want;
        this.storage = new LocalStorage()
        this.onRequest(want, true);
        this.simManager = new SimManager();
        globalThis.DataWorker = this.mDataWorker;
        globalThis.presenterManager = new PresenterManager(this.context, this.mDataWorker);
        globalThis.presenterManager.onCreate(want);
        this.subscribeTimeFormatChange();
    }

    onNewWant(want, launchParam) {
        HiLog.i(TAG, 'Application onNewWant');
        globalThis.isFromOnCreate = false;
        globalThis.abilityWant = want;
        this.onRequest(want, false);
        globalThis.presenterManager.onNewWant(want);
    }

    subscribeTimeFormatChange(): void{
        HiLog.i(TAG, 'subscribeTimeFormatChange');
        try {
            dataShare.createDataShareHelper(globalThis.context, SETTING_TIME_FORMAT_URI).then((data) => {
                HiLog.i(TAG, 'createDataShareHelper succeed');
                this.settingDataShareHelper = data;
                this.settingDataShareHelper.on("dataChange", SETTING_TIME_FORMAT_URI, () => {
                    let timeFormat = settings.getValueSync(globalThis.context, settings.date.TIME_FORMAT, "24");
                    HiLog.i(TAG, 'refreshTimeFormat: ' + timeFormat);
                    AppStorage.setOrCreate("timeFormat", timeFormat);
                });
            }).catch((err) => {
                HiLog.e(TAG, `createDataShareHelper error: code: ${err.code}, message: ${err.message} `);
            });
        } catch (err) {
            HiLog.e(TAG, `createDataShareHelper error: code: ${err.code}, message: ${err.message} `);
        }
    }

    onDestroy() {
        HiLog.i(TAG, 'Ability onDestroy');
        try {
            if (this.settingDataShareHelper !== null) {
                this.settingDataShareHelper.off("dataChange", SETTING_TIME_FORMAT_URI);
            }
        } catch (err) {
            HiLog.e(TAG, `settingDataShareHelper.off error: code: ${err.code}, message: ${err.message} `);
        }
        this.pageManager.onDestroy();
        this.mDataWorker.close();
    }


    onWindowStageCreate(windowStage: Window.WindowStage) {
        // Main window is created, set main page for this ability
        HiLog.i(TAG, 'Ability onWindowStageCreate');

        Window.getTopWindow(this.context).then((windowObj) => {
            windowObj.getProperties().then((windowProperties) => {
                this.updateBreakpoint(windowProperties.windowRect.width);
            })
            windowObj.on('windowSizeChange', (data) => {
                this.updateBreakpoint(data.width);
            });
        })

        windowStage.loadContent(globalThis.presenterManager ? globalThis.presenterManager.mainUrl : 'pages/index', this.storage, (err, data) => {
            if (err.code) {
                HiLog.e(TAG, 'Failed to load the content. Cause: ' + JSON.stringify(err) ?? '');
                return;
            }
            HiLog.i(TAG, 'Succeeded in loading the content. Data: ' + JSON.stringify(data) ?? '');
        });
    }

    onWindowStageDestroy() {
        // Main window is destroyed, release UI related resources
        HiLog.i(TAG, 'Ability onWindowStageDestroy');
    }

    onForeground() {
        // Ability has brought to foreground
        HiLog.i(TAG, 'Ability onForeground');
        this.simManager.init();
    }

    onBackground() {
        // Ability has back to background
        HiLog.i(TAG, 'Ability onBackground');
        this.simManager.recycle();
    }
}