import { Component } from 'cc';
import { _decorator, EventHandler, Label, Layers, Node, ScrollBar, ScrollView, Sprite, UITransform } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property, executeInEditMode, menu, requireComponent } = _decorator;

@ccclass('BatchScrollView')
@menu('UI/BatchScrollView')
@requireComponent(ScrollView)
export class BatchScrollView extends Component {

    _isCreateFollowContent: boolean = false;

    followContent: Node = null;

    @property(Node)
    content: Node = null;
    @property(ScrollView)
    scrollView: ScrollView = null;

    protected start(): void {
        this.RenderFollowContent();
    }

    /**渲染图片、文本分离 */
    public RenderFollowContent(): void {
        this.CreateFollowContent();

        for (let i = 0; i < this.content.children.length; i++) {
            let itemChild = this.content.children[i];
            let followItem = this.followContent.children[i];
            if (itemChild.getComponent(Sprite)) {
                followItem.getOrAddComponent(Sprite).spriteFrame = itemChild.getComponent(Sprite).spriteFrame;
            }
            followItem.getOrAddComponent(UITransform).setContentSize(itemChild.getComponent(UITransform).contentSize);

            followItem.setPosition(itemChild.getPosition());

            this.scheduleOnce(() => {
                if (itemChild && itemChild.isValid) {
                    itemChild.getComponent(Sprite)?.destroy();
                }
            })

            for (const label of itemChild.getComponentsInChildren(Label)) {
                label.node.setParent(itemChild, true);
            }

            for (const sprite of itemChild.getComponentsInChildren(Sprite)) {
                if (itemChild === sprite.node) continue;
                sprite.node.setParent(followItem, true);
            }
        }
    }

    private CreateFollowContent() {
        this.followContent = this.content.parent.getChildByName("followContent");
        if (this.followContent && this.followContent.isValid) {
            if (EDITOR) {
                this.followContent.destroy();
            } else
                return;
        }

        this.followContent = new Node("followContent");
        this.followContent.layer = Layers.Enum.UI_2D;
        this.followContent.getOrAddComponent(UITransform).anchorY = this.content.getComponent(UITransform).anchorY;
        this.followContent.getOrAddComponent(UITransform).anchorX = this.content.getComponent(UITransform).anchorX;
        this.content.parent.addChild(this.followContent);
        this.followContent.setSiblingIndex(this.content.getSiblingIndex());
        this.followContent.getOrAddComponent(UITransform).setContentSize(this.content.getComponent(UITransform).contentSize);
        this.followContent.setWorldPosition(this.content.getWorldPosition());

        for (let i = 0; i < this.content.children.length; i++) {
            let itemChild = this.content.children[i];
            let followItem = new Node("followItem");
            followItem.layer = Layers.Enum.UI_2D;
            followItem.getOrAddComponent(UITransform).anchorX = 0.5;
            followItem.getOrAddComponent(UITransform).anchorY = 0.5;
            followItem.setParent(this.followContent);
            followItem.addComponent(Sprite)
            followItem.getOrAddComponent(UITransform).setContentSize(itemChild.getComponent(UITransform).contentSize);

            followItem.setPosition(itemChild.getPosition());
        }
    }

    /**需要绑定在ScrollView的滚动事件上 */
    public followEvent(target: ScrollView, eventType) {
        this.followContent.setWorldPosition(target.content.worldPosition);
    }

    private _ensureFollowEvent(): void {
        if (!this.scrollView || !this.scrollView.isValid) {
            this.scrollView = this.node.getComponent(ScrollView);
        }

        const exists = this.scrollView.scrollEvents.some(
            e => e.handler === 'followEvent' && e.component === 'BatchScrollView'
        );
        if (!exists) {
            const handler = new EventHandler();
            handler.target = this.node;
            handler.component = 'BatchScrollView';
            handler.handler = 'followEvent';
            this.scrollView.scrollEvents.push(handler);
        }
    }

    private _findContent(): void {
        if (this.content && this.content.isValid) return;
        try {
            this.content = this.node.getChildByPath("view/content");
        } catch (e) {
            console.error("没有找到content节点！");
        }
    }
}
