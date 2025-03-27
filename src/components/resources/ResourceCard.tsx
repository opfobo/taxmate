
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, PlayCircle } from "lucide-react";

interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    description: string;
    link: string;
    type: 'video' | 'article' | 'link';
  };
}

const ResourceCard = ({ resource }: ResourceCardProps) => {
  const { t } = useTranslation();
  
  const getTypeIcon = () => {
    switch (resource?.type) {
      case 'video':
        return <PlayCircle className="h-5 w-5" />;
      case 'article':
        return <FileText className="h-5 w-5" />;
      case 'link':
        return <ExternalLink className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };
  
  const getButtonText = () => {
    switch (resource.type) {
      case 'video':
        return t('watch_video');
      case 'article':
        return t('read_article');
      case 'link':
        return t('open_link');
      default:
        return t('view_resource');
    }
  };
  
  const handleResourceClick = () => {
    // External links open in a new tab
    if (resource.link.startsWith('http')) {
      window.open(resource.link, '_blank');
    } else {
      // Internal links use regular navigation
      window.location.href = resource.link;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          {getTypeIcon()}
          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
            {t(resource?.type ?? "unknown")}
          </span>
        </div>
        <CardTitle>{resource.title}</CardTitle>
        <CardDescription>{resource.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {/* Additional content could go here */}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleResourceClick} 
          className="w-full"
          variant={resource?.type === 'video' ? 'default' : 'outline'}
        >
          {getTypeIcon()}
          {getButtonText()}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResourceCard;
