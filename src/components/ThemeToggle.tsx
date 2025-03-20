
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  // Sync theme with database when component mounts
  useEffect(() => {
    if (user) {
      const syncThemeWithDatabase = async () => {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("theme")
            .eq("id", user.id)
            .single();

          if (error) {
            console.error("Error fetching theme preference:", error);
            return;
          }

          if (data && data.theme) {
            setTheme(data.theme);
          }
        } catch (error) {
          console.error("Error syncing theme with database:", error);
        }
      };

      syncThemeWithDatabase();
    }
  }, [user, setTheme]);

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    // If the user is logged in, save their preference to the database
    if (user) {
      try {
        const { error } = await supabase
          .from("users")
          .update({
            theme: newTheme,
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id);

        if (error) {
          console.error("Error updating theme preference:", error);
        }
      } catch (error) {
        console.error("Error saving theme preference:", error);
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <MoonIcon className="h-5 w-5" />
      ) : (
        <SunIcon className="h-5 w-5" />
      )}
    </Button>
  );
}
