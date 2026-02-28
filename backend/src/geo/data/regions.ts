export interface RegionData {
	id: string;
	name: string;
	code: string;
	center: { lng: number; lat: number };
	bbox: [number, number, number, number];
}

export const REGIONS: RegionData[] = [
	{
		id: "11",
		name: "Île-de-France",
		code: "IDF",
		center: { lng: 2.3522, lat: 48.8566 },
		bbox: [1.4461, 48.1203, 3.5586, 49.2415],
	},
	{
		id: "24",
		name: "Centre-Val de Loire",
		code: "CVL",
		center: { lng: 1.4334, lat: 47.7516 },
		bbox: [0.0658, 46.3514, 3.1329, 48.6066],
	},
	{
		id: "27",
		name: "Bourgogne-Franche-Comté",
		code: "BFC",
		center: { lng: 4.8357, lat: 47.2805 },
		bbox: [2.837, 46.1586, 7.1662, 48.4066],
	},
	{
		id: "28",
		name: "Normandie",
		code: "NOR",
		center: { lng: 0.3658, lat: 49.1829 },
		bbox: [-1.9931, 48.1825, 1.7969, 50.0795],
	},
	{
		id: "32",
		name: "Hauts-de-France",
		code: "HDF",
		center: { lng: 2.9358, lat: 50.4801 },
		bbox: [1.3733, 48.8385, 4.2677, 51.089],
	},
	{
		id: "44",
		name: "Grand Est",
		code: "GES",
		center: { lng: 5.9342, lat: 48.6999 },
		bbox: [3.3906, 47.4193, 8.233, 50.1283],
	},
	{
		id: "52",
		name: "Pays de la Loire",
		code: "PDL",
		center: { lng: -0.5792, lat: 47.7633 },
		bbox: [-2.5575, 46.2701, 0.9211, 48.5749],
	},
	{
		id: "53",
		name: "Bretagne",
		code: "BRE",
		center: { lng: -2.7574, lat: 48.202 },
		bbox: [-5.1403, 47.279, -0.9686, 48.891],
	},
	{
		id: "75",
		name: "Nouvelle-Aquitaine",
		code: "NAQ",
		center: { lng: 0.0, lat: 45.0 },
		bbox: [-2.2275, 42.7769, 2.5974, 47.0911],
	},
	{
		id: "76",
		name: "Occitanie",
		code: "OCC",
		center: { lng: 1.4442, lat: 43.8927 },
		bbox: [-0.3275, 42.3332, 4.8412, 45.0463],
	},
	{
		id: "84",
		name: "Auvergne-Rhône-Alpes",
		code: "ARA",
		center: { lng: 4.8357, lat: 45.4472 },
		bbox: [2.0419, 44.1183, 7.178, 46.8088],
	},
	{
		id: "93",
		name: "Provence-Alpes-Côte d'Azur",
		code: "PAC",
		center: { lng: 6.0679, lat: 43.9352 },
		bbox: [4.2277, 42.9826, 7.7199, 45.1329],
	},
	{
		id: "94",
		name: "Corse",
		code: "COR",
		center: { lng: 9.0, lat: 42.0 },
		bbox: [8.5375, 41.3336, 9.5602, 43.0279],
	},
];
