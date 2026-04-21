import { _decorator, Component } from 'cc';
import { IPos, PosAdd } from './JPSEnum';
import { JpsNode } from './JpsNode';
import { JPSUtils } from './JPSUtils';
import { ComparePos, MapEditor } from './MapEditor';
import { MinHeap } from './MinHeap';
const { ccclass, property } = _decorator;

// 堆里存储 "节点 + 入堆时的 f 快照"，支持 lazy 更新（重新入堆 + 弹出时校验是否过期）
interface OpenEntry {
    node: JpsNode;
    f: number; // 入堆时的 f 快照，后续节点 f 变更不会影响堆序
}

@ccclass('JPS')
export class JPS extends Component {

    private blockPoints: Array<IPos> = [];
    private closedList: Set<string> = new Set(); // 用于记录已处理过的节点位置
    private openMap: Map<string, JpsNode> = new Map(); // 按坐标索引 openList 中最新的节点

    public StartFindPath(startPos: IPos, endPos: IPos, blockPoints: Array<IPos>): Array<IPos> {
        this.blockPoints.length = 0;
        blockPoints.forEach(item => {
            this.blockPoints.push(item);
        });
        this.closedList.clear();
        this.openMap.clear();

        const openHeap = new MinHeap<OpenEntry>((a, b) => a.f - b.f);

        const startNode = new JpsNode(startPos);
        openHeap.push({ node: startNode, f: startNode.f });
        this.openMap.set(this.posKey(startPos), startNode);

        while (!openHeap.isEmpty) {
            const entry = openHeap.pop()!;
            const current = entry.node;
            const nodeKey = this.posKey(current.pos);

            // 过期条目：该节点已经以更小的 f 入堆并被处理过，或 f 已被更新为比 entry.f 更小
            if (this.closedList.has(nodeKey)) continue;
            if (entry.f !== current.f) continue; // 说明堆里还有新版本条目，丢弃旧的

            this.openMap.delete(nodeKey);

            // 如果到达终点，回溯路径
            if (current.pos.x === endPos.x && current.pos.y === endPos.y) {
                const path: Array<IPos> = [];
                let curr: JpsNode = current;
                while (curr) {
                    path.push({ x: curr.pos.x, y: curr.pos.y });
                    curr = curr.parent;
                }
                return path.reverse(); // 从起点到终点返回
            }

            this.closedList.add(nodeKey);

            // 寻找并处理所有后继跳点
            this.identifySuccessors(current, startPos, endPos, openHeap);
        }

        return []; // 找不到路径
    }

    // 寻找后继节点 (整合了剪枝逻辑)
    identifySuccessors(current: JpsNode, start: IPos, end: IPos, openHeap: MinHeap<OpenEntry>) {
        const neighbors = this.GetNeighborNodes(current);

        for (const neighbor of neighbors) {
            const dx = neighbor.x - current.pos.x;
            const dy = neighbor.y - current.pos.y;

            // 沿着特定方向发起跳跃
            const jumpPoint: IPos = this.jump(current.pos.x, current.pos.y, dx, dy, end);
            if (!jumpPoint) continue;
            //UI显示跳跃点
            MapEditor.instance.SetJumpNodeVisual(jumpPoint);
            
            const jx = jumpPoint.x;
            const jy = jumpPoint.y;
            const jKey = this.posKey(jumpPoint);

            // 跳过已处理节点
            if (this.closedList.has(jKey)) continue;

            // 计算新的 G 值：当前节点 G + 两点间距离
            const jumpDistance = JPSUtils.eulerDistance(current.pos, jumpPoint);
            const newG = current.g + jumpDistance;

            let existingNode = this.openMap.get(jKey);
            if (!existingNode || newG < existingNode.g) {
                if (!existingNode) {
                    existingNode = new JpsNode({ x: jx, y: jy }, current);
                    this.openMap.set(jKey, existingNode);
                } else {
                    existingNode.parent = current;
                }
                existingNode.g = newG;
                existingNode.h = JPSUtils.eulerDistance(jumpPoint, end);
                existingNode.f = existingNode.g + existingNode.h;

                // 入堆时保存当前 f 快照；若之后该节点又被以更小 f 更新，会再次入堆，旧条目按 stale 规则丢弃
                openHeap.push({ node: existingNode, f: existingNode.f });
            }
        }
    }

