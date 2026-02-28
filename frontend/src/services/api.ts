import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem("token");
			localStorage.removeItem("user");
			window.location.href = "/login";
		}
		return Promise.reject(error);
	},
);

export interface User {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
}

export interface MapState {
	latitude: number;
	longitude: number;
	zoom: number;
	activeFilters?: string[];
	visibleLayers?: string[];
	selectedRegion?: string;
	selectedDepartment?: string;
	selectedCommune?: string;
}

export interface Region {
	id: string;
	name: string;
	code: string;
	center: { lng: number; lat: number };
	bbox: number[];
}

export interface Department {
	id: string;
	name: string;
	center: { lng: number; lat: number };
}

export interface Commune {
	id: string;
	name: string;
	center: { lng: number; lat: number };
}

export interface ForestFeature {
	type: "Feature";
	id: string;
	geometry: {
		type: string;
		coordinates: any;
	};
	properties: {
		species: string;
		type: string;
		density: number;
		height: number;
		area_ha: number;
	};
}

export interface PolygonAnalysis {
	areaHectares: number;
	parcels: string[];
	treeSpecies: {
		species: string;
		areaHectares: number;
		percentage: number;
	}[];
	totalForestAreaHectares: number;
	forestCoverage: number;
}

export const authAPI = {
	register: async (data: {
		email: string;
		firstName: string;
		lastName: string;
		password: string;
	}) => {
		const response = await api.post("/auth/register", data);
		return response.data;
	},

	login: async (email: string, password: string) => {
		const response = await api.post("/auth/login", { email, password });
		return response.data;
	},

	getProfile: async () => {
		const response = await api.get("/auth/profile");
		return response.data;
	},
};

export const usersAPI = {
	getMapState: async (userId: string): Promise<MapState> => {
		const response = await api.get(`/users/${userId}/map-state`);
		return response.data;
	},

	updateMapState: async (userId: string, mapState: Partial<MapState>) => {
		const response = await api.put(`/users/${userId}/map-state`, mapState);
		return response.data;
	},
};

export const geoAPI = {
	getRegions: async (): Promise<Region[]> => {
		const response = await api.get("/geo/regions");
		return response.data;
	},

	getDepartments: async (regionId: string): Promise<Department[]> => {
		const response = await api.get(`/geo/departments/${regionId}`);
		return response.data;
	},

	getCommunes: async (departmentId: string): Promise<Commune[]> => {
		const response = await api.get(`/geo/communes/${departmentId}`);
		return response.data;
	},

	getForestData: async (zoneId: string, type?: string) => {
		const response = await api.get(`/geo/forest/${zoneId}`, {
			params: { type },
		});
		return response.data;
	},

	getForestByBbox: async (bounds: number[], limit?: number, zoom?: number) => {
		const response = await api.get("/geo/forest/bbox", {
			params: { bounds: bounds.join(","), limit, zoom },
		});
		return response.data;
	},

	getCadastre: async (bounds: number[]) => {
		const response = await api.get("/geo/cadastre", {
			params: { bounds: bounds.join(",") },
		});
		return response.data;
	},

	analyzePolygon: async (geometry: any): Promise<PolygonAnalysis> => {
		const response = await api.post("/geo/analyze-polygon", { geometry });
		return response.data;
	},
};

export default api;
