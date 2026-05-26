import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Main')
export class Main extends Component {


    @property(Node)
    btn: Node = null;

    protected start(): void {
        let cha = ['藐视', '高压', '泡泡他', '音效', '查找']
        this.node.getComponentsInChildren(Label).forEach((item, index) => {
            item.string = cha[index];
        })
    }
}

