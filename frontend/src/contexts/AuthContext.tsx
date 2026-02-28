"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI, User } from "@/services/api";

interface AuthContextType {
	user: User | null;
	token: string | null;
	login: (email: string, password: string) => Promise<void>;
	register: (data: {
		email: string;
		firstName: string;
		lastName: string;
		password: string;
	}) => Promise<void>;
	logout: () => void;
	isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const storedToken = localStorage.getItem("token");
		const storedUser = localStorage.getItem("user");

		if (storedToken && storedUser) {
			setToken(storedToken);
			setUser(JSON.parse(storedUser));
		}
		setIsLoading(false);
	}, []);

	const login = async (email: string, password: string) => {
		try {
			const response = await authAPI.login(email, password);
			const { access_token, user: userData } = response;

			localStorage.setItem("token", access_token);
			localStorage.setItem("user", JSON.stringify(userData));

			setToken(access_token);
			setUser(userData);

			router.push("/dashboard");
		} catch (error) {
			console.error("Login error:", error);
			throw error;
		}
	};

	const register = async (data: {
		email: string;
		firstName: string;
		lastName: string;
		password: string;
	}) => {
		try {
			const response = await authAPI.register(data);
			const { access_token, user: userData } = response;

			localStorage.setItem("token", access_token);
			localStorage.setItem("user", JSON.stringify(userData));

			setToken(access_token);
			setUser(userData);

			router.push("/dashboard");
		} catch (error) {
			console.error("Registration error:", error);
			throw error;
		}
	};

	const logout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		setToken(null);
		setUser(null);
		router.push("/login");
	};

	return (
		<AuthContext.Provider
			value={{ user, token, login, register, logout, isLoading }}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
