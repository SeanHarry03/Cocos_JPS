import { _decorator, Component, Node } from 'cc';
import { RedPointConst } from '../RedPointConst';
import { RedPointSystem } from '../RedPointSystem';
const { ccclass, property } = _decorator;

@ccclass('MailItemCom')
export class MailItemCom extends Component {

    @property(Node)
    redDotNode: Node = null;

    private _isRead: boolean = false;

    start() {
        this.redDotNode = this.node.getChildByName("Dot")
        this.node.on(Node.EventType.TOUCH_START, this.OnClickEvent, this);
    }

    public UpdateItem(data) {
        //做虚拟列表，isRead就保存在data中就可以了。
    }

    public OnClickEvent() {
        if (this._isRead) return;
        this._isRead = true;
        this.redDotNode.active = false;
        RedPointSystem.AddValue(RedPointConst.mailSystem, -1);
    }
}

