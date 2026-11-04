
"use client";

import "./forgot-password.css";
import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setError("Please enter your email address.");
            setMessage("");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(trimmedEmail)) {
            setError("Please enter a valid email address.");
            setMessage("");
            return;
        }

        setError("");
        setMessage(
            "If an account exists for this email, password reset instructions will be sent."
        );
    }

    return (
        <main className="forgot-page flex items-center justify-center px-4 py-12">
            {/* Background */}
            <div className="forgot-background" />

            {/* Background overlay */}
            <div className="forgot-overlay" />

            {/* Main Card */}
            <section className="forgot-card">
                <div className="forgot-content">

                    {/* Top decoration */}
                    <div className="mx-auto mb-8 h-[2px] w-24 bg-gradient-to-r from-transparent via-[#EBC17B] to-transparent" />

                    {/* Brand */}
                    <div className="mb-8 text-center">
                        <img
                            src="/images/scentstation-logo.png"
                            alt="ScentStation Logo"
                            className="forgot-logo mx-auto mb-3 h-23 w-23 object-contain"
                        />

                        <h2 className="font-serif text-2xl tracking-wide text-[#FFF0D7]">
                            ScentStation
                        </h2>

                        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#D8A75E]">
                            Smart Fragrance Experience
                        </p>
                    </div>

                    {/* Heading */}
                    <div className="mb-10 text-center">
                        <h1 className="forgot-title font-serif text-4xl font-bold leading-tight sm:text-5xl">
                            Forgot Password?
                        </h1>

                        <p className="forgot-description mx-auto mt-5 max-w-[480px] text-sm sm:text-base">
                            Enter the email address associated with your account.
                            <br />
                            We will help you reset your password.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} noValidate className="space-y-6">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-3 block text-sm font-semibold text-[#FFF0DC]"
                            >
                                Email address
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"

                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value);
                                    setMessage("");
                                }}
                                placeholder="Enter your email"
                                className="forgot-input"
                            />
                            {error && (
                                <p
                                    className="mt-2 text-sm text-[#FFB4A8]"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="forgot-button"
                        >
                            Send Reset Instructions
                        </button>

                        {/* Feedback */}
                        {message && (
                            <p
                                role="status"
                                className="rounded-xl border border-[#E8BD7D]/40 bg-[#3D2924]/80 p-4 text-sm leading-6 text-[#FFF2DE]"
                            >
                                {message}
                            </p>
                        )}

                        {/* Divider */}
                        <div className="forgot-divider">
                            <span>✦</span>
                        </div>

                        {/* Back to Login */}
                        <div className="pt-1 text-center">
                            <Link
                                href="/login"
                                className="forgot-back"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </form>

                    {/* Bottom decoration */}
                    <div className="mx-auto mt-10 h-[2px] w-24 bg-gradient-to-r from-transparent via-[#EBC17B] to-transparent" />
                </div>
            </section>
        </main>
    );
}
