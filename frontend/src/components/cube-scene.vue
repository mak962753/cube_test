<template>
    <div class="flex w-full">
        <div ref="refView" class="view">

        </div>
        <slot></slot>
    </div>

</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, shallowRef} from "vue";
import { CubeMoverScene } from "@/shared/scene";
const refView = shallowRef<HTMLDivElement | null>(null);
let scene: CubeMoverScene | null = null;
onMounted(() => {
    if (refView.value) {
        scene = new CubeMoverScene(refView.value, {
            parallelTransforms: false,
        });
        scene.startAnimation();
    }
});

onUnmounted(() => {
    scene?.destroy();
});

function onLeft(factor: number = 1) {
    scene?.left(factor);
}

function onRight(factor: number = 1) {
    scene?.right(factor);
}

function onForward(factor: number = 1) {
    scene?.forward(factor);
}

function onBack(factor: number = 1) {
    scene?.back(factor);
}

defineExpose({
    left: onLeft,
    right: onRight,
    forward: onForward,
    back: onBack,
})
</script>
<style lang="scss" scoped>

    .view {
        flex: 1 1 640px;
        max-width: 640px;
        min-width: 320px;
        width: 100%;
        height: 480px;
    }
</style>

