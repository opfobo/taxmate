
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useTheme } from "@/components/ThemeProvider";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [language, setLanguage] = useState("en");
  const [userSettings, setUserSettings] = useState<any>(null);

  // Fetch user settings when component mounts
  useEffect(() => {
    if (user) {
      fetchUserSettings();
    }
  }, [user]);

  // Initialize settings from localStorage and/or database
  useEffect(() => {
    if (userSettings) {
      // Set theme based on user settings
      if (userSettings.theme) {
        setTheme(userSettings.theme);
      }
      
      // Set language based on user settings
      if (userSettings.language) {
        setLanguage(userSettings.language);
      }
      
      // Set email notification preferences
      if (userSettings.email_notifications !== undefined) {
        setEmailNotifications(userSettings.email_notifications);
      }
    }
  }, [userSettings, setTheme]);

  const fetchUserSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("theme, language, email_notifications")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      
      setUserSettings(data);
    } catch (error: any) {
      console.error("Error fetching user settings:", error);
    }
  };

  const handleThemeChange = async (checked: boolean) => {
    const newTheme = checked ? "dark" : "light";
    setTheme(newTheme);
    
    // Save immediately to localStorage (this is handled by ThemeProvider)
    
    // If user is logged in, save to database
    if (user) {
      try {
        const { error } = await supabase
          .from("users")
          .update({
            theme: newTheme,
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id);

        if (error) throw error;
      } catch (error: any) {
        console.error("Error updating theme setting:", error);
        toast({
          title: "Error Saving Theme",
          description: "Your theme preference couldn't be saved to your profile.",
          variant: "destructive",
        });
      }
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    setLanguage(newLanguage);
    
    // Save to localStorage for persistence without login
    localStorage.setItem("app-language", newLanguage);
    
    // If user is logged in, save to database
    if (user) {
      try {
        const { error } = await supabase
          .from("users")
          .update({
            language: newLanguage,
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id);

        if (error) throw error;
      } catch (error: any) {
        console.error("Error updating language setting:", error);
        toast({
          title: "Error Saving Language",
          description: "Your language preference couldn't be saved to your profile.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Update user preferences in the database
      const { error } = await supabase
        .from("users")
        .update({
          theme: theme,
          language: language,
          email_notifications: emailNotifications,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved successfully.",
      });
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general">
            <div className="max-w-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Toggle between light and dark theme</p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={theme === "dark"}
                  onCheckedChange={handleThemeChange}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="language" className="font-medium">Language</Label>
                  <p className="text-sm text-muted-foreground">Select your preferred language</p>
                </div>
                <Select
                  value={language}
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
              </Button>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="max-w-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive email updates about your account activity</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
              </Button>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-medium">Change Password</h3>
                <p className="text-sm text-muted-foreground mb-4">Update your password to maintain account security</p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <input 
                      id="current-password"
                      type="password"
                      className="w-full border rounded px-3 py-2 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <input 
                      id="new-password"
                      type="password"
                      className="w-full border rounded px-3 py-2 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <input 
                      id="confirm-password"
                      type="password"
                      className="w-full border rounded px-3 py-2 mt-1"
                    />
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                Change Password
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default SettingsPage;
