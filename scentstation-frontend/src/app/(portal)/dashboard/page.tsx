
"use client";

import Image from "next/image";

export default function DashboardPage() {
    return (
        <main className="min-h-full space-y-6 p-0">

            <section className="relative isolate min-h-[260px] w-full overflow-hidden bg-[#24150f] md:min-h-[280px]">
                <Image
                    src="/images/scentstation-hero.png"
                    alt="Luxury perfume collection in a golden floral garden"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-[70%_center]"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-[#24150f] via-[#24150f]/75 via-35% to-transparent" />

                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#f4bd83]/10" />

                <div className="relative z-10 flex min-h-[260px] items-center px-6 py-8 sm:px-10 md:min-h-[280px] md:px-12">
                    <div className="max-w-xl">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#dfb878] md:text-xs">
                            System Overview
                        </p>

                        <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight text-[#fff8ed] sm:text-5xl md:text-6xl">
                            Dashboard
                        </h1>

                        <p className="mt-4 max-w-md text-sm leading-6 text-[#f2e6d8]/90 md:text-base md:leading-7">
                            Welcome to the ScentStation platform. Discover your fragrance operations at a glance.
                        </p>

                        <div className="mt-6 h-px w-16 bg-[#d5b47a]" />

                        <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.24em] text-[#dfb878] sm:text-xs">
                            A World of Refined Fragrance
                        </p>
                    </div>
                </div>
            </section>


            <section className="grid gap-5 md:grid-cols-3">
                <article className="rounded-xl border border-[#e8ddcd] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                    <p className="text-sm text-[#887967]">
                        Platform
                    </p>
                    <h2 className="mt-2 font-serif text-2xl text-[#302319]">
                        ScentStation
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#887967]">
                        Your fragrance experience management platform.
                    </p>
                </article>

                <article className="rounded-xl border border-[#e8ddcd] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                    <p className="text-sm text-[#887967]">
                        Experience
                    </p>
                    <h2 className="mt-2 font-serif text-2xl text-[#302319]">
                        Refined
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#887967]">
                        A seamless experience across fragrance kiosks.
                    </p>
                </article>

                <article className="rounded-xl border border-[#e8ddcd] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                    <p className="text-sm text-[#887967]">
                        Operations
                    </p>
                    <h2 className="mt-2 font-serif text-2xl text-[#302319]">
                        At a glance
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#887967]">
                        Manage your platform from one central workspace.
                    </p>
                </article>
            </section>

            <section className="rounded-xl border border-[#e8ddcd] bg-white p-6 md:p-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a18150]">
                            Workspace
                        </p>
                        <h2 className="mt-2 font-serif text-2xl text-[#302319]">
                            Welcome to ScentStation
                        </h2>
                    </div>

                    <span className="w-fit rounded-full border border-[#e5d5bd] bg-[#f7f3ec] px-3 py-1.5 text-xs text-[#796344]">
                        Admin Portal
                    </span>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-[#887967]">
                    Your central workspace for managing fragrance products,
                    machines, inventory, transactions, and platform operations.
                </p>
            </section>
        </main>
    );
}
