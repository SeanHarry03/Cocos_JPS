/**
 * 通用二叉最小堆
 * - 通过构造函数传入比较器：compare(a, b) < 0 表示 a 排在前面
 * - 复杂度：push / pop 为 O(log n)，peek 为 O(1)
 */
export class MinHeap<T> {
    private data: T[] = [];
    private compare: (a: T, b: T) => number;

    constructor(compare: (a: T, b: T) => number) {
        this.compare = compare;
    }

    public get size(): number {
        return this.data.length;
    }

    public get isEmpty(): boolean {
        return this.data.length === 0;
    }

    public push(item: T): void {
        this.data.push(item);
        this.siftUp(this.data.length - 1);
    }

    public pop(): T | undefined {
        const n = this.data.length;
        if (n === 0) return undefined;
        const top = this.data[0];
        const last = this.data.pop()!;
        if (n > 1) {
            this.data[0] = last;
            this.siftDown(0);
        }
        return top;
    }

    public peek(): T | undefined {
        return this.data[0];
    }

    public clear(): void {
        this.data.length = 0;
    }

    private siftUp(i: number): void {
        const data = this.data;
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this.compare(data[i], data[parent]) < 0) {
                [data[i], data[parent]] = [data[parent], data[i]];
                i = parent;
            } else {
                break;
            }
        }
    }

    private siftDown(i: number): void {
        const data = this.data;
        const n = data.length;
        while (true) {
            const left = i * 2 + 1;
            const right = left + 1;
            let smallest = i;
            if (left < n && this.compare(data[left], data[smallest]) < 0) smallest = left;
            if (right < n && this.compare(data[right], data[smallest]) < 0) smallest = right;
            if (smallest === i) break;
            [data[i], data[smallest]] = [data[smallest], data[i]];
            i = smallest;
        }
    }
}
