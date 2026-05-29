import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RedPointNode')
export class RedPointNode {

    public NodeName: string = "";
    public Parent: RedPointNode = null;

    public Children: Map<string, RedPointNode> = new Map();
    public RedPointChanged: Function = null;
    public Num: number = 0;

    public NotyfyRedPointChanged(value: number): void {
        if (this.Children.size > 0) {
            console.warn("只能设置叶子节点", this.NodeName);
            return
        }
        let oldNum = this.Num;

        this.Num = value;
        let delta = value - oldNum;
        this.RedPointChanged && this.RedPointChanged(this.Num);

        if (delta != 0) {

            this.Parent?.UpdateCountFromChild(delta);
        }
    }

    private UpdateCountFromChild(delta: number) {
        this.Num += delta;
        this.RedPointChanged && this.RedPointChanged(this.Num);
        this.Parent?.UpdateCountFromChild(delta);
    }
}

