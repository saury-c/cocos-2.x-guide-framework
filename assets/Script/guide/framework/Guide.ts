/*
 * @Author: saury
 * @Date: 2021-04-13 11:24:17
 * @Des: 单个引导
 * @Tips: 
 */

import { T_GUIDE_STEP_DATA } from './../entrance/GuideParse';
import { T_GUIDE_ENTRANCE_DATA } from "../entrance/GuideParse";
import { GuideNormalStep } from '../step/GuideNormalStep';
import { GuideStep } from './GuideStep';
import { guideManager } from './GuideManager';
import { GUIDE_PREFIX } from '../config/GuideConfig';

export class Guide {

    /** 单引导步骤数据 */
    data: T_GUIDE_ENTRANCE_DATA;

    /** 是否已经销毁 */
    _destroyed: boolean;

    /** 步进中数据 */
    steping_data: {
        ing: boolean, // 引导运行中
        now: number,  // 当前引导的步长
        break: boolean, // 是否break引导
        cur_step: GuideStep;
    } = {
            ing: false,
            now: 0,
            break: false,
            cur_step: null
        }

    /** 引导初始回调函数 */
    init(data: T_GUIDE_ENTRANCE_DATA) {
        this.data = data;
        this._destroyed = false;
    }

    /** 引导销毁/结束回调函数 - GuideManager.create() 内会继承新增功能 */
    destroy() {
        if (!this._destroyed) {
            this._destroyed = true;
            this.exit();
        }
    }

    /** 强制退出引导 */
    exit() {
        let state = this.steping_data;
        if (!state.ing) return;
        if (state.cur_step) {
            (<GuideStep>state.cur_step).exit();
        }
    }

    /** 触发引导 */
    async enter() {
        let state = this.steping_data;
        if (state.ing) return;
        state.ing = true;
        state.now = 0;
        state.break = false;
        await this.enterStep(this.data.steps);
        state.ing = false;
    }


    private enterStep(data: T_GUIDE_STEP_DATA[]) {
        return new Promise((resolve) => {
            let step: GuideNormalStep = new GuideNormalStep();
            step.exit = () => { // 重写结束函数
                // 销毁mgr里的guide
                this.destroy();
                //
                step._destroyed = true;
                step.onDestroy();
                this.steping_data.cur_step = null;
                resolve(null);
            }
            this.steping_data.cur_step = step;
            step._destroyed = false;
            step.guide = this;
            step.onInit(data);
        })
    }


}