import { _decorator, Component, Vec2 } from 'cc';
import { IPos } from './JPSEnum';
const { ccclass, property } = _decorator;

@ccclass('JPSUtils')
export class JPSUtils extends Component {

    public static readonly left: Vec2 = new Vec2(-1, 0)
    public static readonly right: Vec2 = new Vec2(1, 0)
    public static readonly up: Vec2 = new Vec2(0, 1)
    public static readonly down: Vec2 = new Vec2(0, -1)
    public static readonly upRight: Vec2 = new Vec2(1, 1)
    public static readonly upLeft: Vec2 = new Vec2(-1, 1)
    public static readonly downRight: Vec2 = new Vec2(1, -1)
    public static readonly downLeft: Vec2 = new Vec2(-1, -1)

    public static readonly Horizontal: Array<Vec2> = [JPSUtils.left, JPSUtils.right];
    public static readonly Vertical: Array<Vec2> = [JPSUtils.up, JPSUtils.down];
    public static readonly Diagonal: Array<Vec2> = [JPSUtils.upRight, JPSUtils.upLeft, JPSUtils.downRight, JPSUtils.downLeft];
    //水平
    public static readonly Level: Array<Vec2> = [...JPSUtils.Horizontal, ...JPSUtils.Vertical];

    public static readonly HorizontalCost: number = 10;
    public static readonly VerticalCost: number = 10;
    /**对角线代价 */
    public static readonly DiagonalCost: number = 14;

    /**曼哈顿距离 */
    public static manhattanDistance(a: Vec2, b: Vec2): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    public static eulerDistance(a: IPos, b: IPos): number {
        //斜向取14，水平垂直取10
        if (a.x == b.x || a.y == b.y) {
            if (a.x == b.x) {
                return JPSUtils.HorizontalCost * Math.abs(a.y - b.y);
            }
            return JPSUtils.HorizontalCost * Math.abs(a.x - b.x);
        }
        let dir = { x: b.x - a.x, y: b.y - a.y };

        if (dir.x != 0) {
            dir.x = dir.x / Math.abs(dir.x);
        }
        if (dir.y != 0) {
            dir.y = dir.y / Math.abs(dir.y);
        }

        let cost = 0;
        let nx = a.x 
        let ny = a.y 
        while (nx != b.x && ny != b.y) {
            nx += dir.x;
            ny += dir.y;
            cost += JPSUtils.DiagonalCost;
        }
        //此时在同一水平或垂直线上
        if (nx == b.x) {
            cost += JPSUtils.HorizontalCost * Math.abs(ny - b.y);
        } else {
            cost += JPSUtils.HorizontalCost * Math.abs(nx - b.x);
        }
        return cost;
    }

    // 切比雪夫距离 (适用于允许对角线移动的网格)
    public static heuristic(x1: number, y1: number, x2: number, y2: number): number {
        return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
    }
}

