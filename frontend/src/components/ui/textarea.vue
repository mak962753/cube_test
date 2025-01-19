<template>
    <textarea
        :disabled="disabled"
        :value="modelValue"
        :class="css"
        @input="handleInput"
    >
    </textarea>
</template>

<script lang="ts" setup>

import { computed } from 'vue';

const props = defineProps({
  modelValue: String,
  disabled: Boolean,
});

const emit = defineEmits(['update:modelValue']);

const css = computed(() => {
    const base = "p-2 border rounded-md ";

    if (props.disabled)
        return `${base} bg-gray-200 border-blue-200`;

    return `${base}focus:outline-none border-blue-500 focus:ring-2 focus:ring-blue-500`

});

function handleInput(e: InputEvent) {
    if (!e.target) {
        return;
    }

    const value: String = String((<any>e.target).value);
    emit('update:modelValue', value)
}

</script>