/*
 * @Author: saury
 * @Date: 2021-04-13 15:57:57
 * @Des: 公用引导步骤
 * @Tips:
 * 引导主要分为 查找 + 执行
 *      查找: 查找/监听获取对应节点 or 不做任何处理
 *      执行: 点击对应节点结束一个步骤 or 监听某个条件结束一个步骤
 */

import { GUIDE_CFG_FINISH_EVENT, GUIDE_CFG_NODE_EVENT, GUIDE_CFG_NODE_PATH } from "../config/GuideConfig";
import { E_GUIDE_STEP_FINISH_TYPE, E_GUIDE_STEP_MASK_TYPE, E_GUIDE_STEP_SEEK_NODE_TYPE, GuideParse, T_GUIDE_STEP_DATA } from "../entrance/GuideParse";
import { GuideStep } from "../framework/GuideStep";
import GuideNormalStepUI from "./GuideNormalStepUI";
export class GuideNormalStep extends GuideStep {

    /** 该 UI 预制体路径 */
    private static PrefabURL = "guide_step";

    /** 预制体实例 - 销毁时释放 */
    private prefab: cc.Prefab;

    private scheduleTemp: cc.Component; // 计时器

    /** UI */
    private ui: GuideNormalStepUI;

    /** 对应数据 */
    private data: T_GUIDE_STEP_DATA[];

    /** 等待中的 promise 的 resolve 函数 */
    private promises: Function[];

    /** 目标节点 */
    private target: cc.Node;

    // 多场景使用!
    private eventSceneLoading;
    private eventSceneLaunch;

    async onInit(data: T_GUIDE_STEP_DATA[]): Promise<void> {
        window["guideNormalStep"] = this;

        this.data = data;
        this.promises = [];
        // 临时计时器 - v2.x 可以使用 cc.director.getScheduler()
        let timerNode = cc.director.getScene().getChildByName("timerNode");
        if (!timerNode) {
            timerNode = new cc.Node("timerNode")
            cc.game.addPersistRootNode(timerNode)
            this.scheduleTemp = timerNode.addComponent(cc.Widget);;
        }
        this.scheduleTemp = timerNode.getComponent(cc.Widget);;

        // 实例化UI
        this.prefab = await new Promise((resolve) => {
            cc.loader.loadRes(GuideNormalStep.PrefabURL, (err, temp) => {
                resolve(temp);
            });
        });
        let node = cc.instantiate(this.prefab);
        cc.game.addPersistRootNode(node);
        this.ui = node.getComponent(GuideNormalStepUI);
        this.removeNode(this.ui.node);  // 刷新节点层级
        this.showNode(this.ui.node);

        // 中断检测
        if (this._destroyed) { return; }

        // 多场景使用!
        cc.director.on(cc.Director.EVENT_BEFORE_SCENE_LOADING, this.eventSceneLoading = () => {
            this.removeNode(this.ui.node);
        })
        cc.director.on(cc.Director.EVENT_AFTER_SCENE_LAUNCH, this.eventSceneLaunch = () => {
            if (!cc.isValid(this.ui.node)) { return; }
            this.showNode(this.ui.node);
        })

        // 顺序引导 targets
        this.runningStepGuide();
    }

    onDestroy() {
        cc.director.off(cc.Director.EVENT_BEFORE_SCENE_LOADING, this.eventSceneLoading);
        cc.director.off(cc.Director.EVENT_AFTER_SCENE_LAUNCH, this.eventSceneLaunch);

        if (this.prefab) {
            cc.loader.release(this.prefab);
        }
        if (this.ui.node) {
            this.destroyNode(this.ui.node);
        }
        if (this.target) {
            this.target.targetOff(this);
        }
        if (this.promises.length != 0) {
            for (const resolve of this.promises) {
                resolve(1);
            }
            this.promises.length = 0;
        }
        this.target = null;
        this.scheduleTemp.unscheduleAllCallbacks();
    }

