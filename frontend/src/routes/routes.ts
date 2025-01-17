import {createRouter, createWebHistory} from "vue-router";

const routes = [
//   {
//     path: "/",
//     name: "home",
//     component: () => import("../views/Home.vue"),
//   },
  {
    path: "/",
    name: "cube",
    component: () => import("../views/CubeEmotions.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes,
});

export default router;

