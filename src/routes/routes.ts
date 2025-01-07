import {createRouter, createWebHistory} from "vue-router";

const routes = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/Home.vue"),
  },
  {
    path: "/cube",
    name: "cube",
    component: () => import("../views/Cube.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

