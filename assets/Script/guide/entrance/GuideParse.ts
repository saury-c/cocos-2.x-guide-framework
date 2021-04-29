/*
 * @Author: saury
 * @Date: 2021-04-12 15:58:00
 * @Des: 引导解析、触发入口
 * @Tips: 
 */

import { GUIDE_PREFIX } from "../config/GuideConfig";
import { guideManager } from "../framework/GuideManager";
import { T_GUIDE_MASK_DATA } from "../step/GuideStepMask";

// json格式 - 方便写代码 - 具体可以去查看 excel 表, 描述的很清楚
type T_GUIDE_JSON = {
    guide_condition,    // "10001,大厅页面无弹窗的情况下,无操作n秒触发"
    guide_count_limit,  // 999999
    guide_depend_id,    // "[1,2]"
    guide_description,  // "大厅无任何页面情况下,监听触发弱引导,点击大厅其中的一个按钮"
    guide_finish_mark,  // 1
    guide_id,           // 10001
    guide_priority,     // 1
    guide_scene,        // 1
    hand_tips_delay_time,// 2
    hand_tips_type,      // 1
    mask_type,           // 1
    seek_node_delay_time,
    seek_node_param,     // "e4,大厅随便一个节点" | "4,大厅幸运转盘按钮"
    seek_node_type,      // 2
    step_guide_delay_time
    step_description,    // "弱引导点击大厅其中一个按钮"
    step_finish_type,    // 1
    step_id,             // 1
    tips_text_content,   // "test text"
    tips_text_position,  // "4"
    step_finish_param,   // 步骤结束方式
}

/** 引导触发场景 1大厅 2游戏 */
export enum E_GUIDE_SCENE {
    HALL = 1,
    GAME = 2,
}
/** 引导完成方式 1点击节点 2事件监听 3点击空白处 */
export enum E_GUIDE_STEP_FINISH_TYPE {
    CLICK_NODE = 1,
    EVENT_MONITOR = 2,
    CLICK_BLANK = 3,
}
/** 节点查找方式 1路径查找 2回调查找 3监听查找 4不需要查找 */
export enum E_GUIDE_STEP_SEEK_NODE_TYPE {
    PATH_FIND = 1,
    CALLBACK_FIND = 2,
    EVENT_MONITOR_FIND = 3,
    NOT_NEED_FIND = 4,
}
/** 提示文本位置 1顶部 2中间 3地板 4跟随节点附近(默认下方, 上下方都不可时则选择下方) */
export enum E_GUIDE_STEP_TIPS_TEXT_POSTION {
    TOP = 1,
    CENTER,
    BOTTOM,
    NODE,
}
/** 手指动画显示方式 1隐藏 2显示 */
export enum E_GUIDE_STEP_HAND_TIPS_TYPE {
    HIDE = 1,
    SHOW,
}
/** mask节点显示方式 1全屏挖空 2节点挖空 3节点挖空+透明遮罩 4全屏透明遮罩 5全屏透明无拦截点击遮罩 */
export enum E_GUIDE_STEP_MASK_TYPE {
    NONE = 1,
    HOLLOW = 2,
    LUCENCY_HOLLOW = 3,
    LUCENCY_FULL_SCENE = 4,
    LUCENCY_NO_INTERCEPT = 5,
}

/** 引导入口数据 - data*/
export type T_GUIDE_ENTRANCE_DATA = {
    guide_id: number,
    guide_des: string,          // 描述
    trigger_scene: E_GUIDE_SCENE, // 触发场景
    guide_count_limit: number,  // 引导触发次数上限
    guide_condition: number,    // 引导特殊触发条件 - 请额外封装key对应的方法!
    guide_depend_id: number[],  // 依赖完成的引导ids
    guide_priority: number,     // 优先级 越小优先级越高 - 用于多个引导可同时触发的情况
    steps: T_GUIDE_STEP_DATA[], // 单引导所有步骤数据
    extra_data?: any;           // 额外数据
}

/** 引导步骤数据 */
export type T_GUIDE_STEP_DATA = {
    guide_id: number,                           // 步骤所属引导id
    trigger_scene: number,                      // 引导触发场景 - 步骤和引导共用
    guide_finish_mark: number,                  // 引导到达这一步会时打记录完成
    step_description: string,                   // 步骤描述
    step_id: number,                            // 步骤id
    step_finish_type: E_GUIDE_STEP_FINISH_TYPE, // 步骤完成方式
    step_finish_param: string,                  // 步骤特殊完成方式的参数 - any,des
    seek_node_delay_time: number,               // 延迟查找节点时间 - 默认0
    seek_node_type: E_GUIDE_STEP_SEEK_NODE_TYPE,// 步骤节点查找方式
    seek_node_param: string,                    // 步骤节点查找参数 - num,desctipt <=> 1,大厅开始节点
    step_guide_delay_time: number,              // 延迟引导时间 - 默认0
    tips_text_content: string,                  // 提示文本内容
    tips_text_position: E_GUIDE_STEP_TIPS_TEXT_POSTION, // 提示文本布局位置
    hand_tips_type: E_GUIDE_STEP_HAND_TIPS_TYPE,// 手指动画显示类型
    hand_tips_delay_time: number,               // 手指动画延迟显示时间 - 单位秒
    mask_type: E_GUIDE_STEP_MASK_TYPE,          // 遮罩类型
    // extra - 以下为运行中数据,非json配置
    custom_ui?: T_GUIDE_MASK_DATA;              // mask遮罩数据
}

