import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import Image from "next/image";
import { Diagram } from "@prisma/client";

interface DiagramCardProps {
  variant: "list" | "grid";
  diagram: Diagram;
}

export function DiagramCard({ variant, diagram }: DiagramCardProps) {
  if (variant === "list") {
    return (
      <Card className="flex flex-row items-center gap-4 p-4 hover:bg-secondary transition-colors w-full">
        {/* File Icon */}
        <div className="flex-shrink-0">
          <FileText className="size-10" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate">{diagram.title}</h3>
        </div>
      </Card>
    );
  }

  if (variant === "grid") {
    return (
      <Card className="p-4 overflow-hidden hover:bg-secondary hover:shadow-md transition-shadow w-full h-full flex flex-col cursor-default">
        <CardHeader className="flex items-center justify-between px-0">
          <CardTitle className="text-sm sm:text-base font-medium truncate">
            {diagram.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <div className="relative w-full aspect-6/4">
            <Image
              src={diagram.imageUrl ?? "https://placehold.co/600x400"}
              alt={diagram.title}
              fill
              className="object-cover rounded-md select-none pointer-events-none"
            />
          </div>
        </CardContent>
      </Card>
    );
  }
}
