import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { AdvantagesGrid } from "@/components/landing/advantages-grid";
import { Footer } from "@/components/landing/footer";
import styles from "@/app/landing.module.css";

async function LandingHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const isLoggedIn = !!data.user;
  return (
    <>
      <Navbar />
      <Hero isLoggedIn={isLoggedIn} />
    </>
  );
}

export default function Home() {
  return (
    <main className={styles.page}>
      <Suspense fallback={null}>
        <LandingHeader />
      </Suspense>
      <FeaturesGrid />
      <AdvantagesGrid />
      <Footer />
    </main>
  );
}
