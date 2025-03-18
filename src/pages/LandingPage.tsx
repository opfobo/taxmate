
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container">
        <section className="py-20 md:py-32">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Tax & Business Automation
            </h1>
            <p className="mt-6 max-w-[700px] text-muted-foreground md:text-xl">
              Streamline your tax management and business operations with our powerful platform.
              Save time, reduce errors, and focus on growing your business.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {user ? (
                <Button size="lg" asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link to="/auth/signup">Sign Up</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/auth/login">Login</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-xl font-bold">Tax Management</h3>
              <p className="text-muted-foreground mt-2">
                Automate tax calculations and reporting to stay compliant.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-xl font-bold">Business Insights</h3>
              <p className="text-muted-foreground mt-2">
                Get valuable insights into your business performance.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-xl font-bold">Document Management</h3>
              <p className="text-muted-foreground mt-2">
                Organize and manage all your business documents efficiently.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} TaxMaster. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
