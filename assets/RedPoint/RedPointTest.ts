import { _decorator, Component, instantiate, Node, Prefab, Vec3 } from 'cc';
import { RedPointConst } from './RedPointConst';
import { RedPointSystem } from './RedPointSystem';
const { ccclass, property } = _decorator;

@ccclass('RedPointTest')
export class RedPointTest extends Component {

    @property(Prefab)
    prefab: Prefab = null

    MailContent: Node = null;

    onLoad() {
        RedPointSystem.Init();
        const DorTest = instantiate(this.prefab)

        DorTest.setParent(this.node);
        DorTest.setPosition(Vec3.ZERO)
        this.MailContent = DorTest.getChildByPath("MailContent/ScrollView/view/content")

    }

    protected start(): void {
        this.InitValue();
    }

    public InitMail() {
    }

    public InitValue() {
        RedPointSystem.SetValue(RedPointConst.task, 0)
        RedPointSystem.SetValue(RedPointConst.alliance, 0)
        RedPointSystem.SetValue(RedPointConst.mailTeam, 0)
        RedPointSystem.SetValue(RedPointConst.mailSystem, this.MailContent.children.length)
        RedPointSystem.SetValue(RedPointConst.mailAlliance, 5)
    }

    public AddValue() {
        RedPointSystem.AddValue(RedPointConst.task, 1)
        RedPointSystem.AddValue(RedPointConst.alliance, 1)
        RedPointSystem.AddValue(RedPointConst.mailTeam, 1)
        RedPointSystem.AddValue(RedPointConst.mailAlliance, 1)
    }
}

