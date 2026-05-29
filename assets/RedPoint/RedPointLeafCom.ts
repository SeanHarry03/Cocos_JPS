import { _decorator, Component, Node } from 'cc';
import { RedPointConst, RedPointNameEnum, RedPointNameEnumToStr } from './RedPointConst';
import { RedPointSystem } from './RedPointSystem';
const { ccclass, property } = _decorator;

/**红点叶子节点，不显示数量 */
@ccclass('RedPointLeafCom')
export class RedPointLeafCom extends Component {

    @property({ type: RedPointNameEnum })
    private redPointName: any = RedPointConst.mailTeam;

    @property(Node)
    showNode: Node = null;

    protected start(): void {
        RedPointSystem.BindValueChanged(RedPointNameEnumToStr(this.redPointName), this.OnChanged.bind(this));
    }

    protected onDestroy(): void {
        RedPointSystem.BindValueChanged(RedPointNameEnumToStr(this.redPointName), null);
    }

    private OnChanged(value: number) {
        this.showNode.active = value > 0;
    }
}

