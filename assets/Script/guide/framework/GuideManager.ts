/*
 * @Author: saury
 * @Date: 2021-04-13 16:33:48
 * @Des: 
 * @Tips: 
 */

import { T_GUIDE_ENTRANCE_DATA } from "../entrance/GuideParse";
import { Guide } from "./Guide";

// [v1.10] mask重写
/** 非常重要！！！！！！ v1.10的遮罩无法点击穿透, 修改后, 就能够点击穿透了 */
let mask_inverted = false;
const mask_hitTest = cc.Mask.prototype["_hitTest"];
cc.Mask.prototype["_hitTest"] = function () {
    if (mask_inverted) {
        return !mask_hitTest.apply(this, arguments);
    } else {
        return mask_hitTest.apply(this, arguments);
    }
}

export namespace guideManager {

    /** 引导因为只有一个, 按理来说 map 只能有一个 guide */
    export let guides: Map<string, Guide> = new Map();

    /** 创建一个引导实例 */
    export async function create(tag: string, data: T_GUIDE_ENTRANCE_DATA): Promise<Guide> {
        let guide = new Guide();
        guides.set(tag, guide);

        // [v1.10] mask重写
        mask_inverted = true;

        // 重写引导销毁
        let oldGuideDestroyFoo = guide.destroy;
        guide.destroy = () => {
            // console.log("%c 新手引导结束", "%color:#000000;%background:black", tag);
            oldGuideDestroyFoo.call(guide);
            guides.delete(tag);

            // [v1.10] mask重写
            mask_inverted = false;
        };
        // 初始化
        await guide.init(data);
        return guide;
    }

    /** 通过 TAG 获取引导实例 */
    export function get(tag: string): Guide {
        return guides.get(tag);
    }

    /** 立即触发指定引导 */
    export async function enter(tag: string) {
        let guide = guides.get(tag);
        if (guide) {
            await guide.enter();
        }
    }

    /** 立即中断指定引导 */
    export function exit(tag: string) {
        let guide = guides.get(tag);
        if (guide) {
            guide.exit();
        }
    }

    /** 删除并销毁一个引导实例 */
    export function remove(tag: string) {
        let guide = guides.get(tag);
        if (guide) {
            guide.destroy();
            guides.delete(tag);
        }
    }

    /** 退出当前所有引导 - 并销毁 */
    export function exitAllGuide() {
        guideManager.guides.forEach((v, k) => {
            v.destroy();   // 销毁引导
        })
    }
}

window["guideManager"] = guideManager;