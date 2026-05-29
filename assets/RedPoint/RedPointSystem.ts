import { _decorator } from 'cc';
import { RedPointConst } from './RedPointConst';
import { RedPointNode } from './RedPointNode';
const { ccclass, property } = _decorator;

@ccclass('RedPointSystem')
export class RedPointSystem {
    private static _isInit: boolean = false;

    public static RootRedPoint: RedPointNode = null;

    public static RedPointTreeList: string[] = [
        RedPointConst.mail,
        RedPointConst.mailSystem,
        RedPointConst.mailTeam,
        RedPointConst.mailAlliance,
        RedPointConst.task,
        RedPointConst.alliance,
    ];



    public static Init(): void {
        if (this._isInit) return;
        this._isInit = true;
        this.RootRedPoint = new RedPointNode();
        this.RootRedPoint.NodeName = RedPointConst.main;

        for (let name of this.RedPointTreeList) {
            let node: RedPointNode = this.RootRedPoint;
            let nameArr = name.split('.');
            if (nameArr[0] != node.NodeName) {
                console.error("当前RedPoint的起始节点不是Main")
                continue;
            }

            for (let i = 1; i < nameArr.length; i++) {
                let subName = nameArr[i];
                if (!node.Children.has(subName)) {
                    let childNode = new RedPointNode();
                    node.Children.set(subName, childNode);
                    childNode.NodeName = subName;
                    childNode.Parent = node;

                }
                node = node.Children.get(subName)
            }
        }

        console.error(this.RootRedPoint);
    }

    public static BindValueChanged(path: string, callBack) {
        this.Init();

        let nameArr = path.split('.');
        if (nameArr[0] != RedPointConst.main) {
            console.error("当前RedPoint的起始节点不是Main")
        }

        let node = this.RootRedPoint;
        for (let i = 1; i < nameArr.length; i++) {
            if (!node.Children.has(nameArr[i])) {
                console.error("当前RedPoint节点不存在")
                return
            }
            node = node.Children.get(nameArr[i]);

            if (i == nameArr.length - 1) {
                node.RedPointChanged = callBack;
            }
        }
    }

    public static SetValue(path: string, value) {
        let nameArr = path.split('.');
        if (nameArr[0] != RedPointConst.main) {
            console.error("当前RedPoint的起始节点不是Main")
        }

        let node = this.RootRedPoint;
        for (let i = 1; i < nameArr.length; i++) {
            if (!node.Children.has(nameArr[i])) {
                console.error("当前RedPoint节点不存在")
                return
            }
            node = node.Children.get(nameArr[i]);

            if (i == nameArr.length - 1) {
                node.NotyfyRedPointChanged(value);
            }
        }
    }

    public static AddValue(path: string, value) {
        let nameArr = path.split('.');
        if (nameArr[0] != RedPointConst.main) {
            console.error("当前RedPoint的起始节点不是Main")
        }

        let node: RedPointNode = this.RootRedPoint;
        for (let i = 1; i < nameArr.length; i++) {
            if (!node.Children.has(nameArr[i])) {
                console.error("当前RedPoint节点不存在")
                return
            }
            node = node.Children.get(nameArr[i]);

            if (i == nameArr.length - 1) {
                node.NotyfyRedPointChanged(node.Num + value);
            }
        }
    }
}

