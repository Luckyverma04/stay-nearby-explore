import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-muted to-muted/50 rounded-full w-20 h-20 flex items-center justify-center">
              <MapPin className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-hotel-luxury bg-clip-text text-transparent">
            404
          </h1>
          
          <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
          
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-gradient-to-r from-primary to-hotel-luxury">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link to="/">
                <Search className="h-4 w-4 mr-2" />
                Search Hotels
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
