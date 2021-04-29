/*
 * @Author: saury
 * @Date: 2021-04-09 10:52:17
 * @Des: 新手引导 - 阻挡mask
 * @Tips: 
 */


/**
 * 矫正显示（当引导的位置或镂空大小不符合预期时才需要手动矫正）
 * offset_x 黑色点击遮罩x轴偏移, 正负值都可
 * offset_y 黑色点击遮罩y轴偏移
 * width 黑色遮罩的固定宽度
 * height 黑色遮罩的固定高度
 * offset_width 在原基础宽度上做宽度大小修改
 * offset_height 在原基础高度上做高度大小修改
 * 注: 一般来说 width、height, 不会与 offset_width、offset_height 同时出现.. (因为没有固定大小, 又修改大小这种奇怪的行为吧)
 */
export type T_GUIDE_MASK_DATA = Partial<{
    offset_x: number;
    offset_y: number;
    width: number;
    height: number;
    offset_width: number;
    offset_height: number;
}>

const { ccclass, property } = cc._decorator;

@ccclass
export default class GuideStepMask extends cc.Component {

    @property(cc.Node)
    private hollow_mask: cc.Node = null;
    @property(cc.Node)
    private block_mask: cc.Node = null;

    // 刷新遮罩对齐组件
    refreshMaskWidget() {
        this.block_mask.getComponent(cc.Widget).updateAlignment();
    }

    // 动画 不填默认普通 (150普通 200对话框 0不显示)
    initMaskOpacity(opacity: 0 | 150 | 200 = 150) {
        this.stopMaskAnime();
        this.hollow_mask.opacity = opacity;
    }

    // 渐显动画
    private showMaskAnime() {
        this.hollow_mask.runAction(
            cc.fadeTo(1, 150)
        )
    }

    private stopMaskAnime() {
        this.hollow_mask.stopAllActions();
    }

    /** 激活 mask 组件 */
    activeHollowMaskComponent(t: boolean) {
        this.hollow_mask.getComponent(cc.Mask).enabled = t;
    }

    /** 激活 BlockInputEvents 组件 */
    activInterceptComponent(t: boolean) {
        this.block_mask.getComponent(cc.BlockInputEvents).enabled = t;
    }

    /** mask节点 */
    activeMaskNode(t: boolean) {
        this.hollow_mask.active = t;
    }

    // 自定义挖空大小
    customMask(
        data: T_GUIDE_MASK_DATA
    ) {
        if (!data) { return; }
        // console.log("自定义挖空..", data)
        let offsetX = data.offset_x;
        let offsetY = data.offset_y;
        let width = data.width;
        let height = data.height;
        let offsetWidth = data.offset_width;
        let offsetHeight = data.offset_height;
        offsetX != null && (this.hollow_mask.x += offsetX);
        offsetY != null && (this.hollow_mask.y += offsetY);
        width != null && (this.hollow_mask.width = width);
        height != null && (this.hollow_mask.height = height);
        offsetWidth != null && (this.hollow_mask.width += offsetWidth);
        offsetHeight != null && (this.hollow_mask.height += offsetHeight);
    }

    // 显示大小
    showMask(node: cc.Node, customMaskD: T_GUIDE_MASK_DATA, isAnime: boolean = false) {
        let pos = node.convertToWorldSpaceAR(cc.Vec2.ZERO);      // 引导的目标节点
        pos = this.hollow_mask.parent.convertToNodeSpaceAR(pos);
        this.hollow_mask.setPosition(pos);
        this.hollow_mask.setContentSize(node.getContentSize());
        // 自定义遮罩偏移、大小
        this.customMask(customMaskD);
        // 锚点同步
        this.hollow_mask.anchorX = node.anchorX;
        this.hollow_mask.anchorY = node.anchorY;
        // 刷新对齐组件
        this.refreshMaskWidget();
        // 动画
        if (isAnime) {
            this.initMaskOpacity(0);
            this.showMaskAnime();
        }
    }

    // mask跟踪目标引导节点 - 默认在挖空遮罩处使用
    followMask(node: cc.Node, customMaskD: T_GUIDE_MASK_DATA) {
        if (!node || !node.active) { return; }

        let pos = node.convertToWorldSpaceAR(cc.Vec2.ZERO);      // 引导的目标节点
        pos = this.hollow_mask.parent.convertToNodeSpaceAR(pos);
        this.hollow_mask.setPosition(pos);

        // 自定义遮罩偏移、大小
        this.customMask(customMaskD);
        // // 锚点同步
        this.hollow_mask.anchorX = node.anchorX;
        this.hollow_mask.anchorY = node.anchorY;
        // 刷新对齐
        this.refreshMaskWidget();
    }
}
