import { _decorator, Component, Label, Node } from 'cc';
import { RedPointConst, RedPointNameEnum, RedPointNameEnumToStr } from './RedPointConst';
import { RedPointSystem } from './RedPointSystem';
const { ccclass, property } = _decorator;

@ccclass('RedPointCom')
export class RedPointCom extends Component {

    @property({ type: RedPointNameEnum })
    private redPointName: any = RedPointConst.mailTeam;

    private _lab: Label = null;

    protected onLoad(): void {
        this._lab = this.node.getComponentInChildren(Label);
        RedPointSystem.BindValueChanged(RedPointNameEnumToStr(this.redPointName), this.OnChanged.bind(this));
    }

    protected onDestroy(): void {
        RedPointSystem.BindValueChanged(RedPointNameEnumToStr(this.redPointName), null);
    }

    private OnChanged(value) {
        this.node.active = value > 0;
        if (this.node.active) {
            this._lab.string = value > 99 ? "99+" : value.toString();
        }
    }

    private GetPath(node: Node) {
        let name = node.name;
        let parent = node.parent;
        while (parent) {
            name = parent.name + "." + name;
            parent = parent.parent;
        }
        return name;
    }
}


