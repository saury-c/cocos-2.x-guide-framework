/*
 * @Author: saury
 * @Date: 2021-04-13 17:26:55
 * @Des: 配置项 - 配合excel
 * @Tips: 
 */

import { EventNotice } from "../../event/EventNotice";
import { GuideGameUtils } from "./GuideFunUtils";

export const GUIDE_PREFIX = "GUIDEGUIDEGUIDE_"

export const GUIDE_CFG_NODE_PATH: {
    [t: number]: {
        path: string,
        des: string
    }
} = {
    1: {
        path: "Canvas/cocos1",
        des: "第一个按钮"
    },
    2: {
        path: "Canvas/cocos2",
        des: "按钮"
    },
    3: {
        path: "Canvas/open",
        des: "打开弹窗按钮"
    },

}

export const GUIDE_CFG_NODE_EVENT: {
    [t: string]: {
        des: string,
        callback: () => cc.Node,
    }
} = {
    "foo1": {
        des: "查找弹窗关闭按钮",
        callback: () => {
            return GuideGameUtils.findCloseBtn();
        },
    },
}

export enum E_GUIDE_CFG_FINISH_EVENT {
    CLICK_CLOSE = "e1",
}
export const GUIDE_CFG_FINISH_EVENT: {
    [t: string]: {
        des: string,
        callback: (resolve) => void
    }
} = {
    [E_GUIDE_CFG_FINISH_EVENT.CLICK_CLOSE]: {
        des: "成功关闭弹窗",
        callback: (resolve) => {
            let foo;
            EventNotice.add(E_GUIDE_CFG_FINISH_EVENT.CLICK_CLOSE, foo = () => {
                EventNotice.remove(E_GUIDE_CFG_FINISH_EVENT.CLICK_CLOSE, foo);
                resolve();
            });
        },
    },
}
window["GUIDE_CFG_FINISH_EVENT"] = GUIDE_CFG_FINISH_EVENT;