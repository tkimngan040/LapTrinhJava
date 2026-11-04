"use client";
import { mockLogin } from "@/mocks";
import {
    useState,
    type FormEvent,
    type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";


export default function LoginPage() {
    const router = useRouter();

    const [language, setLanguage] = useState<"en" | "vi">("en");
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

    function handleLanguageChange(nextLanguage: "en" | "vi") {
        setLanguage(nextLanguage);
        setIsLanguageMenuOpen(false);
    }


    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [loading, setLoading] = useState(false);


    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (loading) return;

        // Reset validation errors
        setError("");
        setEmailError("");
        setPasswordError("");

        let isValid = true;

        // Validate email
        if (!email.trim()) {
            setEmailError("Please enter your email address.");
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setEmailError("Please enter a valid email address.");
            isValid = false;
        }

        // Validate password
        if (!password.trim()) {
            setPasswordError("Please enter your password.");
            isValid = false;
        }

        if (!isValid) return;

        setLoading(true);

        try {
            const response = mockLogin(email, password);

            sessionStorage.setItem("scentstation-token", response.token);
            sessionStorage.setItem("scentstation-user", JSON.stringify(response.user));
            sessionStorage.setItem("scentstation-remember", String(rememberMe));

            sessionStorage.setItem("scentstation-demo-user", JSON.stringify(response.user));
            sessionStorage.setItem("scentstation-demo-role", response.user.roles[0] ?? "VW");
            sessionStorage.setItem("scentstation-demo-remember", String(rememberMe));

            router.push("/dashboard");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to sign in. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }


    return (

        <main className="relative h-[100dvh] w-full overflow-hidden bg-[#21140d] text-[#281b12]">

        {/* Floating glitter overlay */}
            <div className="flower-glitter-layer" aria-hidden="true">
                {Array.from({ length: 32 }).map((_, i) => (
                    <span
                        key={i}
                        className="flower-glitter"
                        style={{
                            left: `${(i * 37 + 11) % 100}%`,
                            top: `${(i * 53 + 7) % 100}%`,
                            animationDelay: `${-(i % 8) * 0.45}s`,
                            animationDuration: `${3 + (i % 5)}s`,
                        }}
                    />
                ))}
            </div>

            <div className="absolute inset-0 bg-[#21140d]">

                {/* Soft background layer */}

                <Image
                    src="/login-perfume.png"
                    alt="Luxury perfume collection"
                    fill
                    sizes="100vw"
                    className="object-cover object-center"
                />


                {/* Main background image — brighter and more vivid */}
                <Image
                    src="/login-perfume.png"
                    alt="Luxury perfume collection overlooking Paris at sunset"
                    fill
                    sizes="100vw"
                    className="absolute inset-0 object-cover object-center brightness-110 saturate-110"
                />



                <div className="absolute inset-0 bg-gradient-to-r from-[#160d08]/10 via-transparent to-[#2a170b]/10" />

                {/* Luxury Paris editorial typography */}
                <div className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-[55%] items-center justify-center px-6 lg:flex xl:px-10">

                    {/* Soft vignette: darker behind the slogan, lighter near the perfume */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute top-[-15%] bottom-7 left-[-15%] right-[-35%] z-0 bg-[radial-gradient(ellipse_90%_65%_at_50%_35%,rgba(12,6,3,0.58)_0%,rgba(18,9,5,0.42)_28%,rgba(18,9,5,0.24)_52%,rgba(18,9,5,0.10)_72%,transparent_100%)] blur-3xl"
                    />

                    {/* Gentle darkening from both sides */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-[-10%] left-[-1%] right-[-10%] z-0 bg-[linear-gradient(to_right,rgba(18,9,5,0.4)_0%,transparent_30%,transparent_68%,rgba(18,9,5,0.2)_100%)] blur-2xl"
                    />

                    <Image
                        src="/scent-slogan.png"
                        alt="Where Scent Becomes Art — Discover Your Signature Scent"
                        width={980}
                        height={400}
                        sizes="(max-width: 768px) 100vw, 980px"
                        className="h-auto w-[135%] max-w-[980px] -translate-y-70 translate-x-55 object-contain"
                    />

                </div>

            </div>

            {/* Soft light behind the login form */}
            <div className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-[45%] bg-gradient-to-l from-[#f4e6d1]/25 via-transparent to-transparent lg:block" />


            {/* Login form area */}
            <div className="relative z-10 flex min-h-screen w-full -translate-y-1 items-center justify-center overflow-y-auto px-4 py-6 sm:px-8 lg:ml-auto lg:min-h-screen lg:w-[46%] lg:translate-x-25 lg:justify-center lg:px-8 xl:px-12">
                <section className="w-full max-w-[550px]">


                    <div className="relative h-fit w-full max-w-[500px] overflow-hidden rounded-[26px] border border-[#D8AA60]/70 bg-[#302019]/95 p-5 shadow-[0_25px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6 lg:p-7">

                    <div className="pointer-events-none absolute -right-10 top-20 h-40 w-40 rounded-full bg-[#D8AA60]/15 blur-3xl" />
                        <div className="pointer-events-none absolute -left-12 bottom-8 h-36 w-36 rounded-full bg-[#D8AA60]/10 blur-3xl" />
                        <div className="relative">

                            {/* Logo và vùng bay của bướm */}
                            <div className="relative mb-5 flex flex-col items-center text-center">

                                {/* Fairy Dust — magical butterfly flight */}
                                <div
                                    className="scent-magic pointer-events-none absolute inset-0 z-20"
                                    aria-hidden="true"
                                >
                                    {/* Butterfly 1 */}
                                    <div className="butterfly-flight fairy-flight-one">
                                        <div className="butterfly-trail">
                                            {Array.from({ length: 14 }).map((_, i) => (
                                                <span
                                                    key={i}
                                                    className="fairy-particle"
                                                    style={{
                                                        "--delay": `${i * 0.075}s`,
                                                        "--drift-x": `${-12 - (i % 5) * 3}px`,
                                                        "--drift-y": `${i % 2 === 0 ? -6 : 6}px`,
                                                        "--particle-size": `${2 + (i % 3)}px`,
                                                    } as CSSProperties}
                                                />
                                            ))}
                                        </div>
                                        <svg className="magic-butterfly"
                                            viewBox="0 0 100 100"

                                            fill="none"
                                        >
                                            <defs>
                                                <linearGradient id="fairyGoldOne" x1="0" y1="0" x2="1" y2="1">
                                                    <stop offset="0%" stopColor="#FFF8D9" />
                                                    <stop offset="48%" stopColor="#F4D28A" />
                                                    <stop offset="100%" stopColor="#C18435" />
                                                </linearGradient>
                                            </defs>
                                            <g stroke="url(#fairyGoldOne)" strokeWidth="2" strokeLinejoin="round">
                                                <path d="M47 47 C34 9 5 12 12 39 C16 53 32 57 47 51Z" fill="#F4D28A" fillOpacity=".7" />
                                                <path d="M47 53 C25 45 12 62 23 77 C32 88 42 68 47 53Z" fill="#E8BD70" fillOpacity=".55" />
                                                <path d="M53 47 C66 9 95 12 88 39 C84 53 68 57 53 51Z" fill="#FFF1BD" fillOpacity=".8" />
                                                <path d="M53 53 C75 45 88 62 77 77 C68 88 58 68 53 53Z" fill="#F4D28A" fillOpacity=".55" />
                                                <path d="M50 38 Q44 50 50 65 Q56 50 50 38Z" fill="#FFF1BD" />
                                                <path d="M48 40 Q42 27 37 29 M52 40 Q58 27 63 29" strokeLinecap="round" />
                                            </g>
                                        </svg>
                                    </div>
                                    {/* Butterfly 2 */}
                                    <div className="butterfly-flight fairy-flight-two">
                                        <div className="butterfly-trail">
                                            {Array.from({ length: 14 }).map((_, i) => (
                                                <span
                                                    key={i}
                                                    className="fairy-particle"
                                                    style={{
                                                        "--delay": `${i * 0.085}s`,
                                                        "--drift-x": `${-10 - (i % 5) * 3}px`,
                                                        "--drift-y": `${i % 2 === 0 ? -4 : 4}px`,
                                                        "--particle-size": `${2 + (i % 3)}px`,
                                                    } as CSSProperties}
                                                />
                                            ))}
                                        </div>
                                        <svg  className="magic-butterfly"
                                            viewBox="0 0 100 100"

                                            fill="none"
                                        >
                                            <defs>
                                                <linearGradient id="fairyGoldTwo" x1="0" y1="0" x2="1" y2="1">
                                                    <stop offset="0%" stopColor="#FFFFFF" />
                                                    <stop offset="50%" stopColor="#E8BD70" />
                                                    <stop offset="100%" stopColor="#B77930" />
                                                </linearGradient>
                                            </defs>
                                            <g stroke="url(#fairyGoldTwo)" strokeWidth="2" strokeLinejoin="round">
                                                <path d="M47 47 C34 9 5 12 12 39 C16 53 32 57 47 51Z" fill="#E8BD70" fillOpacity=".65" />
                                                <path d="M47 53 C25 45 12 62 23 77 C32 88 42 68 47 53Z" fill="#E8BD70" fillOpacity=".5" />
                                                <path d="M53 47 C66 9 95 12 88 39 C84 53 68 57 53 51Z" fill="#FFF1BD" fillOpacity=".85" />
                                                <path d="M53 53 C75 45 88 62 77 77 C68 88 58 68 53 53Z" fill="#F4D28A" fillOpacity=".5" />
                                                <path d="M50 38 Q44 50 50 65 Q56 50 50 38Z" fill="#FFF1BD" />
                                                <path d="M48 40 Q42 27 37 29 M52 40 Q58 27 63 29" strokeLinecap="round" />
                                            </g>
                                        </svg>
                                    </div>
                                </div>

                                    {/* Original ScentStation lotus logo */}

                                <Image
                                    src="/scentstation-logo.png"
                                    alt="ScentStation logo"
                                    width={96}
                                    height={96}
                                    sizes="96px"
                                    className="relative z-10 h-20 w-20 -translate-y-5 object-contain sm:h-24 sm:w-24"
                                />


                            </div>


                            {/* Brand name */}
                                <p className="text-center -translate-y-9 font-serif text-[30px] leading-tight tracking-tight text-[#FFF2DE] sm:text-[34px]">
                                    ScentStation
                                </p>

                                <p className="mt-1 text-center -translate-y-9 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D8AA60]">
                                    Smart Fragrance Experience
                                </p>

                                {/* Login heading */}
                                <h1 className="mt-7 text-center -translate-y-13 font-serif text-3xl font-semibold tracking-tight text-[#FFF2DE] sm:text-[38px]">
                                    Welcome Back
                                </h1>

                                <p className="mt-1 text-center -translate-y-14 text-sm text-[#D9C3AA] sm:text-base">
                                    Continue your fragrance journey
                                </p>
                            </div>

                        <form
                            onSubmit={handleLogin}
                            noValidate
                            className="space-y-4 -translate-y-10"
                        >


                                <div className="mb-5">
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block text-sm font-semibold text-[#FFF2DE] sm:text-base"
                                    >
                                        Email address
                                    </label>

                                    <div className="flex min-h-[58px] w-full overflow-hidden rounded-2xl border border-[#D8AA60]/60 bg-[#FFF2DE] transition focus-within:ring-2 focus-within:ring-[#D8AA60]/50 sm:min-h-[66px]">
                                        {/* Email icon */}
                                        <span
                                            className="flex w-14 shrink-0 items-center justify-center border-r border-[#D8AA60]/40 text-[#9B6B37]"
                                            aria-hidden="true"
                                        >
            <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m4 7 8 6 8-6" />
            </svg>
        </span>

                                        {/* Email input */}
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            value={email}
                                            onChange={(event) => {
                                                setEmail(event.target.value);
                                                setEmailError("");
                                            }}
                                            placeholder="Enter your email"
                                            className="min-w-0 flex-1 bg-transparent px-4 py-4 text-base text-[#302019] outline-none placeholder:text-[#967B63] sm:text-lg"
                                        />
                                    </div>
                                    {emailError && (
                                        <p className="mt-2 text-sm font-medium text-[#FFAAA0]" role="alert">
                                            {emailError}
                                        </p>
                                    )}
                                </div>


                                <div className="mb-5">
                                    <label
                                        htmlFor="password"
                                        className="mb-2 block text-sm font-semibold text-[#FFF2DE] sm:text-base"
                                    >
                                        Password
                                    </label>

                                    <div className="flex min-h-[58px] w-full overflow-hidden rounded-2xl border border-[#D8AA60]/60 bg-[#FFF2DE] transition focus-within:ring-2 focus-within:ring-[#D8AA60]/50 sm:min-h-[66px]">
                                        {/* Lock icon */}
                                        <span className="flex w-14 shrink-0 items-center justify-center border-r border-[#D8AA60]/40 text-[#9B6B37]">
            <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <rect x="5" y="10" width="14" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                <path d="M12 14v3" />
            </svg>
        </span>

                                        {/* Password input */}
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(event) => {
                                                setPassword(event.target.value);
                                                setPasswordError("");
                                            }}
                                            placeholder="Enter your password"
                                            autoComplete="current-password"
                                            className="min-w-0 flex-1 bg-transparent px-4 py-4 text-base text-[#302019] outline-none placeholder:text-[#967B63] sm:text-lg"
                                        />

                                        {/* Show / hide password */}
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((previous) => !previous)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            className="flex w-14 shrink-0 items-center justify-center text-[#9B6B37] transition hover:bg-[#E8BD70]/20"
                                        >
                                            <svg
                                                viewBox="0 0 24 24"
                                                className="h-6 w-6"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                aria-hidden="true"
                                            >
                                                {showPassword ? (
                                                    <>
                                                        <path d="M3 3l18 18" />
                                                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                                                        <path d="M9.9 5.2A11 11 0 0 1 12 5c5.5 0 9 7 9 7a15 15 0 0 1-3.1 3.8" />
                                                        <path d="M6.2 6.2C4.2 7.5 3 10 3 12c0 0 3.5 7 9 7a10 10 0 0 0 3-.5" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </>
                                                )}
                                            </svg>
                                        </button>
                                    </div>
                                    {passwordError && (
                                        <p className="mt-2 text-sm font-medium text-[#FFAAA0]" role="alert">
                                            {passwordError}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between gap-3 pt-0.5 text-xs sm:text-sm">
                                <label className="flex cursor-pointer items-center gap-2 text-[#D9C3AA]">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(event) => setRememberMe(event.target.checked)}
                                        className="h-4 w-4 rounded accent-[#D8AA60]"
                                    />
                                    Remember me
                                </label>
                                <a
                                    href="/forgot-password"
                                    className="font-medium text-[#E3B873] underline underline-offset-4 transition hover:text-[#FFF2DE]"
                                >
                                    Forgot password?
                                </a>
                            </div>

                                <div
                                    className={`mt-3 min-h-[44px] rounded-xl px-4 py-2.5 text-sm leading-5 break-words ${
                                        error
                                            ? "border border-red-200 bg-red-50 text-red-600"
                                            : "invisible"
                                    }`}
                                    role="alert"
                                    aria-live="polite"
                                >
                                    {error || " "}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group flex w-full items-center justify-center gap-3 rounded-xl border border-[#c58c45] bg-gradient-to-r from-[#d99b4c] via-[#a96826] to-[#60350f] px-4 py-3.5 font-serif text-lg text-[#fff9ef] shadow-[0_8px_18px_rgba(111,63,20,0.2)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {loading ? "Signing in..." : "Sign In"}

                                    {!loading && (
                                        <span
                                            aria-hidden="true"
                                            className="transition-transform group-hover:translate-x-1"
                                        ></span>
                                    )}
                                </button>
                        </form>

                        <div className="my-5 -translate-y-9 flex items-center gap-3">
                            <div className="h-px flex-1 bg-[#e5d1b5]" />
                            <span className="text-[11px] font-medium text-[#a07b55]">OR</span>
                            <div className="h-px flex-1 bg-[#e5d1b5]" />
                        </div>
                        <button
                            type="button"
                            onClick={() => setError("QR code login will be available when the ScentStation mobile app is released.")}
                            className="flex w-full -translate-y-8 items-center gap-3 rounded-xl border border-[#D8AA60]/45 bg-[#493023] px-4 py-3 text-left transition hover:border-[#D8AA60]/80 hover:bg-[#593B2A]"
                        >
        <span
            className="flex h-10 w-10 shrink-0 items-center justify-center text-[#D8AA60]"
            aria-hidden="true"
        >
        <svg
            viewBox="0 0 24 24"
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <rect x="3" y="3" width="6" height="6" rx="1" />
            <rect x="15" y="3" width="6" height="6" rx="1" />
            <rect x="3" y="15" width="6" height="6" rx="1" />
            <path d="M15 15h3v3h-3zM21 15v2M18 21h3M12 3v3M12 12h2M12 18v3" />
        </svg>
    </span>
                            <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[#FFF2DE]">
            Login with QR Code
        </span>
        <span className="mt-0.5 block text-xs text-[#D9C3AA]">
            Use ScentStation mobile app to scan
        </span>
    </span>

                            <span className="text-xl text-[#D8AA60]" aria-hidden="true">
        ›
    </span>
                        </button>





                        <div className="mt-6 -translate-y-8 flex w-full items-center gap-3 rounded-xl border border-[#D8AA60]/45 bg-[#493023] px-4 py-3 text-left transition hover:border-[#D8AA60]/80 hover:bg-[#593B2A]">
                            {/* Security icon */}
                            <span
                                className="flex h-10 w-10 shrink-0 items-center justify-center text-[#D8AA60]"
                                aria-hidden="true"
                            >
        <svg
            viewBox="0 0 24 24"
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 2 20 5v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3Z" />
            <path d="m8.5 12 2.2 2.2 4.8-5" />
        </svg>
    </span>

                            {/* Security description */}
                            <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[#FFF2DE]">
            Secure &amp; Role-based Access
        </span>
        <span className="mt-0.5 block text-xs text-[#D9C3AA]">
            Your data is protected with industry-standard security.
        </span>
    </span>
                        </div>



                    </div>

                </section>
            </div>

            {/* Language Selector */}
            <div className="fixed bottom-6 left-20 z-50">
                <div className="relative">
                    <button
                        type="button"
                        onClick={() =>
                            setIsLanguageMenuOpen((open) => !open)
                        }
                        aria-expanded={isLanguageMenuOpen}

                        className="flex min-h-[52px] items-center gap-3 rounded-full border border-[#D8AA60]/50 bg-[#28190F]/95 px-6 py-3 text-base font-medium text-[#FFF2DE] shadow-lg backdrop-blur-md transition-all duration-200 hover:border-[#D8AA60] hover:bg-[#3A2619]"

                    >
                        {/* Globe icon */}
                        <svg
                            viewBox="0 0 24 24"
                            className="h-7 w-7 shrink-0 text-[#D8AA60]"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <circle cx="12" cy="12" r="9.5" />
                            <path d="M2.5 12h19" />
                            <path d="M12 2.5c2.5 2.6 3.7 5.9 3.7 9.5s-1.2 6.9-3.7 9.5" />
                            <path d="M12 2.5c-2.5 2.6-3.7 5.9-3.7 9.5s1.2 6.9 3.7 9.5" />
                        </svg>

                        {language === "en" ? "English" : "Vietnamese"}

                        <svg
                            viewBox="0 0 24 24"
                            className={`h-5 w-5 text-[#D8AA60] transition-transform duration-200 ${
                                isLanguageMenuOpen ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="m7 10 5 5 5-5" />
                        </svg>
                    </button>

                    {isLanguageMenuOpen && (
                        <div className="absolute bottom-full left-0 mb-2 min-w-40 rounded-xl border border-[#D8AA60]/30 bg-[#28190F] p-1.5 shadow-xl">
                            <button
                                type="button"
                                onClick={() => handleLanguageChange("en")}
                                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-[#FFF2DE] hover:bg-white/10"
                            >
                                English
                            </button>

                            <button
                                type="button"
                                onClick={() => handleLanguageChange("vi")}
                                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-[#FFF2DE] hover:bg-white/10"
                            >
                                Vietnamese
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <style jsx global>{`
    #email:-webkit-autofill,
    #email:-webkit-autofill:hover,
    #email:-webkit-autofill:focus,
    #password:-webkit-autofill,
    #password:-webkit-autofill:hover,
    #password:-webkit-autofill:focus {
        -webkit-text-fill-color: #302019 !important;
        -webkit-box-shadow: 0 0 0 1000px #FFF2DE inset !important;
        box-shadow: 0 0 0 1000px #FFF2DE inset !important;
        caret-color: #302019;
        transition: background-color 999999s ease-in-out 0s;
    }
`}</style>

        </main>
    );
}
