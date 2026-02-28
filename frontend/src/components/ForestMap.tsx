"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import TileWMS from "ol/source/TileWMS";
import GeoJSON from "ol/format/GeoJSON";
import { Draw } from "ol/interaction";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style";
import Overlay from "ol/Overlay";
import { fromLonLat, toLonLat } from "ol/proj";
import { defaults as defaultControls } from "ol/control";
import { Feature } from "ol";
import type { Geometry } from "ol/geom";
import { geoAPI, usersAPI, MapState, PolygonAnalysis } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const SPECIES_COLORS: Record<string, string> = {
	"Chêne pédonculé": "#2d5016",
	"Chêne sessile": "#3a6b1f",
	Hêtre: "#4a7c2f",
	"Pin sylvestre": "#1a4d2e",
	"Pin maritime": "#0f3d1f",
	Épicéa: "#164d3a",
	Douglas: "#1e5631",
	Châtaignier: "#2f5f2f",
	Frêne: "#4d7c3f",
	Peuplier: "#5a8f4a",
};
const DEFAULT_FOREST_COLOR = "#22c55e";

function getSpeciesColor(species: string): string {
	return SPECIES_COLORS[species] || DEFAULT_FOREST_COLOR;
}

interface ForestMapProps {
	onMapStateChange?: (state: Partial<MapState>) => void;
}

