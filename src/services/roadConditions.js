// Display config for a Road's `condition` field (see ROAD_MODULE in
// src/pages/Admin/entityModules.js - the same 3 values back its save-form
// select). Not demo data - every real road, admin-drawn or otherwise,
// needs this lookup to render its color/label, so it lives on its own
// instead of inside the (now-removed) mock seed data file.
export const ROAD_CONDITIONS = {
  asphalt: { color: '#10b981', label: 'Asfalt (yaxshi holat)' },
  gravel: { color: '#f59e0b', label: "Shagʻal (oʻrtacha holat)" },
  dirt: { color: '#ef4444', label: 'Tuproq yoʻl (yomon holat)' },
};
