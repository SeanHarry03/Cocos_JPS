import { _decorator, sp, renderer, gfx, Material, builtinResMgr, Color } from 'cc';
const { ccclass, property, menu } = _decorator;

@ccclass('BatchedSpine')
@menu('Spine/BatchedSpine')
export class BatchedSpine extends sp.Skeleton {

    @property
    protected _enableBatchTest: boolean = true;

    @property({ tooltip: '开启后将会在 CPU 端将顶点转换到世界空间，并合并 DrawCall。' })
    get enableBatchTest() { return this._enableBatchTest; }
    set enableBatchTest(value) {
        if (value !== this._enableBatchTest) {
            this._enableBatchTest = value;
            (this as any)._cleanMaterialCache();
            this.markForUpdateRenderData();
        }
    }

    private static _globalMatCache: Record<string, renderer.MaterialInstance> = {};

    /**
     * 1. 材质拦截
     */
    public getMaterialForBlendAndTint(src: gfx.BlendFactor, dst: gfx.BlendFactor, type: sp.SpineMaterialType): renderer.MaterialInstance {
        let baseMat = this.customMaterial;
        if (!baseMat) {
            baseMat = builtinResMgr.get<Material>('default-spine-material');
        }

        const useTwoColor = (type === sp.SpineMaterialType.TWO_COLORED);
        const useLocal = !this._enableBatchTest;
        
        const matKey = `${baseMat.hash}_${type}_${src}_${dst}_${useLocal}`;
        
        let inst = BatchedSpine._globalMatCache[matKey];
        if (inst) return inst;

        const matInfo = {
            parent: baseMat,
            subModelIdx: 0,
        };
        inst = new renderer.MaterialInstance(matInfo);
        
        inst.overridePipelineStates({
            blendState: {
                blendColor: Color.WHITE,
                targets: [{
                    blendEq: gfx.BlendOp.ADD,
                    blendAlphaEq: gfx.BlendOp.ADD,
                    blendSrc: src,
                    blendDst: dst,
                    blendSrcAlpha: src,
                    blendDstAlpha: dst,
                }],
            },
        });
        
        inst.recompileShaders({ TWO_COLORED: useTwoColor, USE_LOCAL: useLocal });
        BatchedSpine._globalMatCache[matKey] = inst;

        return inst;
    }

    /**
     * 2. CPU Bake
     */
    public updateAssembler(batcher: any) {
        const needBake = this._enableBatchTest && (this as any)._renderFlag;
        
        super.updateAssembler(batcher);

        if (needBake && this._renderData) {
            const rd = this._renderData;
            const chunk = rd.chunk;
            const vbuf = chunk.vb;
            
            const useTint = this.useTint || this.isAnimationCached();
            const perVertexSize = useTint ? 13 : 9;
            const floatCount = rd.vertexCount * perVertexSize;

            this.node.updateWorldTransform();
            const worldMat = this.node.worldMatrix;
            
            const m00 = worldMat.m00, m01 = worldMat.m01, m02 = worldMat.m02, m12 = worldMat.m12;
            const m04 = worldMat.m04, m05 = worldMat.m05, m06 = worldMat.m06, m13 = worldMat.m13;
            const m08 = worldMat.m08, m09 = worldMat.m09, m10 = worldMat.m10, m14 = worldMat.m14;

            for (let i = 0; i < floatCount; i += perVertexSize) {
                const x = vbuf[i];
                const y = vbuf[i + 1];
                const z = vbuf[i + 2]; 

                vbuf[i] = x * m00 + y * m04 + z * m08 + m12;
                vbuf[i + 1] = x * m01 + y * m05 + z * m09 + m13;
                vbuf[i + 2] = x * m02 + y * m06 + z * m10 + m14;
            }
        }
    }

    /**
     * 3. 拦截提交
     */
    protected _render(batcher: any) {
        if (!this._enableBatchTest) {
            super._render(batcher);
            return;
        }

        if (this._renderData && this._drawList) {
            const rd = this._renderData;
            const chunk = rd.chunk;
            const accessor = chunk.vertexAccessor;
            const meshBuffer = rd.getMeshBuffer()!;
            const origin = meshBuffer.indexOffset;

            let indicesCount = 0;

            for (let i = 0; i < this._drawList.length; i++) {
                this._drawIdx = i;
                const dc = this._drawList.data[i];
                
                if (dc.texture) {
                    const firstIndex = origin + dc.indexOffset;
                    const indexCount = dc.indexCount;
                    indicesCount += indexCount;

                    let merged = false;
                    const texHash = dc.texture.getHash();

                    if (batcher._currMaterial !== batcher._emptyMaterial) {
                        batcher.autoMergeBatches(batcher._currComponent!);
                        batcher.resetRenderStates();
                    }

                    const batches = batcher.batches;
                    if (batches.length > 0) {
                        const lastBatch = batches.array[batches.length - 1];

                        // 
                        if (lastBatch.visFlags === this.node.layer &&
                            lastBatch.textureHash === texHash &&
                            (lastBatch as any)._rawMaterial === dc.material && 
                            lastBatch.useLocalData === null && 
                            lastBatch.inputAssembler.firstIndex + lastBatch.inputAssembler.indexCount === firstIndex) {
                            
                            lastBatch.inputAssembler.indexCount += indexCount;
                            merged = true;
                        }
                    }

                    if (!merged) {
                        const ia = meshBuffer.requireFreeIA(batcher.device);
                        ia.firstIndex = firstIndex;
                        ia.indexCount = indexCount;
                        
                        batcher.commitIA(this, ia, dc.texture, dc.material, null);
                        
                        const newBatch = batches.array[batches.length - 1];
                        (newBatch as any)._rawMaterial = dc.material;
                    }
                }
            }

            const subIndices = rd.indices!.subarray(0, indicesCount);
            accessor.appendIndices(chunk.bufferId, subIndices);
            accessor.getMeshBuffer(chunk.bufferId).setDirty();
        }
    }
} 