export class GuideParse {

    private static JsonURL = "guide";

    private constructor() { }
    private static _guideParse: GuideParse;
    static INSTANCE: () => GuideParse = () => {
        if (!GuideParse._guideParse) {
            GuideParse._guideParse = new GuideParse();
        }
        return GuideParse._guideParse;
    }

    /** 引导 - id对应入口数据 */
    private entranceMap: Map<string, T_GUIDE_ENTRANCE_DATA> = new Map();

    async initAllGuide() {
        if (this.entranceMap.size != 0) { return; }

        let json: T_GUIDE_JSON[] = await new Promise((resolve) => {
            cc.loader.loadRes(GuideParse.JsonURL, (err, temp) => {
                resolve(temp && temp.json);
            });
        })

        // 分组所属同一id下的单引导步骤 - 这个是工具人步骤
        let guideArr: { [t: number]: T_GUIDE_JSON[] } = {};
        for (const v of json) {
            if (!guideArr[v.guide_id]) { guideArr[v.guide_id] = []; }
            guideArr[v.guide_id].push(v);
        }

        // 处理所有单引导 - 统计划分每个引导下的所有步骤
        for (const id in guideArr) {
            let stepsJson: T_GUIDE_JSON[] = guideArr[id];   // 一个引导的所有步骤

            // 所有引导步骤
            let steps: T_GUIDE_STEP_DATA[] = [];
            for (const v of stepsJson) {
                let temp: T_GUIDE_STEP_DATA = { // 个别数据带默认值
                    guide_id: v.guide_id,
                    trigger_scene: v.guide_scene,
                    guide_finish_mark: v.guide_finish_mark,
                    step_description: v.step_description,
                    step_id: v.step_id,
                    step_finish_type: v.step_finish_type == null ? E_GUIDE_STEP_FINISH_TYPE.CLICK_BLANK : v.step_finish_type,
                    step_finish_param: v.step_finish_param,
                    seek_node_delay_time: (v.seek_node_delay_time == null || v.seek_node_delay_time == "") ? 0 : v.seek_node_delay_time,
                    seek_node_type: v.seek_node_type == null ? E_GUIDE_STEP_SEEK_NODE_TYPE.NOT_NEED_FIND : v.seek_node_type,
                    seek_node_param: v.seek_node_param,
                    step_guide_delay_time: (v.step_guide_delay_time == null || v.step_guide_delay_time == "") ? 0 : v.step_guide_delay_time,
                    tips_text_content: v.tips_text_content,
                    tips_text_position: v.tips_text_position == null ? E_GUIDE_STEP_TIPS_TEXT_POSTION.CENTER : v.tips_text_position,
                    hand_tips_type: v.hand_tips_type == null ? E_GUIDE_STEP_HAND_TIPS_TYPE.HIDE : v.hand_tips_type,
                    hand_tips_delay_time: v.hand_tips_delay_time == null ? 0 : v.hand_tips_delay_time,
                    mask_type: v.mask_type == null ? E_GUIDE_STEP_MASK_TYPE.NONE : v.mask_type,
                };
                steps.push(temp);
            }

            // 引导相关数据取第一项 - excel配置
            let guideCfg = stepsJson[0];
            let guideId = +guideCfg.guide_id;
            let guideDes = guideCfg.guide_description;
            let guideCountLimit = (guideCfg.guide_count_limit == null || guideCfg.guide_count_limit == "") ? 1 : guideCfg.guide_count_limit;
            let guideDenpendIds = (guideCfg.guide_depend_id == null || guideCfg.guide_depend_id == "") ? [] : JSON.parse(guideCfg.guide_depend_id);
            let guideCondition = guideCfg.guide_condition;  // 可以为null
            let triggerScene = guideCfg.guide_scene;        // 必填!
            let guidePriority = guideCfg.guide_priority;    // 可以为null
            if (triggerScene == null) { console.error("引导触发场景有误", id, stepsJson); }

            //
            let guide: T_GUIDE_ENTRANCE_DATA = {
                guide_id: guideId,
                guide_des: guideDes,
                trigger_scene: triggerScene,
                guide_count_limit: guideCountLimit,
                guide_condition: guideCondition,
                guide_depend_id: guideDenpendIds,
                guide_priority: guidePriority,
                steps,
            }
            this.entranceMap.set(GUIDE_PREFIX + guide.guide_id, guide);
        }
    }

    private getEntranceVal(key: number) {
        return this.entranceMap.get(GUIDE_PREFIX + key);
    }

    async testtest(key) {
        await GuideParse._guideParse.initAllGuide();
        this.enterGuide(key);
    }

