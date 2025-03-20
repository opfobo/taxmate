
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();

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

          // Only set theme if we got valid data back and it has a theme property
          // Ensure the theme value is one of the allowed types (dark, light, system)
          if (data && data.theme && (data.theme === "dark" || data.theme === "light" || data.theme === "system")) {
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
          toast({
            title: "Error",
            description: "Couldn't save your theme preference to your profile.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Theme updated",
            description: `Theme switched to ${newTheme} mode`,
          });
        }
      } catch (error) {
        console.error("Error saving theme preference:", error);
        toast({
          title: "Error",
          description: "Couldn't save your theme preference.",
          variant: "destructive",
        });
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
