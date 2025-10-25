import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useLocale } from "next-intl";
import { FullDiagram } from "@/types";

interface DiagramCardProps {
  variant: "list" | "grid";
  diagram: FullDiagram;
}

export function DiagramCard({ variant, diagram }: DiagramCardProps) {
  const locale = useLocale();

  if (variant === "list") {
    return (
      <Card className="flex flex-row items-center gap-4 p-2 hover:bg-secondary transition-colors w-full relative group">
        {/* File Icon */}
        <div className="relative w-16 aspect-6/4">
          <Image
            src={diagram.imageUrl ?? "https://placehold.co/600x400"}
            alt={diagram.title}
            fill
            className="object-cover rounded-md select-none pointer-events-none"
          />
        </div>

        {/* Content */}
        <CardTitle className="text-sm sm:text-base font-medium truncate">
          {diagram.title}
        </CardTitle>

        {/* Date overlay - only visible on hover */}
        <Badge
          variant="secondary"
          className="absolute bottom-2 right-2 text-xs"
        >
          {new Date(diagram.createdAt).toLocaleDateString(locale)}
        </Badge>


      </Card>
    );
  }

  if (variant === "grid") {
    return (
      <Card className="p-4 overflow-hidden hover:bg-secondary hover:shadow-md transition-shadow w-full h-full flex flex-col cursor-default relative group">
        <CardHeader className="flex items-center justify-between px-0">
          <CardTitle className="text-sm sm:text-base font-medium truncate">
            {diagram.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 relative">
          <div className="relative w-full aspect-6/4">
            <Image
              src={diagram.imageUrl ?? "https://placehold.co/600x400"}
              alt={diagram.title}
              fill
              className="object-cover rounded-md select-none pointer-events-none"
            />

            {/* Date overlay - only visible on hover */}
            <Badge
              variant="secondary"
              className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs"
            >
              {new Date(diagram.createdAt).toLocaleDateString(locale)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }
}
