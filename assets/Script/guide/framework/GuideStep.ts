/*
 * @Author: saury
 * @Date: 2021-04-13 11:27:18
 * @Des: 
 * @Tips: 
 */

import { Guide } from "./Guide";

export class GuideStep {

    /**
     * 所属 Guide
     */
    guide: Guide;

    /**
     * 是否已销毁（由 Guide 维护）
     */
    _destroyed: boolean;

    /**
     * 步骤被触发后会回调该初始化函数
     */
    onInit(data: any): void | Promise<void> {
    }

    /**
     * 当引导被中断，步骤结束会回调该函数销毁该步骤实例
     */
    onDestroy() {
    }

    /**
     * 调用该函数结束该步骤
     */
    exit() {
        // 该函数会被引导的结束函数替换
    }

    /**
     * 在 Guide 指定的层显示节点
     */
    showNode(node: cc.Node) {
        let stage = cc.director.getScene().getChildByName("Canvas");
        stage.addChild(node, 500);
    }

    /**
     * 移除节点
     */
    removeNode(node: cc.Node) {
        cc.isValid(node) && node.removeFromParent(false);
    }

    /**
     * 销毁指定节点
     */
    destroyNode(node: cc.Node) {
        if (cc.isValid(node, true)) {
            node.destroy();
        }
    }


}