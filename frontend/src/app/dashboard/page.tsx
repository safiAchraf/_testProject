"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";

const ForestMap = dynamic(() => import("@/components/ForestMap"), {
	ssr: false,
	loading: () => (
		<div className="flex items-center justify-center h-full">
			<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600"></div>
		</div>
	),
});

export default function DashboardPage() {
	const router = useRouter();
	const { user, logout, isLoading } = useAuth();

	useEffect(() => {
		if (!isLoading && !user) {
			router.push("/login");
		}
	}, [user, isLoading, router]);

	if (isLoading || !user) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600"></div>
			</div>
		);
	}

	return (
		<div className="h-screen flex flex-col">
			<header className="bg-forest-700 text-white shadow-lg z-10">
				<div className="px-6 py-4 flex justify-between items-center">
					<div className="flex items-center space-x-4">
						<h1 className="text-2xl font-bold">French Forest Explorer</h1>
						<span className="text-sm opacity-75">BD Foret Visualization </span>
					</div>
					<div className="flex items-center space-x-4">
						<span className="text-sm">
							Welcome, {user.firstName} {user.lastName}
						</span>
						<button
							onClick={logout}
							className="px-4 py-2 bg-forest-600 hover:bg-forest-500 rounded-md text-sm font-medium transition-colors"
						>
							Logout
						</button>
					</div>
				</div>
			</header>

			<div className="flex-1 relative">
				<ForestMap />
			</div>

			<footer className="bg-gray-800 text-white py-2 px-6 text-xs z-10">
				<div className="flex justify-between items-center">
					<div>Data sources: BD Forêt® V2 (IGN) • French Cadastre (Etalab)</div>
					<div>Last updated: {new Date().toLocaleDateString()}</div>
				</div>
			</footer>
		</div>
	);
}