    /** 开始单个引导~ */
    private async enterGuide(key: number) {
        let data = this.getEntranceVal(key);
        await guideManager.create(GUIDE_PREFIX + key, data);
        await guideManager.enter(GUIDE_PREFIX + key);
    }

    /** 获取当前存储的引导值 */
    private getGuideStorage() {
        let data = cc.sys.localStorage.getItem(GUIDE_PREFIX);
        if (data instanceof Array && data.length < 1) { return null; }
        if (data != null) { return JSON.parse(data) }
        return {};
    }

    /** 存储单引导一次完成 */
    public setGuideStorage(key) {
        let obj = this.getGuideStorage() || {};
        obj[GUIDE_PREFIX + key] = obj[GUIDE_PREFIX + key] == null ? 1 : ++obj[GUIDE_PREFIX + key];
        cc.sys.localStorage.setItem(GUIDE_PREFIX, JSON.stringify(obj));

        // 如果当前已记录的引导数量为所有引导数
        let doneGuideArr = Object.keys(obj).map(i => { return obj[i] });
        if (doneGuideArr.length == this.entranceMap.size) {
            // 发起请求, 记录新手引导完成
            console.warn("所有引导完成");
            // Global.GuideData.isFinish = true;
            // HallMsgMgr.recoredFinishGuide();
        }
    }

    /** 清除引导存储数据 */
    public clearAllGuideStorage() {
        cc.sys.localStorage.removeItem(GUIDE_PREFIX);
    }

    /** 可以引导，说明其他功能都不能开！ */
    async isCanGuide() {
        await this.initAllGuide();
        let isGuiding = this.isGuiding();
        if (isGuiding) { return true; }
        let guide = this.getCanRunGuide();
        if (guide) { return true; }
        return false;
    }

    /** 是否在引导中 */
    private isGuiding(): boolean {
        return guideManager.guides.size != 0;
    }

    /**
     * 0 引导已完成
     * 1 在引导中着不触发
     * 2 判断当前引导入口对应的场景
     * 3 获取所有可以运行在场景的引导
     * 4 过滤可以可运行引导 - 过滤参数:是否到达运行次数限制, 前置依赖引导是否已完成(先不操作, 按照id顺序来运行)
     * 5 按照引导优先级排序
     * 6 返回引导数组
     */
    private getCanRunGuide(): T_GUIDE_ENTRANCE_DATA {
        // 引导已完成
        // 在引导中着不触发
        if (this.isGuiding()) { return; }

        // 判断当前引导入口对应的场景 
        let guideArr: T_GUIDE_ENTRANCE_DATA[] = [];
        this.entranceMap.forEach((v, k) => {
            // TODO
            // 判断是否在对应场景, 需要自行判断是否为对应场景 => v.trigger_scene == E_GUIDE_SCENE.HALL
            guideArr.push(v);
        })

        // 拿到所有在对应场景可触发的引导后, 再过滤一遍
        let localStorage = this.getGuideStorage();
        guideArr = guideArr.filter(v => {
            // 过滤超出次数限制的
            if (localStorage[GUIDE_PREFIX + v.guide_id] != null && localStorage[GUIDE_PREFIX + v.guide_id] >= v.guide_count_limit) {
                return false;
            }
            // 过滤依赖父引导未完成的引导
            let hasUndoneGuide = false;
            for (const depend_id of v.guide_depend_id) {
                // 获取依赖的父引导项
                let guide = this.getEntranceVal(depend_id);
                // 依赖的父引导未完成, 该引导不能触发！
                if (localStorage[GUIDE_PREFIX + guide.guide_id] != null && localStorage[GUIDE_PREFIX + guide.guide_id] < guide.guide_count_limit) {
                    hasUndoneGuide = true;
                    break;
                }
            }
            if (hasUndoneGuide) { return false; }

            // 
            return true;
        });

        // 按优先级排序 ... 暂未实现
        // TODO

        //
        return guideArr && guideArr[0];
    }

    /** 运行所有常规引导 */
    private async runNormalGuide() {
        /** 运行所有常规引导 */
        // 是否有引导
        let guide: T_GUIDE_ENTRANCE_DATA = this.getCanRunGuide();
        if (!guide) { return; }
        // 是否在引导对应场景 ...

        // 运行引导
        await this.enterGuide(guide.guide_id);
        // 递归开启下一次引导 - 为什么要递归: 如果 B 引导依赖 A 引导, 只有在 A 引导记录完成后, 此时 B 引导才可以运行, 所以不能一开始就直接获取所有可运行引导, 应当按照运行过程来获取开启对应引导. (在一开始就获取可以运行的引导,除非你去计算是否有依赖引导,且依赖引导完成限制次数后能否开启本引导,这样太麻烦了,递归直接就可以解决该问题)
        await this.runNormalGuide();
    }

    async runGuide() {
        await GuideParse._guideParse.initAllGuide();
        //
        this.runNormalGuide();
    }

}


window["guideParse"] = GuideParse.INSTANCE();
