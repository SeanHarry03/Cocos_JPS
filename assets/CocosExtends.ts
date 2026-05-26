import { Sprite } from 'cc';
import { Component, Node, sp } from 'cc';

import { DEBUG } from 'cc/env';

/**
 * 自定义日志模块
 * 开发环境下使用 bind 保留真实调用堆栈，生产环境下替换为空函数以提升性能并隐藏日志
 */

export const myInfo = DEBUG ? console.info.bind(console) : console.log.bind(console)
export const myWarn = DEBUG ? console.warn.bind(console) : console.log.bind(console);
export const myError = DEBUG ? console.error.bind(console) : console.log.bind(console);

// 1. 扩展类型声明 (让编辑器和编译器能够识别这个新方法)
declare module 'cc' {
    interface Node {
        /**
         * 获取组件，如果不存在则自动挂载该组件
         * @param type 组件的类
         * @returns 返回获取或添加的组件实例
         */
        getOrAddComponent<T extends Component>(type: { new(): T }): T;

        /** 
         * 获取子节点的组件
         * @param name 子节点的名字
         * @param type 组件的类
         */
        getChildByName_Component<T extends Component>(name: string, type: { new(): T }): T;
    }
    namespace sp {
        interface Skeleton {
            /**
             * 安全替换 Spine 数据，自动处理节点失活和渲染缓存清理，避免底层报错
             * @param data 新的 SkeletonData 资源
             */
            safeSetSkeletonData(data: sp.SkeletonData): void;
        }
    }
}

// 2. 运行时原型挂载 (实际的逻辑实现)
Node.prototype.getOrAddComponent = function <T extends Component>(type: { new(): T }): T {
    // 这里的 this 指向调用该方法的 Node 实例
    let component = this.getComponent(type);
    if (!component) {
        component = this.addComponent(type);
    }
    return component as T;
};


// 2. 运行时原型挂载 (实际的逻辑实现)
Node.prototype.getChildByName_Component = function <T extends Component>(name: string, type: { new(): T }): T {
    let child = this.getChildByName(name);
    if(child){
        // 这里的 this 指向调用该方法的 Node 实例
        let component = child.getComponent(type);
        if (!component) {
            component = child.addComponent(type);
        }
        return component as T;
    }
    return null;
};

// 2. 运行时原型挂载 (实际执行的逻辑)
sp.Skeleton.prototype.safeSetSkeletonData = function (data: sp.SkeletonData) {
    // 这里的 this 指向调用此方法的 sp.Skeleton 实例本身
    this.node.active = false;
    // this.setAnimationCacheMode(sp.AnimationCacheMode.SHARED_CACHE);
    if (this.defaultCacheMode == sp.AnimationCacheMode.REALTIME) {
        this.clearTracks();
    }

    // 加上容错判断，确保旧数据存在且方法可用时才清理，使用 any 绕过部分版本 d.ts 声明缺失的问题
    if (this.skeletonData && typeof (this as any).destroyRenderData === 'function') {
        (this as any).destroyRenderData();
    }

    this.skeletonData = data;
    this.node.active = true;
};
