/*
 * @Author: saury
 * @Date: 2021-04-09 17:23:31
 * @Des: 新手引导 - 手指提示
 * @Tips: 
 */

import { E_GUIDE_STEP_HAND_TIPS_TYPE } from "../entrance/GuideParse";

type T_HAND_ANIME_TYPE = "NROMAL";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GuideStepHand extends cc.Component {

    @property(cc.Node)
    hand_tips: cc.Node = null;
    @property(cc.Node)
    finger: cc.Node = null;

    isShow(t: boolean): void {
        this.hand_tips.active = t;
    }

    followHollowMask(hollowMaskNode: cc.Node): void {
        this.node.setPosition(hollowMaskNode.getPosition());
        if (hollowMaskNode.anchorX == 0) {  // 锚点同步
            this.node.x += hollowMaskNode.width / 2;
        } else if (hollowMaskNode.anchorX == 1) {
            this.node.x -= hollowMaskNode.width / 2;
        }
        if (hollowMaskNode.anchorY == 0) {
            this.node.y += hollowMaskNode.height / 2;
        } else if (hollowMaskNode.anchorY == 1) {
            this.node.y -= hollowMaskNode.height / 2;
        }
    }

    /**
     * @description: 显示手指动画
     * @param {cc.Node} targetNode 手指动画显示的节点位置(节点)
     * @param {E_GUIDE_STEP_HAND_TIPS_TYPE} type 手指动画
     */
    showHand(
        data: {
            targetNode: cc.Node,
            type?: E_GUIDE_STEP_HAND_TIPS_TYPE
        }
    ): void {
        switch ((data.type || E_GUIDE_STEP_HAND_TIPS_TYPE.HIDE) as E_GUIDE_STEP_HAND_TIPS_TYPE) {
            case E_GUIDE_STEP_HAND_TIPS_TYPE.HIDE:
                this.hand_tips.active = false;
                break;
            case E_GUIDE_STEP_HAND_TIPS_TYPE.SHOW:
                let targetNode = data.targetNode;
                if (!targetNode) {
                    // console.warn("手指跟随节点不存在");
                    return;
                }
                this.hand_tips.active = true;
                this.playAnime("NROMAL");
                this.refreshHandPos(targetNode);
                if (targetNode.anchorX == 0) {   // 锚点同步
                    this.node.x += targetNode.width / 2;
                } else if (targetNode.anchorX == 1) {
                    this.node.x -= targetNode.width / 2;
                }
                if (targetNode.anchorY == 0) {
                    this.node.y += targetNode.height / 2;
                } else if (targetNode.anchorY == 1) {
                    this.node.y -= targetNode.height / 2;
                }
                break;
        }
    }

    // 刷新位置
    private refreshHandPos(node: cc.Node): void {
        let targetPos: cc.Vec2 = node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        targetPos = this.hand_tips.parent.convertToNodeSpaceAR(targetPos);
        this.hand_tips.setPosition(targetPos);
    }

    /**
     * @description: 手指动画
     * @param {*} type
     */
    private playAnime(type: T_HAND_ANIME_TYPE = "NROMAL"): void {
        switch (type) {
            case "NROMAL":
                this.finger.stopAllActions();
                this.finger.setPosition(50, -30)
                this.finger.runAction(
                    cc.repeatForever(
                        cc.sequence(
                            cc.moveTo(0.7, 0, 0),
                            cc.moveTo(0.7, 50, -30),
                        )
                    )
                )
                break;
        }
    }

}
