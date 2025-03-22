
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import ResourceCard from "@/components/resources/ResourceCard";
import { AlertCircle } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string;
  link: string;
  type: 'video' | 'article' | 'link';
  language: string;
}

const ResourcesPage = () => {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  
  // Fetch resources for the current user's language
  const { data: resources, isLoading, error } = useQuery({
    queryKey: ["resources", language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("language", language);
      
      if (error) throw error;
      return data as Resource[];
    },
    enabled: !!language,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t("resources")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("resources_description")}
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center my-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 p-4 rounded-lg flex items-start gap-3 my-4">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <h3 className="font-medium text-destructive">{t("error_loading_resources")}</h3>
              <p className="text-sm text-destructive/90">
                {error instanceof Error ? error.message : t("unknown_error")}
              </p>
            </div>
          </div>
        )}

        {/* Resources grid */}
        {resources && resources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          // Empty state
          !isLoading && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">{t("no_resources")}</h3>
              <p className="text-muted-foreground mt-2">
                {t("no_resources_description")}
              </p>
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default ResourcesPage;
