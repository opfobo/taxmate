
import React from "react";
import { Card } from "@/components/ui/card";

interface OcrSectionCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

const OcrSectionCard = ({ title, description, children, className }: OcrSectionCardProps) => {
  return (
    <div className={`bg-card rounded-lg border p-6 ${className || ""}`}>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <p className="text-muted-foreground mb-6">{description}</p>
      {children}
    </div>
  );
};

export default OcrSectionCard;