    // 💖
    /** 运行引导 */
    private async runningStepGuide() {
        let i = -1;
        for (const data of this.data) {
            ++i;
            console.log("%c 当前引导数据", "%color:#333360;%background:black", i, data);

            this.clearGuideUI();    // 默认清除所有引导

            this.ui.hold(true)  // 查找过程中, 开启全屏遮挡
            await this.holdTime(data.seek_node_delay_time);   // 延迟查找节点
            if (this._destroyed) { return; }        // 中断检测

            let haveNode = await this.waitNode(data);// 等待节点出现 (查找节点)
            this.recordGuideDone(i, data);           // 新手引导完成, 一次记录
            if (!haveNode) {                         // 是否为跳过步骤(找不到节点, 则为跳过步骤)
                console.warn("找不到节点, 跳过引导步骤", data);
                this.ui.hold(false);
                continue;
            }
            if (this._destroyed) { return; }        // 中断检测

            await this.holdTime(data.step_guide_delay_time);   // 延迟开启引导
            this.ui.hold(false);
            if (this._destroyed) { return; }        // 中断检测

            await this.waitGuide(data, i);        // 开启引导 (引导中...)
            if (this._destroyed) { return; }        // 中断检测
        }

        this.exit();                // 在 Guide 中实现
    }

    // 引导完成 - 上报给服务端
    private recordGuideDone(index, data: T_GUIDE_STEP_DATA) {
        if (data.guide_finish_mark || index == this.data.length - 1) {
            GuideParse.INSTANCE().setGuideStorage(data.guide_id);
        }
    }

    private holdTime(t: number) {
        if (t <= 0) { return () => { }; }
        return new Promise((resolve) => {
            this.scheduleTemp.scheduleOnce(resolve, t);
        })
    }

    // 💖
    /**
     * @description: 查找节点
     * @param {T_GUIDE_STEP_DATA} data 
     * @return {Promise<boolean>}
     */
    private waitNode(data: T_GUIDE_STEP_DATA): Promise<boolean> {
        this.target = null;

        return new Promise(async (resolve) => {
            let node: cc.Node;
            switch (data.seek_node_type) {
                case E_GUIDE_STEP_SEEK_NODE_TYPE.PATH_FIND:
                    node = await this.findNodeByPath(data);
                    break;
                case E_GUIDE_STEP_SEEK_NODE_TYPE.CALLBACK_FIND:
                    node = await this.findNodeByCallback(data);
                    break;
                case E_GUIDE_STEP_SEEK_NODE_TYPE.CALLBACK_FIND:
                    // TODO
                    break;
                case E_GUIDE_STEP_SEEK_NODE_TYPE.NOT_NEED_FIND:
                    break;
                default:
                    break;
            }

            if (node) {
                this.target = node;
                data.custom_ui = {
                    width: node.width,
                    height: node.height
                }
            }

            this.promises.push(resolve);
            setTimeout(() => {
                resolve(true);
            }, 200);
        });
    }

    /** 查找节点 - 路径 */
    private findNodeByPath(data: T_GUIDE_STEP_DATA): Promise<cc.Node> {
        let pathKey = data.seek_node_param.split(",")[0];
        let path = GUIDE_CFG_NODE_PATH[pathKey] && GUIDE_CFG_NODE_PATH[pathKey].path;
        if (!path) {
            console.error("新手引导path路径配置有误!!!");
            return;
        }

        return new Promise((resolve) => {
            let findFoo = () => {
                let node: cc.Node = cc.find(path);
                if (node) {
                    this.scheduleTemp.unschedule(findFoo);
                    resolve(node);
                }
            }
            this.scheduleTemp.schedule(findFoo, 0.2);
        })
    }

    /** 查找结点 - 回调事件 */
    private findNodeByCallback(data: T_GUIDE_STEP_DATA): Promise<cc.Node> {
        let pathKey = data.seek_node_param.split(",")[0];
        let callback = GUIDE_CFG_NODE_EVENT[pathKey] && GUIDE_CFG_NODE_EVENT[pathKey].callback;
        return new Promise((resolve) => {
            let findFoo = () => {
                let node: cc.Node = callback();
                if (node) {
                    this.scheduleTemp.unschedule(findFoo);
                    resolve(node);
                }
            }
            this.scheduleTemp.schedule(findFoo, 0.2);
        })
    }

