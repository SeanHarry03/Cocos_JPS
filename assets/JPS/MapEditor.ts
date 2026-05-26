import { _decorator, Color, Component, EventTouch, Label, Node, Sprite, UITransform, Vec3 } from 'cc';
import { JPS } from './JPS';
import { IPos, } from './JPSEnum';
import { JPSUtils } from './JPSUtils';
const { ccclass, property } = _decorator;

@ccclass('MapEditor')
export class MapEditor extends Component {

    @property(Node)
    public Content: Node = null;
    public jps: JPS = null;

    private ContentWidth: number = 318;
    private ContentHeight: number = 318;
    private TiledWidth: number = 30;
    private TiledHeight: number = 30;
    private gap: number = 2;

    public blockPoints: Array<IPos> = [];
    public startPos: IPos = { x: 2, y: 2 };
    public endPos: IPos = { x: 2, y: 7 };


    private isDrageStart: boolean = false;
    private isDrageEnd: boolean = false;
    private BarrierList: Array<IPos> = [];

    protected onLoad(): void {
        MapEditor._ins = this;
    }

    protected start(): void {
        this.jps = this.node.getComponent(JPS);

        this.Content.children[this.startPos.y * 10 + this.startPos.x].getComponent(Sprite).color = Color.GREEN;
        this.Content.children[this.endPos.y * 10 + this.endPos.x].getComponent(Sprite).color = Color.RED;
        this.Event_ClearBarrier();

        for (let i = 0; i < this.Content.children.length; i++) {
            let row = i % 10;
            let col = Math.floor(i / 10);
            this.Content.children[i].getComponentInChildren(Label).string = `(${row},${col})`;
        }

        this.Content.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            let touch = event.getUILocation();
            let local = this.Content.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(touch.x, touch.y, 0));
            let pos: IPos = this.localPosTOTildedPos(local);
            if (pos.x < 0 || pos.x > 9 || pos.y < 0 || pos.y > 9) {
                return;
            }
            if (ComparePos(pos, this.startPos)) {
                this.isDrageStart = true;
                this.isDrageEnd = false;
            }
            if (ComparePos(pos, this.endPos)) {
                this.isDrageEnd = true;
                this.isDrageStart = false;
            }
            // console.log("Touch Start:", pos)
        }, this);


        this.Content.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
            let touch = event.getUILocation();
            let local: Vec3 = this.Content.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(touch.x, touch.y, 0));
            let pos: IPos = this.localPosTOTildedPos(local);
            if (pos.x < 0 || pos.x > 9 || pos.y < 0 || pos.y > 9) {
                return;
            }
            if (this.isDrageStart && !this.BarrierList.find(item => ComparePos(item, pos))) {
                this.Content.children[this.startPos.y * 10 + this.startPos.x].getComponent(Sprite).color = Color.WHITE;
                this.startPos = pos;
                this.Content.children[this.startPos.y * 10 + this.startPos.x].getComponent(Sprite).color = Color.GREEN;
            }
            else if (this.isDrageEnd && !this.BarrierList.find(item => ComparePos(item, pos))) {
                this.Content.children[this.endPos.y * 10 + this.endPos.x].getComponent(Sprite).color = Color.WHITE;
                this.endPos = pos;
                this.Content.children[this.endPos.y * 10 + this.endPos.x].getComponent(Sprite).color = Color.RED;
            }
            else if (!this.isDrageStart && !this.isDrageEnd) {
                if (!ComparePos(pos, this.startPos) && !ComparePos(pos, this.endPos)) {
                    this.Content.children[pos.y * 10 + pos.x].getComponent(Sprite).color = Color.BLACK;
                    if (!this.BarrierList.find(item => ComparePos(item, pos))) {
                        this.BarrierList.push(pos);
                    }
                }
            }
        }, this);
        this.Content.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            let touch = event.getUILocation();
            let local = this.Content.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(touch.x, touch.y, 0));
            let pos: IPos = this.localPosTOTildedPos(local);
            if (pos.x < 0 || pos.x > 9 || pos.y < 0 || pos.y > 9) {
                return;
            }
            if (this.isDrageStart && !this.BarrierList.find(item => ComparePos(item, pos))) {
                this.Content.children[this.startPos.y * 10 + this.startPos.x].getComponent(Sprite).color = Color.WHITE;
                this.startPos = pos;
                this.Content.children[this.startPos.y * 10 + this.startPos.x].getComponent(Sprite).color = Color.GREEN;
            }
            else if (this.isDrageEnd && !this.BarrierList.find(item => ComparePos(item, pos))) {
                this.Content.children[this.endPos.y * 10 + this.endPos.x].getComponent(Sprite).color = Color.WHITE;
                this.endPos = pos;
                this.Content.children[this.endPos.y * 10 + this.endPos.x].getComponent(Sprite).color = Color.RED;
            }
            else if (!this.isDrageStart && !this.isDrageEnd) {
                if (!ComparePos(pos, this.startPos) && !ComparePos(pos, this.endPos)) {
                    this.Content.children[pos.y * 10 + pos.x].getComponent(Sprite).color = Color.BLACK;
                    if (!this.BarrierList.find(item => ComparePos(item, pos))) {
                        this.BarrierList.push(pos);
                    }
                }
            }
            this.isDrageEnd = false;
            this.isDrageStart = false;
        }, this);
    }

    public Event_ClearBarrier() {
        for (let i = 0; i < this.Content.children.length; i++) {
            let child = this.Content.children[i];
            let col = Math.floor(i / 10);
            let row = i % 10;
            let pos: IPos = { x: row, y: col };
            if (ComparePos(pos, this.startPos) || ComparePos(pos, this.endPos)) {
                // console.log("跳过：", pos, i);
                continue;
            }
            child.getComponent(Sprite).color = Color.WHITE;
        }
        this.BarrierList.length = 0;
    }

    public Event_StartJPS() {
        this.blockPoints.length = 0;
        for (let i = 0; i < this.Content.children.length; i++) {
            let child = this.Content.children[i];
            let col = Math.floor(i / 10);
            let row = i % 10;
            let pos: IPos = { x: row, y: col };
            if (this.BarrierList.find(item => ComparePos(item, pos))) {
                continue;
            }
            if (!ComparePos(pos, this.startPos) && !ComparePos(pos, this.endPos)) {
                child.getComponent(Sprite).color = Color.WHITE;
            }
        }
        let path: Array<IPos> = this.jps.StartFindPath(this.startPos, this.endPos, this.BarrierList);
        if (path.length > 0) {
            path.forEach((point, index) => {
                let type = index === 0 ? "(起点)" : (index === path.length - 1 ? "(终点)" : "(跳点)");
                console.log(`节点 ${index + 1}: [X: ${point.x}, Y: ${point.y}] ${type}`);
                if(index == 0){
                    this.SetJumpNodeVisual(point,Color.GREEN);
                }else if(index == path.length - 1){
                    this.SetJumpNodeVisual(point,Color.RED);
                }else{
                    this.SetJumpNodeVisual(point,Color.YELLOW);
                }
            });
        } else {
            console.log("❌ 未找到路径");
        }
    }

    /**设置跳跃点 */
    public SetJumpNodeVisual(pos: IPos,color: Color = Color.BLUE) {
        this.Content.children[pos.y * 10 + pos.x].getComponent(Sprite).color = color
    }

    /**UI坐标转换为格子 */
    private localPosTOTildedPos(local: Vec3): IPos {
        let row = Math.floor(Math.abs((local.x + this.ContentWidth / 2) / (this.TiledWidth + this.gap)));
        let col = 9 - Math.floor(Math.abs((local.y + this.ContentHeight / 2) / (this.TiledHeight + this.gap)));
        return { x: row, y: col };
    }


    private static _ins: MapEditor = null;
    public static get instance(): MapEditor {
        return this._ins;
    }
}


export function ComparePos(pos1: IPos, pos2: IPos): boolean {
    return pos1.x === pos2.x && pos1.y === pos2.y;
}