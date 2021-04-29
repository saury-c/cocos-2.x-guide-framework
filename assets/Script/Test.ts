
import { EventNotice } from "./event/EventNotice";
import { E_GUIDE_CFG_FINISH_EVENT } from "./guide/config/GuideConfig";
import { GuideParse } from "./guide/entrance/GuideParse";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Test extends cc.Component {

    @property(cc.Node)
    cocos1: cc.Node = null;
    @property(cc.Node)
    cocos2: cc.Node = null;

    @property(cc.Node)
    open: cc.Node = null;
    @property(cc.Node)
    dialog: cc.Node = null;
    @property(cc.Node)
    close: cc.Node = null;

    @property(cc.Node)
    restart: cc.Node = null;

    start() {
        this.dialog.active = false;

        this.scheduleOnce(() => {
            this.ttt();
        }, 1);
    }

    ttt() {
        this.dialog.getChildByName("idle").on(cc.Node.EventType.TOUCH_END, (e: cc.Event.EventCustom) => {
            e.target.stopAllActions();
            e.target.runAction(
                cc.sequence(
                    cc.callFunc(() => { e.target.color = cc.color(140, 140, 130) }),
                    cc.scaleTo(0.3, 1.5),
                    cc.scaleTo(0.3, 1),
                    cc.callFunc(() => { e.target.color = cc.color(255, 255, 255) }),
                )
            )
        })
        this.open.on(cc.Node.EventType.TOUCH_END, () => {
            this.dialog.active = true;
        })
        this.close.on(cc.Node.EventType.TOUCH_END, () => {
            EventNotice.emit(E_GUIDE_CFG_FINISH_EVENT.CLICK_CLOSE);
            this.dialog.active = false;
        })


        this.cocos1.on(cc.Node.EventType.TOUCH_END, (e) => {
            e.target.runAction(
                cc.sequence(cc.scaleTo(0.3, 1.2), cc.scaleTo(0.3, 1))
            )
        })
        this.cocos2.on(cc.Node.EventType.TOUCH_END, (e) => {
            e.target.runAction(
                cc.sequence(cc.scaleTo(0.3, 1.2), cc.scaleTo(0.3, 1))
            )
        })

        this.restart.on(cc.Node.EventType.TOUCH_END, (e) => {
             GuideParse.INSTANCE().clearAllGuideStorage();
             GuideParse.INSTANCE().runGuide();
        })

        GuideParse.INSTANCE().runGuide();
    }
}