    // 💖
    /**
     * @description: 执行对应引导步骤
     * @param {T_GUIDE_STEP_DATA} data
     * @param {number} index
     * @return {Promise<void>}
     */
    private waitGuide(data: T_GUIDE_STEP_DATA, index: number): Promise<void> {
        return new Promise((resolve) => {
            this.ui.hold(true);

            // step节点大小刷新
            this.refreshStepUI();
            // 初始化显示的UI、节点跟随
            this.createMaskUI(data);
            this.createTipsTextUI(data);
            this.createTipsHandUI(data);
            // 计时器
            let timer = this.scheduleTargetFollow(data);
            // 当前步骤结束方式
            this.createGuideFinish(data, () => {
                this.unscheduleTargetFollow(timer); // 取消计时器
                resolve()
            });

            this.ui.hold(false);
        });
    }

    private refreshStepUI() {
        this.removeNode(this.ui.node);  // 刷新节点层级
        this.showNode(this.ui.node);
        this.ui.node.getComponent(cc.Widget).updateAlignment();
        this.ui.hollow_mask.refreshMaskWidget();
    }

    /** 遮罩ui */
    private createMaskUI(data: T_GUIDE_STEP_DATA): void {
        this.ui.hollow_mask.activInterceptComponent(true);
        // 全屏挖空遮罩,无任何遮挡
        if (data.mask_type == E_GUIDE_STEP_MASK_TYPE.NONE) {
            let size = cc.winSize;
            this.ui.hollow_mask.initMaskOpacity(0);
            this.ui.hollow_mask.showMask(this.ui.node, { width: size.width, height: size.height }, false);
            data.custom_ui = {
                width: size.width,
                height: size.height
            }
            console.log("空遮罩")
            return;
        }
        // 挖空遮罩
        if (data.mask_type == E_GUIDE_STEP_MASK_TYPE.HOLLOW) {
            if (!this.target) { console.warn("遮罩节点不存在!"); return; }
            this.ui.hollow_mask.initMaskOpacity(0);
            this.ui.hollow_mask.showMask(this.target, data.custom_ui, true);
            console.log("挖空遮罩")
            return;
        }
        // 挖空遮罩,透明版
        if (data.mask_type == E_GUIDE_STEP_MASK_TYPE.LUCENCY_HOLLOW) {
            if (!this.target) { console.warn("遮罩节点不存在!"); return; }
            this.ui.hollow_mask.initMaskOpacity(0);
            this.ui.hollow_mask.showMask(this.target, data.custom_ui, false);
            console.log("挖空遮罩 - 透明版")
            return;
        }
        // 全屏遮罩,透明版
        if (data.mask_type == E_GUIDE_STEP_MASK_TYPE.LUCENCY_FULL_SCENE) {
            this.ui.hollow_mask.initMaskOpacity(0);
            this.ui.hollow_mask.showMask(this.ui.node, { width: 0, height: 0 }, false);
            data.custom_ui = {
                width: 0,
                height: 0
            }
            console.log("全屏遮罩 - 透明");
            return;
        }
        // 全屏遮罩,透明版,无拦截点击版
        if (data.mask_type == E_GUIDE_STEP_MASK_TYPE.LUCENCY_NO_INTERCEPT) {
            this.ui.hollow_mask.initMaskOpacity(0);
            this.ui.hollow_mask.showMask(this.ui.node, { width: 0, height: 0 }, false);
            this.ui.hollow_mask.activInterceptComponent(false);
            data.custom_ui = {
                width: 0,
                height: 0,
            }
            console.log("全屏遮罩 - 透明、无拦截");
            return;
        }
    }

