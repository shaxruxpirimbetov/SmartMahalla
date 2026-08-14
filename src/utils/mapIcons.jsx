import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import L from './leafletGlobal';

// Leaflet markers are raw DOM/HTML, not React - a lucide-react component
// can't be handed to L.divIcon directly, it has to become an HTML string
// first. `react-dom/server`'s renderToStaticMarkup does that too, but it
// ships its own ~50KB(gzip) server-renderer bundle just for this - weight
// this app doesn't otherwise need, since it's a client-only SPA. Every
// other piece of that job (mounting a React element, turning it into DOM)
// is already covered by react-dom/client, which is loaded anyway - so this
// mounts the icon into a detached, off-DOM container with the *client*
// renderer, forces it synchronous with flushSync, reads back the resulting
// markup, and unmounts. Same output as renderToStaticMarkup, zero added
// bundle weight.
function iconToSvgMarkup(Icon, props) {
  const container = document.createElement('div');
  const root = createRoot(container);
  flushSync(() => {
    root.render(<Icon {...props} />);
  });
  const markup = container.innerHTML;
  root.unmount();
  return markup;
}

// Turns a lucide-react icon into a Leaflet divIcon: rendered once to a
// static SVG string and dropped inside a solid, white-bordered, drop-
// shadowed circle (see `.lucide-marker*` in mapTheme.scss) so Business/
// Farmer markers read clearly at a glance against the satellite basemap
// instead of blending into it like the old default-pin/emoji markers did.
export function createLucideMarkerIcon(Icon, { modifier, size = 44, iconSize = 26 } = {}) {
  const svg = iconToSvgMarkup(Icon, { size: iconSize, strokeWidth: 2.25, color: '#ffffff' });
  const modifierClass = modifier ? ` lucide-marker--${modifier}` : '';

  return L.divIcon({
    className: 'lucide-marker-wrapper',
    html: `<span class="lucide-marker${modifierClass}">${svg}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 2],
  });
}

// Center of a polygon's bounding box, in Leaflet [lat, lng] order - used to
// plant a Farmer's Tractor marker in the middle of its plot instead of at a
// vertex. `positions` is the same [lat, lng][] shape polygonToPositions()
// (src/utils/geo.js) already produces for the <Polygon> itself.
export function polygonCenter(positions) {
  if (!positions.length) return null;
  return L.latLngBounds(positions).getCenter();
}
