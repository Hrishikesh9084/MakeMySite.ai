import { Suspense, lazy } from "react";
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
import Loading from "./pages/Loading";
import { Toaster } from "sonner";
import AuthPage from "./pages/auth/AuthPage";
import Settings from "./pages/Settings";


const App = () => {

  const { pathname } = useLocation();

  const hideNavbar =
    (pathname.startsWith("/projects/") && pathname !== "/projects") ||
    pathname.startsWith("/view/");

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
