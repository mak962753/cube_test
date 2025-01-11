<template>
    <button :class="css" :disabled="disabled">
        <slot></slot>
    </button>
</template>

<script lang="ts" setup>import { computed } from 'vue';

const props = defineProps({
    disabled: Boolean,
    outline: Boolean,
});

const css = computed(() => {
    const base = "py-2 px-4 font-semibold rounded-md ";

    if (props.outline && props.disabled)
        return `${base} bg-gray-200 text-blue-300  border border-blue-300 cursor-not-allowed`;

    if (props.outline)
        return `${base} bg-white hover:bg-blue-500 text-blue-700 hover:text-white border border-blue-500 hover:border-transparent`;

    if (props.disabled)
        return `${base} bg-blue-500 text-white font-bold opacity-50 cursor-not-allowed`;

    return `${base} bg-blue-500 hover:bg-blue-700 text-white`;

});

</script>
