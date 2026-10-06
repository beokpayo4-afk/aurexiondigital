import { motion, useReducedMotion } from "framer-motion";
import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PageFallback } from "@/components/routing/PageFallback";
import { JsonLd } from "@/components/seo/JsonLd";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { applySeoOverride } from "@/seo/document";
import { organizationData } from "@/seo/structuredData";
import { lookupSeo } from "@/services/contentService";

export function PublicLayout() {
  const location = useLocation();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!navigator.userAgent.includes("jsdom")) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  useEffect(() => {
    let active = true;
    void lookupSeo(location.pathname).then((seo) => {
      if (!active || !seo) {
        return;
      }
      applySeoOverride({
        title: seo.meta_title,
        description: seo.meta_description,
        image: seo.og_image_url,
        canonicalPath: seo.canonical_path,
        robots: seo.robots,
      });
    });
    return () => {
      active = false;
    };
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />
      <CartDrawer />
      <JsonLd data={organizationData(window.location.origin)} />
      <motion.main
        id="main"
        key={location.pathname}
        className="flex-1"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
      >
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </motion.main>
      <Footer />
    </div>
  );
}
