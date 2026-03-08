import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <p className="text-xl text-muted-foreground">Oeps! Pagina niet gevonden</p>
        </div>
        <p className="text-muted-foreground max-w-md mx-auto">
          De pagina die je zoekt bestaat niet of is verplaatst.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ga terug
          </Button>
          <Button onClick={() => navigate("/")}>
            <Home className="h-4 w-4 mr-2" />
            Naar homepage
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
