import { _decorator } from 'cc';
import { IPos } from './JPSEnum';
const { ccclass, property } = _decorator;

@ccclass('JpsNode')
export class JpsNode {

    public pos: IPos;
    public parent: JpsNode;
    public f: number;
    public g: number;
    public h: number;

    public constructor(pos: IPos, parents: JpsNode = null) {
        this.pos = pos;
        this.parent = parents;
        this.f = 0;
        this.g = 0;
        this.h = 0;
    }
}

