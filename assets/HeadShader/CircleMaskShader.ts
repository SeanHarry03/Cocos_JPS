import { _decorator, Component, Sprite, Material, SpriteFrame, UITransform, Vec2 } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('CircleMaskShader')
@executeInEditMode
export class CircleMaskShader extends Component {

    @property({ type: Sprite })
    public targetSprite: Sprite | null = null;

    @property({ slide: true, range: [0, 1, 0.01] })
    public radius: number = 0.45;

    @property({ slide: true, range: [0, 0.1, 0.001] })
    public feather: number = 0.02;

    @property({ slide: true, range: [0, 1, 0.01] })
    public centerX: number = 0.5;

    @property({ slide: true, range: [0, 1, 0.01] })
    public centerY: number = 0.5;

    public useFrameOverlay: boolean = false;
    public frameSpriteFrame: SpriteFrame | null = null;
    public showOverlay: boolean = false;
    public overlaySpriteFrame: SpriteFrame | null = null;

    private _material: Material | null = null;
    private _uiTransform: UITransform | null = null;
    private _lastWidth: number = 0;
    private _lastHeight: number = 0;

    onLoad() {
        if (!this.targetSprite) {
            this.targetSprite = this.getComponent(Sprite);
        }
        this._uiTransform = this.getComponent(UITransform);
    }

    start() {
        this.scheduleOnce(() => this.updateMaterial(), 0);
    }

    onEnable() {
        this._lastWidth = 0;
        this._lastHeight = 0;
        this.scheduleOnce(() => {
            this._material = null;
            this.updateMaterial();
        }, 0.1);
    }

    // update() {
    //     if (!this._uiTransform) {
    //         this._uiTransform = this.getComponent(UITransform);
    //         if (!this._uiTransform) return;
    //     }
    //     const width = this._uiTransform.width;
    //     const height = this._uiTransform.height;

    //     if (width !== this._lastWidth || height !== this._lastHeight) {
    //         this._lastWidth = width;
    //         this._lastHeight = height;
    //         //this.updateMaterial();
    //     }
    // }

    private updateMaterial() {
        if (!this.targetSprite) {
            this.targetSprite = this.getComponent(Sprite);
            if (!this.targetSprite) return;
        }

        this._material = this.targetSprite.getMaterialInstance(0);
        
        if (!this._material || !this._uiTransform) return;

        const width = this._uiTransform.width;
        const height = this._uiTransform.height;

        let scaleX = 1.0;
        let scaleY = 1.0;

        if (width > 0 && height > 0) {
            if (width > height) {
                scaleX = width / height;
            } else {
                scaleY = height / width;
            }
        }

        // ── Cover / center-crop: compute coverScale ──
        // Compare actual texture pixel size vs the sprite node's display size.
        // If either axis of the texture is smaller than the sprite, uniformly
        // scale the texture up so it fully covers the sprite, then crop from center.
        let coverScaleX = 1.0;
        let coverScaleY = 1.0;
        const spriteFrame = this.targetSprite.spriteFrame;
        if (spriteFrame && width > 0 && height > 0) {
            const texW = spriteFrame.rect.width;   // actual image pixel width
            const texH = spriteFrame.rect.height;  // actual image pixel height
            if (texW > 0 && texH > 0) {
                // Uniform scale factor so that the scaled texture covers the sprite
                // on both axes (same idea as CSS object-fit: cover).
                const fitScale = Math.max(width / texW, height / texH);
                const scaledTexW = texW * fitScale;
                const scaledTexH = texH * fitScale;
                // coverScale tells the shader how much of the UV [0,1] range
                // the sprite actually occupies inside the (possibly enlarged) texture.
                coverScaleX = width / scaledTexW;
                coverScaleY = height / scaledTexH;
            }
        }

        try {
            this._material.setProperty('scale', new Vec2(scaleX, scaleY));
            this._material.setProperty('radius', this.radius);
            this._material.setProperty('feather', this.feather);
            this._material.setProperty('center', new Vec2(this.centerX, this.centerY));
            this._material.setProperty('coverScale', new Vec2(coverScaleX, coverScaleY));
            this._material.setProperty('useFrameOverlay', this.useFrameOverlay ? 1.0 : 0.0);
            if (this.useFrameOverlay && this.frameSpriteFrame) {
                const tex = this.frameSpriteFrame.texture;
                if (tex) {
                    this._material.setProperty('maskTexture', tex);
                }
            }
            this._material.setProperty('showOverlay', this.showOverlay ? 1.0 : 0.0);
            if (this.showOverlay && this.overlaySpriteFrame) {
                const tex = this.overlaySpriteFrame.texture;
                if (tex) {
                    this._material.setProperty('overlayTexture', tex);
                }
            }
        } catch (e) {
            console.warn('Failed to set material properties:', e);
            this._material = null;
        }
    }

    public refresh() {
        this.updateMaterial();
    }

    private onValidate() {
        this.scheduleOnce(() => this.updateMaterial(), 0);
    }
}