"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import Link from "next/link";
import { useRouter } from "next/navigation";

const RegisterPage = () => {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password !== confirmPwd) {
      setError("Passwords do not match.");
      return;
    }
    // Store new user in localStorage as a mock registration
    const newUser = {
      id: `member-${Date.now()}`,
      fullName: fullName || "Member",
      email,
      mobileNumber: "",
      membershipType: "Standard",
      membershipStartDate: new Date().toISOString().split("T")[0],
      membershipEndDate: "2099-12-31",
      role: "member",
      status: "Active",
      learningLevel: "",
      profilePhoto: "https://via.placeholder.com/150",
      password,
    };
    const stored = localStorage.getItem("fsp_registered_users");
    const users = stored ? JSON.parse(stored) : [];
    users.push(newUser);
    localStorage.setItem("fsp_registered_users", JSON.stringify(users));
    // after registration, go to login page
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Membership Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name (optional)
              </label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@domain.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="********"
              />
            </div>
            <div>
              <label htmlFor="confirmPwd" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <Input
                id="confirmPwd"
                type="password"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                required
                placeholder="********"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full">
              Register
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            Already have an account? Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterPage;
