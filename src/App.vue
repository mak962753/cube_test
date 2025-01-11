<template>
    <div class="relative p-4 bg-gray-100 min-h-screen flex items-center justify-center font-sans text-base space-y-8">
        <router-view />

        <div class="absolute bottom-0 right-0 text-xs p-1">{{version}}</div>

    </div>

</template>

<script lang="ts" setup>
// can't be used directly on the template
const version = __APP_VERSION__;
</script>
