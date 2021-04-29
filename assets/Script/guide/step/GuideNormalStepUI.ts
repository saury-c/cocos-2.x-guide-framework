/*
* @Author: saury
* @Date: 2021-04-09 10:37:33
* @Des: 新手引导单步骤UI
* @Tips: 
*/

import GuideStepHand from "./GuideStepHand";
import GuideStepMask from "./GuideStepMask";
import GuideStepTips from "./GuideStepTips";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GuideNormalStepUI extends cc.Component {

    @property({ type: cc.Node, tooltip: "用于异步等待 - 曲线救国hold" })
    hold_intercept: cc.Node = null;

    @property({ type: GuideStepMask })
    hollow_mask: GuideStepMask = null;

    @property({ type: GuideStepTips })
    text_tips: GuideStepTips = null;

    @property({ type: GuideStepHand })
    hand_tips: GuideStepHand = null;

    hold(t: boolean) {
        this.hold_intercept.active = t;
    }

    /** 隐藏所有引导组件, 仅显示透明全屏遮罩 */
    initGuideUI(): void {
        this.node.active = true;
        this.text_tips.isShow(false)
        this.hand_tips.isShow(false);
        this.hollow_mask.initMaskOpacity(0);
        this.hollow_mask.showMask(this.node, { width: 0, height: 0 }, false);
        this.hollow_mask.activeHollowMaskComponent(true);
        console.log("默认隐藏所有引导组件, 仅显示透明mask")
    }

    get getSize(): cc.Size {
        return this.node.getContentSize();
    }
}
