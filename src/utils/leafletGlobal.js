import L from 'leaflet';

// leaflet-draw (imported for its side effects wherever drawing tools are
// needed) is a legacy plugin that expects a global `window.L` - it was
// written for script-tag usage and reads `L` from the global scope rather
// than importing 'leaflet' itself. This app otherwise only ever consumes
// Leaflet as an ES module, which never sets that global, so this has to run
// (as its own module, evaluated before any `import 'leaflet-draw'`) to
// bridge the two.
if (typeof window !== 'undefined' && !window.L) {
  window.L = L;
}

export default L;
