import { createApp } from 'vue';
import App from './app.vue';
import router from './routes/routes';
import "@/assets/scss/main.scss";

const app = createApp(App);

app.use(router)

app.mount('#app');