"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function RegisterPage() {
	const [formData, setFormData] = useState({
		email: "",
		firstName: "",
		lastName: "",
		password: "",
		confirmPassword: "",
	});
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { register } = useAuth();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (formData.password !== formData.confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		if (formData.password.length < 6) {
			setError("Password must be at least 6 characters");
			return;
		}

		setIsLoading(true);

		try {
			await register({
				email: formData.email,
				firstName: formData.firstName,
				lastName: formData.lastName,
				password: formData.password,
			});
		} catch (err: any) {
			setError(err.response?.data?.message || "Registration failed");
		} finally {
			setIsLoading(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-50 to-forest-100">
			<div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl">
				<div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
						🌲 Create Account
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						Join to explore French forest data
					</p>
				</div>
				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					<div className="space-y-4">
						<div>
							<label htmlFor="firstName" className="sr-only">
								First Name
							</label>
							<input
								id="firstName"
								name="firstName"
								type="text"
								required
								className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-forest-500 focus:border-forest-500 sm:text-sm"
								placeholder="First Name"
								value={formData.firstName}
								onChange={handleChange}
							/>
						</div>
						<div>
							<label htmlFor="lastName" className="sr-only">
								Last Name
							</label>
							<input
								id="lastName"
								name="lastName"
								type="text"
								required
								className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-forest-500 focus:border-forest-500 sm:text-sm"
								placeholder="Last Name"
								value={formData.lastName}
								onChange={handleChange}
							/>
						</div>
						<div>
							<label htmlFor="email" className="sr-only">
								Email address
							</label>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-forest-500 focus:border-forest-500 sm:text-sm"
								placeholder="Email address"
								value={formData.email}
								onChange={handleChange}
							/>
						</div>
						<div>
							<label htmlFor="password" className="sr-only">
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								required
								className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-forest-500 focus:border-forest-500 sm:text-sm"
								placeholder="Password (min 6 characters)"
								value={formData.password}
								onChange={handleChange}
							/>
						</div>
						<div>
							<label htmlFor="confirmPassword" className="sr-only">
								Confirm Password
							</label>
							<input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								required
								className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-forest-500 focus:border-forest-500 sm:text-sm"
								placeholder="Confirm Password"
								value={formData.confirmPassword}
								onChange={handleChange}
							/>
						</div>
					</div>

					{error && (
						<div className="text-red-500 text-sm text-center">{error}</div>
					)}

					<div>
						<button
							type="submit"
							disabled={isLoading}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-forest-600 hover:bg-forest-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest-500 disabled:opacity-50"
						>
							{isLoading ? "Creating account..." : "Register"}
						</button>
					</div>

					<div className="text-center">
						<Link
							href="/login"
							className="font-medium text-forest-600 hover:text-forest-500"
						>
							Already have an account? Sign in
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
}