    /** 文本ui */
    private createTipsTextUI(data: T_GUIDE_STEP_DATA): void {
        if (!data.tips_text_content) {
            this.ui.text_tips.isShow(false);
            return;
        }
        this.ui.text_tips.setStr({ str: data.tips_text_content, pos: data.tips_text_position, targetNode: this.target });
    }

    /** 手指动画ui */
    private createTipsHandUI(data: T_GUIDE_STEP_DATA): void {
        if (data.hand_tips_delay_time == 0) {
            this.ui.hand_tips.showHand({ targetNode: this.target, type: data.hand_tips_type })
            return;
        }
        // 延迟显示
        let foo;
        this.scheduleTemp.schedule(foo = () => {
            this.scheduleTemp.unschedule(foo);
            this.ui.hand_tips.showHand({ targetNode: this.target, type: data.hand_tips_type })
        }, data.hand_tips_delay_time);
    }

    /** 计时器 - 跟随节点 */
    private scheduleTargetFollow(data: T_GUIDE_STEP_DATA): Function {
        if (!cc.isValid(this.target)) { return; }
        let foo;
        let noFollowType = [E_GUIDE_STEP_MASK_TYPE.HOLLOW, E_GUIDE_STEP_MASK_TYPE.LUCENCY_HOLLOW];  // 挖空的遮罩才需要跟随
        this.scheduleTemp.schedule(foo = () => {
            if (!cc.isValid(this.target)) {
                this.scheduleTemp.unschedule(foo);
                console.warn("节点已销毁, 暂时关闭跟随 - 出bug啦");
                return;
            }
            if (noFollowType.includes(data.mask_type)) {
                this.ui.hollow_mask.followMask(this.target, data.custom_ui);    // 挖空跟随节点
                this.ui.hand_tips.followHollowMask(this.ui.hollow_mask.node);   // 手指跟随挖空区域
            } else {
                this.ui.hand_tips.followHollowMask(this.target);                // 手指跟随目标节点
            }
            this.ui.text_tips.followMask(this.target);  // 文本跟随节点
        }, 0.1);
        return foo;
    }

    /** 计时器 - 取消跟随节点 */
    private unscheduleTargetFollow(foo): void {
        foo && this.scheduleTemp.unschedule(foo);
    }

    /** 仅显示透明遮罩, 其他全部隐藏 */
    private clearGuideUI() {
        this.ui.initGuideUI();
    }

    /** 当前引导步骤结束方式 */
    private createGuideFinish(data: T_GUIDE_STEP_DATA, resolve: Function): void {
        if (data.step_finish_type == E_GUIDE_STEP_FINISH_TYPE.CLICK_NODE) { // 点击节点结束
            if (!this.target) {
                console.error("所需点击的节点未找到!");
                return;
            }
            console.log("注册'点击节点结束'");
            this.target.once(cc.Node.EventType.TOUCH_END, () => {
                console.warn("点击成功！太棒了！")
                resolve();
            }, this);
            return;
        }
        if (data.step_finish_type == E_GUIDE_STEP_FINISH_TYPE.EVENT_MONITOR) {  // 监听结束
            let pathKey = data.step_finish_param.split(",")[0];
            let callback = GUIDE_CFG_FINISH_EVENT[pathKey] && GUIDE_CFG_FINISH_EVENT[pathKey].callback;
            if (!callback) {
                console.error("所需监听回调未找到!");
                return;
            }
            console.log("注册'监听结束'");
            callback(resolve);
            return;
        }
        if (data.step_finish_type == E_GUIDE_STEP_FINISH_TYPE.CLICK_BLANK) {    // 点击空白处关闭
            if (data.mask_type != E_GUIDE_STEP_MASK_TYPE.LUCENCY_FULL_SCENE) {
                console.error("当前遮罩不是全屏遮罩")
                return;
            }
            console.log("注册'点击遮罩结束'");
            this.ui.hollow_mask.node.on(cc.Node.EventType.TOUCH_END, () => { resolve(); }, this);
            return;
        }
    }


}
