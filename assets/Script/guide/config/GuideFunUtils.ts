/*
 * @Author: saury
 * @Date: 2021-04-14 14:21:51
 * @Des: 引导工具 - 查找节点、监听等使用
 * @Tips: 
 */

import Test from "../../Test";


/**
 * @description: 游戏内查找节点
 */
export namespace GuideGameUtils {

    export function findCloseBtn() {
        return cc.find("Canvas").getComponent(Test).close;  // 仅作参考，实际上可以使用各种复杂的查找!
    }

}
window["GuideGameUtils"] = GuideGameUtils;
