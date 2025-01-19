<template>
  <div class="relative z-0 w-full mb-5 group">
      <select
        :id="id"
        :name="id"
        class="block p-2.5 w-full bg-transparent border-0 border-b-2 border-gray-300 appearance-none  text-gray-900 text-sm  focus:outline-none focus:ring-0 focus:border-blue-600 peer"
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option
            v-for="option in options"
            :key="option.value"
            :value="option.value">{{ option.label }}
        </option>

      </select>

      <label
        v-if="label"
        :for="id"
        class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
            {{label}}
    </label>
  </div>
</template>
<script lang="ts" setup>
import { generateUUID } from '@/services/uid';


interface Props {
    modelValue: string|number;
    label: string;
    options: Array<{value: string|number, label: string}>;
}

defineProps<Props>()

defineEmits(['update:modelValue']);

const id = generateUUID();

</script>