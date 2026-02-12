import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
      <div className="text-center animate-scale-in">
        <h1 className="mb-4 text-6xl font-bold text-white">404</h1>
        <p className="mb-6 text-xl text-white/70">Oops! Page not found</p>
        <a href="/" className="btn-cta">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
