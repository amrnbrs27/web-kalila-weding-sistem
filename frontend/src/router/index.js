import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/katalog",
    name: "catalog",
    component: () => import("../views/CatalogView.vue"),
  },
  {
    path: "/katalog/:category",
    name: "catalog-category",
    component: () => import("../views/CatalogView.vue"),
  },
  {
    path: "/paket/:id",
    name: "package-detail",
    component: () => import("../views/DetailView.vue"),
  },
  {
    path: "/booking/:packageId",
    name: "booking",
    component: () => import("../views/BookingView.vue"),
  },
  {
    path: "/portofolio",
    name: "portfolio",
    component: () => import("../views/PortfolioView.vue"),
  },
  {
    path: "/blog",
    name: "blog",
    component: () => import("../views/BlogView.vue"),
  },
  {
    path: "/kontak",
    name: "contact",
    component: () => import("../views/ContactView.vue"),
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue"),
  },
  {
    path: "/register",
    name: "register",
    component: () => import("../views/RegisterView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
