<template>
    <div class="cube-scene">
        <div ref="refView" class="view">

        </div>
        <div>
            <button @click="onLeft">left</button>
            <button @click="onRight">right</button>
            <button @click="onForward">forw</button>
        </div>
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
        scene.animate();
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
</script>
<style lang="scss" scoped>
.cube-scene {
    display: flex;
    .view {
        margin: auto;
        max-width: 640px;
        width: 100%;
        height: 480px;
    }
}
</style>

