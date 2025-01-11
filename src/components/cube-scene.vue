<template>
    <div ref="refView" class="view">

    </div>

</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, shallowRef} from "vue";
import { CubeMoverScene } from "@/shared/scene";
const refView = shallowRef<HTMLDivElement | null>(null);
let scene: CubeMoverScene | null = null;
onMounted(() => {
    if (refView.value) {
        scene = new CubeMoverScene(refView.value);
        scene.startAnimation();
    }
});

onUnmounted(() => {
    scene?.destroy();
});

function onLeft() {
    scene?.left();
}

function onRight() {
    scene?.right();
}
function onForward() {
    scene?.forward();
}
function onBack() {
    scene?.back();
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
        margin: auto;
        flex: 1 1 640px;
        max-width: 640px;
        min-width: 320px;
        width: 100%;
        height: 480px;
    }
</style>