    jump(x: number, y: number, dx: number, dy: number, end: IPos): IPos {
        const nx = x + dx;
        const ny = y + dy;

        // 如果撞墙或越界，返回 null
        if (!this.isWalkable({ x: nx, y: ny })) return null;

        //TODO:如果游戏不允许角穿，如果两个正交相邻格都是障碍物，角色会从两个墙角的夹缝中斜穿过去。
        // 添加这个判断
        // if (dx !== 0 && dy !== 0) {
        //     if (!this.isWalkable({ x, y: ny }) && !this.isWalkable({ x: nx, y })) return null;
        // }

        // 如果找到终点，直接返回
        if (nx === end.x && ny === end.y) return { x: nx, y: ny };

        // 检查是否有强迫邻居
        if (dx !== 0 && dy !== 0) {
            // 对角线移动时的强迫邻居检查
            if ((this.isWalkable({ x: nx - dx, y: ny + dy }) && !this.isWalkable({ x: nx - dx, y: ny })) ||
                (this.isWalkable({ x: nx + dx, y: ny - dy }) && !this.isWalkable({ x: nx, y: ny - dy }))) {
                return { x: nx, y: ny };
            }
            // 对角线移动的特殊规则：对其正交分量进行直线探测
            if (this.jump(nx, ny, dx, 0, end) !== null || this.jump(nx, ny, 0, dy, end) !== null) {
                return { x: nx, y: ny }; // 直线上发现跳点，当前对角线节点也成为跳点
            }
        } else {
            // 直线移动时的强迫邻居检查
            if (dx !== 0) { // 水平移动
                if ((this.isWalkable({ x: nx + dx, y: ny + 1 }) && !this.isWalkable({ x: nx, y: ny + 1 })) ||
                    (this.isWalkable({ x: nx + dx, y: ny - 1 }) && !this.isWalkable({ x: nx, y: ny - 1 }))) {
                    return { x: nx, y: ny };
                }
            } else { // 垂直移动
                if ((this.isWalkable({ x: nx + 1, y: ny + dy }) && !this.isWalkable({ x: nx + 1, y: ny })) ||
                    (this.isWalkable({ x: nx - 1, y: ny + dy }) && !this.isWalkable({ x: nx - 1, y: ny }))) {
                    return { x: nx, y: ny };
                }
            }
        }

        // 如果没有遇到强迫邻居，继续沿着原方向递归跳跃
        return this.jump(nx, ny, dx, dy, end);
    }

    private GetNeighborNodes(node: JpsNode): Array<IPos> {
        const neighborPoses: Array<IPos> = [];
        const parent = node.parent;
        const x = node.pos.x;
        const y = node.pos.y;

        //起点
        if (!parent) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx == 0 && dy == 0) {
                        continue;
                    }
                    if (this.isWalkable(PosAdd(node.pos, { x: dx, y: dy }))) {
                        neighborPoses.push(PosAdd(node.pos, { x: dx, y: dy }));
                    }
                }
            }
            return neighborPoses;
        }

        // 如果有父节点，进行邻居修剪 (计算移动方向)
        const dx = Math.max(-1, Math.min(1, x - parent.pos.x));
        const dy = Math.max(-1, Math.min(1, y - parent.pos.y));

        if (dx != 0 && dy != 0) {
            //对角线 移动
            if (this.isWalkable({ x: x + dx, y: y })) neighborPoses.push({ x: x + dx, y: y });
            if (this.isWalkable({ x: x, y: y + dy })) neighborPoses.push({ x: x, y: y + dy });
            if (this.isWalkable({ x: x + dx, y: y + dy })) {
                //TODO:如果游戏不允许角穿，如果两个正交相邻格都是障碍物，角色会从两个墙角的夹缝中斜穿过去。
                // if (!this.isWalkable({ x: x + dx, y: y }) && !this.isWalkable({ x: x, y: y + dy }))
                neighborPoses.push({ x: x + dx, y: y + dy });
            }
            //强迫邻居
            if (!this.isWalkable({ x: x - dx, y: y }) && this.isWalkable({ x: x - dx, y: y + dy }))
                neighborPoses.push({ x: x - dx, y: y + dy });
            if (!this.isWalkable({ x: x, y: y - dy }) && this.isWalkable({ x: x + dx, y: y - dy }))
                neighborPoses.push({ x: x + dx, y: y - dy });
        } else {
            //水平 垂直 移动
            if (dx != 0) {
                if (this.isWalkable({ x: x + dx, y: y })) neighborPoses.push({ x: x + dx, y: y });
                if (!this.isWalkable({ x: x, y: y + 1 }) && this.isWalkable({ x: x + dx, y: y + 1 }))
                    neighborPoses.push({ x: x + dx, y: y + 1 });
                if (!this.isWalkable({ x: x, y: y - 1 }) && this.isWalkable({ x: x + dx, y: y - 1 }))
                    neighborPoses.push({ x: x + dx, y: y - 1 });
            }
            if (dy != 0) {
                if (this.isWalkable({ x: x, y: y + dy })) neighborPoses.push({ x: x, y: y + dy });
                if (!this.isWalkable({ x: x + 1, y: y }) && this.isWalkable({ x: x + 1, y: y + dy }))
                    neighborPoses.push({ x: x + 1, y: y + dy });
                if (!this.isWalkable({ x: x - 1, y: y }) && this.isWalkable({ x: x - 1, y: y + dy }))
                    neighborPoses.push({ x: x - 1, y: y + dy });
            }
        }
        return neighborPoses;
    }

    private posKey(pos: IPos): string {
        return `${pos.x},${pos.y}`;
    }

    private isWalkable(pos: IPos): boolean {
        if (pos.x < 0 || pos.x > 9 || pos.y < 0 || pos.y > 9) {
            return false;
        }
        return this.blockPoints.find(item => ComparePos(item, pos)) == null;
    }
}
