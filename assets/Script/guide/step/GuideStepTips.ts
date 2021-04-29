/*
 * @Author: saury
 * @Date: 2021-04-09 14:22:33
 * @Des: 新首页引导 - 普通文本提示
 * @Tips: 本 tips 锚点为 0.5!
 */

import { E_GUIDE_STEP_TIPS_TEXT_POSTION } from "../entrance/GuideParse";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GuideStepTips extends cc.Component {

    @property({ type: cc.Node, tooltip: "this.node" })
    text_tips: cc.Node = null;

    @property({ type: cc.Label, tooltip: "文本label" })
    text: cc.Label = null;

    isShow(t: boolean): void {
        this.text_tips.active = t;
    }

    /**
     * @description: 设置文字
     * @param {string} str 文本内容
     * @param {TPosType} pos 文本位置
     * @param {cc.Node} targetNode 文本跟随的节点位置, 配合 pos-node 使用!
     */
    setStr(data?: Partial<{ str: string, pos: E_GUIDE_STEP_TIPS_TEXT_POSTION, targetNode: cc.Node }>): void {
        this.text.string = data.str || "";
        this.text_tips.active = true;

        // 文本对齐方式
        this.text_tips.height = this.text.node.height + 100;

        let winHeight = cc.winSize.height;
        switch ((data.pos || E_GUIDE_STEP_TIPS_TEXT_POSTION.CENTER) as E_GUIDE_STEP_TIPS_TEXT_POSTION) {
            case E_GUIDE_STEP_TIPS_TEXT_POSTION.TOP:
                this.text_tips.y = winHeight / 2 - this.text_tips.height;
                break;
            case E_GUIDE_STEP_TIPS_TEXT_POSTION.CENTER:
                this.text_tips.y = 0;
                break;
            case E_GUIDE_STEP_TIPS_TEXT_POSTION.BOTTOM:
                this.text_tips.y = -winHeight / 2 + this.text_tips.height;
                break;
            case E_GUIDE_STEP_TIPS_TEXT_POSTION.NODE:
                this.followMask(data.targetNode);
                break;
        }
    }

    // mask跟踪目标引导节点 - 默认在挖空遮罩处使用
    followMask(node: cc.Node) {
        if (!node) {
            // console.warn("[guide] 文本跟随节点不存在!");
            return;
        }
        let offsetDistance = 50;
        let winDistance = cc.winSize.height;
        let pos = node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        pos = this.text_tips.parent.convertToNodeSpaceAR(pos);
        let hasSpaceAbove = (winDistance / 2 - pos.y) > (this.text_tips.height + offsetDistance); // 节点上方放的下该节点
        let hasSpaceBelow = (pos.y - winDistance / 2) > (this.text_tips.height + offsetDistance); // 节点下方放的下该节点
        if (hasSpaceBelow) {    // 下方
            this.text_tips.y = pos.y - this.text_tips.height / 2 - offsetDistance;
        } else if (hasSpaceAbove) { // 上方
            this.text_tips.y = pos.y + this.text_tips.height / 2 + offsetDistance;
        } else {    // 此时有显示不全的 bug!
            // console.warn("文本在上下位置显示都有问题😭 不过别担心,我有代码兼容,放手去做,全世界都会帮助你");
            this.text_tips.y = pos.y - this.text_tips.height / 2 - offsetDistance;
        }
    }

}
