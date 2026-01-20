import { useEffect, useState, useRef, Suspense, lazy } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

/* ================= LAZY LOADED PAGES ================= */
const Home = lazy(() => import("./pages/Home"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Projects = lazy(() => import("./pages/Projects"));
const MyProjects = lazy(() => import("./pages/MyProjects"));
const Preview = lazy(() => import("./pages/Preview"));
const Community = lazy(() => import("./pages/Community"));
const View = lazy(() => import("./pages/View"));

/* ================= NORMAL IMPORTS ================= */
import Navbar from "./componets/Navbar";
import Background from "./pages/Background";
import Cursor from "./pages/Cursor";
import IntroPage from "./pages/IntroPage";
import Loading from "./pages/Loading";
import { Toaster } from "sonner";
import AuthPage from "./pages/auth/AuthPage";
import Settings from "./pages/Settings";

const LOADING_DURATION = 10; // seconds

const App = () => {
  /* ================= STATE ================= */
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const [showApp, setShowApp] = useState(false);

  // 🔑 keeps value across route changes, resets on refresh
  const hasShownIntro = useRef(false);

  /* ================= SHOW APP AFTER LOADING ================= */
  useEffect(() => {
    if (!loadingCompleted) return;

    hasShownIntro.current = true;

    const timer = setTimeout(() => {
      setShowApp(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [loadingCompleted]);

  const { pathname } = useLocation();

  const hideNavbar =
    (pathname.startsWith("/projects/") && pathname !== "/projects") ||
    pathname.startsWith("/view/");

  /* ================= INTRO + LOADING (ONCE PER LOAD) ================= */
  // if (!hasShownIntro.current && !showApp) {
  //   return (
  //     <div className="flex flex-col items-center justify-center h-screen text-white">
  //       {/* ===== INTRO TEXT ===== */}
  //       <IntroPage
  //         texts={["Welcome", "To", "MakeMySite.ai"]}
  //         mainClassName="
  //           px-2 sm:px-3 md:px-4
  //           bg-cyan-300 text-black
  //           overflow-hidden
  //           py-1 sm:py-2
  //           rounded-lg
  //           text-5xl sm:text-6xl md:text-7xl
  //           font-extrabold
  //           text-center
  //         "
  //         staggerFrom="last"
  //         initial={{ y: "100%" }}
  //         animate={{ y: 0 }}
  //         exit={{ y: "-120%" }}
  //         staggerDuration={0.001}
  //         splitLevelClassName="overflow-hidden"
  //         transition={{ type: "spring", damping: 30, stiffness: 400 }}
  //         rotationInterval={1610}
  //       />

  //       {/* ===== LOADING PERCENT ===== */}
  //       <div className="mt-8 text-4xl sm:text-5xl md:text-6xl font-mono font-bold">
  //         <Loading
  //           from={0}
  //           to={100}
  //           separator="%"
  //           direction="up"
  //           duration={LOADING_DURATION}
  //           onEnd={() => setLoadingCompleted(true)}
  //         />
  //       </div>
  //     </div>
  //   );
  // }

  /* ================= MAIN APP ================= */
  return (
    <div className="relative overflow-hidden">
      <Toaster position="top-right" />

      {/* ===== BACKGROUND ===== */}
      <div className="fixed inset-0 -z-10 opacity-20 pointer-events-none">
        <Background
          topColor="#5227FF"
          bottomColor="#FF9FFC"
          intensity={1.0}
          rotationSpeed={0.3}
          glowAmount={0.005}
          pillarWidth={3.0}
          pillarHeight={0.4}
          noiseIntensity={0.5}
          pillarRotation={0}
          interactive={false}
          mixBlendMode="normal"
        />
      </div>

      {/* ===== CURSOR ===== */}
      <Cursor
        style={{ position: "fixed" }}
        blobType="circle"
        fillColor="#5227FF"
        trailCount={3}
        sizes={[60, 125, 75]}
        innerSizes={[20, 35, 25]}
        innerColor="rgba(255,255,255,0.8)"
        opacities={[0.6, 0.6, 0.6]}
        shadowColor="rgba(0,0,0,0.75)"
        shadowBlur={5}
        shadowOffsetX={10}
        shadowOffsetY={10}
        filterStdDeviation={30}
        useFilter={true}
        fastDuration={0.1}
        slowDuration={0.5}
        zIndex={9999}
      />

      {/* ===== NAVBAR ===== */}
      {!hideNavbar && <Navbar />}

      {/* ===== ROUTES ===== */}
      <Suspense>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/projects" element={<MyProjects />} />
          <Route path="/projects/:projectId" element={<Projects />} />
          <Route path="/preview/:projectId" element={<Preview />} />
          <Route path="/preview/:projectId/:versionId" element={<Preview />} />
          <Route path="/community" element={<Community />} />
          <Route path="/view/:projectId" element={<View />} />
          <Route path="/auth/:pathname" element={<AuthPage />} />
          <Route path="/account/settings" element={<Settings />} />
          <Route path="/loading" element={<Loading />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default App;