export default function ForestMap({ onMapStateChange }: ForestMapProps) {
	const mapContainer = useRef<HTMLDivElement>(null);
	const popupRef = useRef<HTMLDivElement>(null);
	const map = useRef<Map | null>(null);
	const forestLayer = useRef<any>(null);
	const cadastreLayer = useRef<TileLayer<TileWMS> | null>(null);
	const drawInteraction = useRef<Draw | null>(null);
	const drawSource = useRef<VectorSource>(new VectorSource());
	const popupOverlay = useRef<Overlay | null>(null);
	const { user } = useAuth();

	const [isLoading, setIsLoading] = useState(true);
	const [regions, setRegions] = useState<any[]>([]);
	const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
	const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
		null,
	);
	const [visibleLayers, setVisibleLayers] = useState<string[]>(["forest"]);
	const [polygonAnalysis, setPolygonAnalysis] =
		useState<PolygonAnalysis | null>(null);
	const [showAnalysis, setShowAnalysis] = useState(false);
	const [isDrawing, setIsDrawing] = useState(false);

	const regionsRef = useRef<any[]>([]);
	const selectedRegionRef = useRef<string | null>(null);
	const visibleLayersRef = useRef<string[]>(["forest"]);

	useEffect(() => {
		regionsRef.current = regions;
	}, [regions]);
	useEffect(() => {
		selectedRegionRef.current = selectedRegion;
	}, [selectedRegion]);
	useEffect(() => {
		visibleLayersRef.current = visibleLayers;
	}, [visibleLayers]);

	useEffect(() => {
		if (user) {
			usersAPI
				.getMapState(user.id)
				.then((savedState) => {
					if (savedState && map.current) {
						const view = map.current.getView();
						view.setCenter(
							fromLonLat([savedState.longitude, savedState.latitude]),
						);
						view.setZoom(savedState.zoom);
						if (savedState.visibleLayers) {
							setVisibleLayers(savedState.visibleLayers);
						}
					}
				})
				.catch(() => {});
		}
	}, [user]);

	const saveMapState = useCallback(() => {
		if (map.current && user) {
			const view = map.current.getView();
			const center = view.getCenter();
			const zoom = view.getZoom();

			if (!center || zoom === undefined) return;

			const [lng, lat] = toLonLat(center);

			const state: Partial<MapState> = {
				latitude: lat,
				longitude: lng,
				zoom,
				visibleLayers,
				selectedRegion: selectedRegion || undefined,
				selectedDepartment: selectedDepartment || undefined,
			};

			usersAPI.updateMapState(user.id, state).catch(console.error);
			onMapStateChange?.(state);
		}
	}, [
		user,
		visibleLayers,
		selectedRegion,
		selectedDepartment,
		onMapStateChange,
	]);

	useEffect(() => {
		if (!mapContainer.current || map.current) return;

		popupOverlay.current = new Overlay({
			element: popupRef.current!,
			autoPan: { animation: { duration: 250 } },
			positioning: "bottom-center",
			offset: [0, -10],
		});

		cadastreLayer.current = new TileLayer({
			source: new TileWMS({
				url: "https://data.geopf.fr/wms-r/wms",
				params: {
					LAYERS: "CADASTRALPARCELS.PARCELLAIRE_EXPRESS",
					FORMAT: "image/png",
					TRANSPARENT: "true",
					CRS: "EPSG:3857",
				},
			}),
			opacity: 0.7,
			minZoom: 14,
			visible: false,
			properties: { name: "cadastre" },
		});

		const drawLayer = new VectorLayer({
			source: drawSource.current,
			style: new Style({
				fill: new Fill({ color: "rgba(34, 197, 94, 0.2)" }),
				stroke: new Stroke({ color: "#16a34a", width: 2 }),
				image: new CircleStyle({
					radius: 5,
					fill: new Fill({ color: "#16a34a" }),
				}),
			}),
		});

		map.current = new Map({
			target: mapContainer.current,
			controls: defaultControls(),
			layers: [
				new TileLayer({
					source: new XYZ({
						url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
						attributions:
							"Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
						maxZoom: 19,
					}),
					properties: { name: "satellite" },
				}),
				new TileLayer({
					source: new OSM(),
					opacity: 0.35,
					properties: { name: "labels" },
				}),
				cadastreLayer.current,
				drawLayer,
			],
			view: new View({
				center: fromLonLat([2.5, 48.5]),
				zoom: 8,
			}),
		});

		map.current.addOverlay(popupOverlay.current);

		map.current.on("moveend", () => {
			saveMapState();
			loadForestForViewport();
		});

		map.current.on("singleclick", async (evt) => {
			if (!map.current) return;

			const forestFeature = map.current.forEachFeatureAtPixel(
				evt.pixel,
				(feature) => feature,
				{ layerFilter: (layer) => layer === forestLayer.current },
			);

			if (forestFeature) {
				const props = forestFeature.getProperties();
				const coordinate = evt.coordinate;

				if (popupRef.current) {
					popupRef.current.innerHTML = `
						<div class="bg-white rounded-lg shadow-lg p-3 min-w-[200px]">
							<div class="flex justify-between items-start mb-1">
								<h3 class="font-bold text-green-800">${props.species || "Unknown"}</h3>
								<button onclick="this.closest('.ol-overlay-container').style.display='none'" class="text-gray-400 hover:text-gray-600 ml-2">&times;</button>
							</div>
							<p class="text-sm text-gray-600">Type: ${props.type || "N/A"}</p>
							<p class="text-sm text-gray-600">Area: ${props.area_ha?.toFixed(2) || "N/A"} ha</p>
							<p class="text-sm text-gray-600">Height: ${props.height?.toFixed(1) || "N/A"} m</p>
						</div>
					`;
					popupOverlay.current?.setPosition(coordinate);
				}
				return;
			}

			popupOverlay.current?.setPosition(undefined);

			const view = map.current.getView();
			const zoom = view.getZoom() || 6;
			const [lng, lat] = toLonLat(evt.coordinate);

			if (zoom < 8) {
				const clickedRegion = regionsRef.current.find((region) => {
					const [minLng, minLat, maxLng, maxLat] = region.bbox;
					return (
						lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat
					);
				});

				if (clickedRegion) {
					setSelectedRegion(clickedRegion.id);
					view.animate({
						center: fromLonLat([
							clickedRegion.center.lng,
							clickedRegion.center.lat,
						]),
						zoom: 8,
						duration: 800,
					});
				}
			} else if (zoom >= 8 && zoom < 11 && selectedRegionRef.current) {
				const depts = await geoAPI.getDepartments(selectedRegionRef.current);
				const clickedDept = depts.find((dept) => {
					const distance = Math.sqrt(
						Math.pow(lng - dept.center.lng, 2) +
							Math.pow(lat - dept.center.lat, 2),
					);
					return distance < 0.5;
				});

				if (clickedDept) {
					setSelectedDepartment(clickedDept.id);
					view.animate({
						center: fromLonLat([
							clickedDept.center.lng,
							clickedDept.center.lat,
						]),
						zoom: 11,
						duration: 800,
					});
				}
			}
		});

		map.current.on("pointermove", (evt) => {
			if (!map.current) return;
			const hit = map.current.forEachFeatureAtPixel(evt.pixel, () => true, {
				layerFilter: (layer) => layer === forestLayer.current,
			});
			const target = map.current.getTargetElement() as HTMLElement;
			target.style.cursor = hit ? "pointer" : "";
		});

		geoAPI.getRegions().then(async (regionsData) => {
			setRegions(regionsData);
			setIsLoading(false);
			loadForestForViewport();
		});

		return () => {
			map.current?.setTarget(undefined);
			map.current = null;
		};
	}, []);

	const addForestLayer = (forestData: any) => {
		if (!map.current) return;

		if (forestLayer.current) {
			map.current.removeLayer(forestLayer.current);
			forestLayer.current = null;
		}

		const source = new VectorSource({
			features: new GeoJSON().readFeatures(forestData, {
				featureProjection: "EPSG:3857",
			}),
		});

		forestLayer.current = new VectorLayer({
			source,
			style: (feature) => {
				const species = feature.get("species") || "";
				return new Style({
					fill: new Fill({
						color: hexToRgba(getSpeciesColor(species), 0.6),
					}),
					stroke: new Stroke({
						color: "#155e25",
						width: 1,
					}),
				});
			},
			properties: { name: "forest" },
			visible: visibleLayersRef.current.includes("forest"),
			renderBuffer: 100,
			updateWhileAnimating: false,
			updateWhileInteracting: false,
		});

		if (map.current && forestLayer.current) {
			map.current.addLayer(forestLayer.current);
		}
	};

	const loadForestForViewportTimer = useRef<NodeJS.Timeout | null>(null);
	const loadForestForViewport = useCallback(() => {
		if (loadForestForViewportTimer.current) {
			clearTimeout(loadForestForViewportTimer.current);
		}
		loadForestForViewportTimer.current = setTimeout(async () => {
			if (!map.current) return;

			if (!visibleLayersRef.current.includes("forest")) return;

			const view = map.current.getView();
			const zoom = view.getZoom() || 6;

			if (zoom < 7) {
				if (forestLayer.current && map.current) {
					map.current.removeLayer(forestLayer.current);
					forestLayer.current = null;
				}
				return;
			}

			const extent = view.calculateExtent(map.current.getSize());
			const [minLng, minLat] = toLonLat([extent[0], extent[1]]);
			const [maxLng, maxLat] = toLonLat([extent[2], extent[3]]);

			const limit = zoom >= 12 ? 3000 : zoom >= 10 ? 2000 : 1000;

			try {
				const forestData = await geoAPI.getForestByBbox(
					[minLng, minLat, maxLng, maxLat],
					limit,
					Math.round(zoom),
				);
				if (forestData && forestData.features) {
					addForestLayer(forestData);
				}
			} catch (err) {
				console.error("Failed to load forest data for viewport:", err);
			}
		}, 300);
	}, []);

	const toggleDrawing = () => {
		if (!map.current) return;

		if (isDrawing && drawInteraction.current) {
			map.current.removeInteraction(drawInteraction.current);
			drawInteraction.current = null;
			setIsDrawing(false);
		} else {
			drawInteraction.current = new Draw({
				source: drawSource.current,
				type: "Polygon",
			});

			drawInteraction.current.on("drawend", async (evt) => {
				const geojsonFormat = new GeoJSON();
				const geojsonGeom = geojsonFormat.writeGeometryObject(
					evt.feature.getGeometry()!,
					{
						featureProjection: "EPSG:3857",
						dataProjection: "EPSG:4326",
					},
				);

				try {
					const analysis = await geoAPI.analyzePolygon(geojsonGeom);
					setPolygonAnalysis(analysis);
					setShowAnalysis(true);
				} catch (error) {
					console.error("Analysis error:", error);
				}
			});

			map.current.addInteraction(drawInteraction.current);
			setIsDrawing(true);
		}
	};

	const clearDrawings = () => {
		drawSource.current.clear();
		setPolygonAnalysis(null);
		setShowAnalysis(false);
	};

	const toggleLayer = (layer: string) => {
		setVisibleLayers((prev) => {
			const next = prev.includes(layer)
				? prev.filter((l) => l !== layer)
				: [...prev, layer];

			if (layer === "forest") {
				if (forestLayer.current) {
					forestLayer.current.setVisible(next.includes("forest"));
				}
				if (next.includes("forest")) {
					visibleLayersRef.current = next;
					loadForestForViewport();
				}
			}

			if (layer === "cadastre" && cadastreLayer.current) {
				cadastreLayer.current.setVisible(next.includes("cadastre"));
			}

			return next;
		});
	};

	return (
		<div className="relative w-full h-full">
			<div ref={mapContainer} className="absolute inset-0" />

			<div ref={popupRef} />

			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
					<div className="text-white text-xl">Loading map...</div>
				</div>
			)}

			<div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 space-y-2 z-10">
				<h3 className="font-bold text-sm mb-2">Layers</h3>
				<label className="flex items-center space-x-2 text-sm">
					<input
						type="checkbox"
						checked={visibleLayers.includes("forest")}
						onChange={() => toggleLayer("forest")}
						className="rounded text-forest-600"
					/>
					<span>BD Forêt</span>
				</label>
				<label className="flex items-center space-x-2 text-sm">
					<input
						type="checkbox"
						checked={visibleLayers.includes("cadastre")}
						onChange={() => toggleLayer("cadastre")}
						className="rounded text-forest-600"
					/>
					<span>Cadastre</span>
				</label>

				<hr className="my-2" />
				<h3 className="font-bold text-sm mb-2">Drawing Tools</h3>
				<button
					onClick={toggleDrawing}
					className={`w-full px-3 py-1.5 text-xs rounded font-medium transition-colors ${
						isDrawing
							? "bg-red-500 hover:bg-red-600 text-white"
							: "bg-forest-600 hover:bg-forest-700 text-white"
					}`}
				>
					{isDrawing ? "Stop Drawing" : "Draw Polygon"}
				</button>
				<button
					onClick={clearDrawings}
					className="w-full px-3 py-1.5 text-xs rounded font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
				>
					Clear Drawings
				</button>
			</div>

			<div className="absolute top-4 right-14 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10">
				<h3 className="font-bold text-sm mb-2">🗺️ Navigation</h3>
				<ul className="text-xs space-y-1 text-gray-700">
					<li>
						• <strong>BD Forêt</strong> appears when you zoom in (level 7+)
					</li>
					<li>
						• <strong>Cadastre</strong> parcels appear at high zoom (level 14+)
					</li>
					<li>• Click a region to zoom in, then a department</li>
					<li>• Use the polygon tool to analyze forest coverage</li>
					<li>
						• Your map position, zoom &amp; layers are{" "}
						<strong>saved automatically</strong>
					</li>
				</ul>
			</div>

			<div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10">
				<h3 className="font-bold text-sm mb-2">Tree Species</h3>
				<div className="space-y-1 text-xs">
					<div className="flex items-center space-x-2">
						<div
							className="w-4 h-4 rounded"
							style={{ backgroundColor: "#2d5016" }}
						></div>
						<span>Oak (Pédonculé)</span>
					</div>
					<div className="flex items-center space-x-2">
						<div
							className="w-4 h-4 rounded"
							style={{ backgroundColor: "#4a7c2f" }}
						></div>
						<span>Beech (Hêtre)</span>
					</div>
					<div className="flex items-center space-x-2">
						<div
							className="w-4 h-4 rounded"
							style={{ backgroundColor: "#1a4d2e" }}
						></div>
						<span>Pine (Sylvestre)</span>
					</div>
					<div className="flex items-center space-x-2">
						<div
							className="w-4 h-4 rounded"
							style={{ backgroundColor: "#22c55e" }}
						></div>
						<span>Other</span>
					</div>
				</div>
			</div>

			{showAnalysis && polygonAnalysis && (
				<div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-10">
					<div className="flex justify-between items-start mb-2">
						<h3 className="font-bold text-sm">📊 Polygon Analysis</h3>
						<button
							onClick={() => setShowAnalysis(false)}
							className="text-gray-500 hover:text-gray-700"
						>
							✕
						</button>
					</div>
					<div className="space-y-2 text-sm">
						<div>
							<strong>Total Area:</strong> {polygonAnalysis.areaHectares} ha
						</div>
						<div>
							<strong>Forest Coverage:</strong> {polygonAnalysis.forestCoverage}
							%
						</div>
						<div>
							<strong>Forest Area:</strong>{" "}
							{polygonAnalysis.totalForestAreaHectares} ha
						</div>
						{polygonAnalysis.parcels.length > 0 && (
							<div>
								<strong>Parcels:</strong>
								<ul className="text-xs ml-4 mt-1">
									{polygonAnalysis.parcels.slice(0, 5).map((parcel) => (
										<li key={parcel}>• {parcel}</li>
									))}
									{polygonAnalysis.parcels.length > 5 && (
										<li>... and {polygonAnalysis.parcels.length - 5} more</li>
									)}
								</ul>
							</div>
						)}
						{polygonAnalysis.treeSpecies.length > 0 && (
							<div>
								<strong>Tree Species:</strong>
								<ul className="text-xs ml-4 mt-1">
									{polygonAnalysis.treeSpecies.map((species) => (
										<li key={species.species}>
											• {species.species}: {species.areaHectares} ha (
											{species.percentage}%)
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

function hexToRgba(hex: string, alpha: number): string {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
