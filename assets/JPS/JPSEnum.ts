export interface IPos {
    x: number;
    y: number;
}

export function PosAdd(pos: IPos, dir: IPos): IPos {
    return { x: pos.x + dir.x, y: pos.y + dir.y };
}