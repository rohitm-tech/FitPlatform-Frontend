import { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../discover.css";

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  label: string;
};

type Props = {
  center: { lat: number; lng: number };
  radiusKm?: number;
  pins: MapPin[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onPick?: (lat: number, lng: number) => void;
  layoutKey?: string;
};

export function ReachMap({
  center,
  radiusKm,
  pins,
  selectedId,
  onSelect,
  onPick,
  layoutKey = "",
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const shapesRef = useRef<L.LayerGroup | null>(null);
  const pinsRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  const onPickRef = useRef(onPick);
  onSelectRef.current = onSelect;
  onPickRef.current = onPick;

  useEffect(() => {
    const el = host.current;
    if (!el || mapRef.current) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const map = L.map(el, {
      zoomControl: false,
      zoomAnimation: !reduce,
      fadeAnimation: !reduce,
      markerZoomAnimation: !reduce,
    }).setView([center.lat, center.lng], 13);
    L.control
      .zoom({ zoomInText: "+", zoomOutText: "-", position: "topleft" })
      .addTo(map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    shapesRef.current = L.layerGroup().addTo(map);
    pinsRef.current = L.layerGroup().addTo(map);
    map.on("click", (event) => {
      onPickRef.current?.(
        Math.round(event.latlng.lat * 1e5) / 1e5,
        Math.round(event.latlng.lng * 1e5) / 1e5,
      );
    });
    mapRef.current = map;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(el);
    const frame = window.requestAnimationFrame(() => map.invalidateSize());
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      shapesRef.current = null;
      pinsRef.current = null;
    };
    // The map instance is created once; later effects move it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const shapes = shapesRef.current;
    if (!map || !shapes) return;
    shapes.clearLayers();
    if (radiusKm && radiusKm > 0) {
      const circle = L.circle([center.lat, center.lng], {
        radius: radiusKm * 1000,
        color: "var(--fp-accent)",
        weight: 1.5,
        fillColor: "var(--fp-accent)",
        fillOpacity: 0.08,
      });
      circle.addTo(shapes);
      map.fitBounds(circle.getBounds(), { padding: [28, 28], animate: false });
    } else {
      map.setView([center.lat, center.lng], 15, { animate: false });
    }
    map.invalidateSize();
  }, [center.lat, center.lng, radiusKm, layoutKey]);

  useEffect(() => {
    const pinsLayer = pinsRef.current;
    if (!pinsLayer) return;
    pinsLayer.clearLayers();
    for (const pin of pins) {
      const selected = pin.id === selectedId;
      const marker = L.marker([pin.lat, pin.lng], {
        title: pin.label,
        keyboard: true,
        icon: L.divIcon({
          className: "near-pin-wrap",
          html: `<span class="near-pin${selected ? " is-selected" : ""}"></span>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
      });
      marker.on("click", (event) => {
        L.DomEvent.stopPropagation(event.originalEvent);
        onSelectRef.current?.(pin.id);
      });
      marker.addTo(pinsLayer);
    }
  }, [pins, selectedId]);

  return <div ref={host} className="near-map" role="presentation" />;
}
