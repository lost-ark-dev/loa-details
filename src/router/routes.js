const routes = [
  {
    path: "/prelauncher",
    component: () => import("layouts/PrelauncherLayout.vue"),
  },
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: () => import("pages/IndexPage.vue") },
      { path: "/settings", component: () => import("pages/SettingsPage.vue") },
      { path: "/logs", component: () => import("pages/LogsPage.vue") },
    ],
  },
  {
    path: "/damage-meter",
    component: () => import("layouts/DamageMeter.vue"),
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
