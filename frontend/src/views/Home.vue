<template>
  <div class="home">
    <h1>Welcome to Your Vue.js App</h1>
    <p>This is the home view of your application.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Home',
});
</script>

<style scoped>
.home {
  text-align: center;
  margin-top: 50px;
}
</style>