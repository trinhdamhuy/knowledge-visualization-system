"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useLocale } from "next-intl";
import { FullDiagram } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { forwardRef } from "react";

interface DiagramCardProps {
  variant: "list" | "grid";
  diagram: FullDiagram;
  isSelected?: boolean;
  onCardClick?: (diagramId: string, e: React.MouseEvent) => void;
}

export const DiagramCard = forwardRef<HTMLDivElement, DiagramCardProps>(
  function DiagramCard(
    { variant, diagram, isSelected = false, onCardClick },
    ref
  ) {
    const { data: session } = useSession();
    const router = useRouter();
    const isStarred = session?.user?.id === diagram.ownerId;
    const locale = useLocale();

    const handleCardDoubleClick = () => {
      router.push(`/diagrams/${diagram.id}`);
    };

    const handleCardClick = (e: React.MouseEvent) => {
      // Don't trigger if clicking on buttons or links
      if ((e.target as HTMLElement).closest("button")) return;
      if ((e.target as HTMLElement).closest("a")) return;

      onCardClick?.(diagram.id, e);
    };

    return (
      <>
        {variant === "list" ? (
          <div ref={ref} className="w-full">
            <Card
              onClick={handleCardClick}
              onDoubleClick={handleCardDoubleClick}
              onDragStart={(e) => e.preventDefault()}
              draggable={false}
              className={`flex flex-row items-center justify-between gap-4 p-2 hover:bg-secondary transition-colors w-full relative group ${
                isSelected ? "ring-2 ring-primary bg-primary/10" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="relative w-16 aspect-square">
                  <Image
                    src={diagram.imageUrl ?? "https://placehold.co/600x600"}
                    alt={diagram.title}
                    fill
                    className="object-cover rounded-md select-none pointer-events-none"
                  />
                </div>

                <CardTitle className="text-sm sm:text-base font-medium truncate">
                  {diagram.title}
                </CardTitle>
              </div>

              {/* Date overlay - only visible on hover */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <button>
                    <Star
                      className={`opacity-0 ${
                        isStarred ? "opacity-100 fill-yellow-500" : "opacity-0"
                      } group-hover:opacity-100 hover:fill-yellow-300 transition-all duration-500 size-6`}
                    />
                  </button>
                  <Avatar className="rounded-full">
                    <AvatarImage src={diagram.owner.image ?? ""} alt="Avatar" />
                    <AvatarFallback>
                      {diagram.owner.name?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {new Date(diagram.createdAt).toLocaleDateString(locale)}
                </Badge>
              </div>
            </Card>
          </div>
        ) : (
          <div ref={ref} className="w-full h-full">
            <Card
              onClick={handleCardClick}
              onDoubleClick={handleCardDoubleClick}
              onDragStart={(e) => e.preventDefault()}
              draggable={false}
              className={`p-4 overflow-hidden hover:bg-secondary hover:shadow-md transition-shadow w-full h-full flex flex-col relative group ${
                isSelected ? "ring-2 ring-primary bg-primary/10" : ""
              }`}
            >
              <CardHeader className="flex items-center justify-between px-0">
                <CardTitle className="text-sm sm:text-base font-medium truncate">
                  {diagram.title}
                </CardTitle>
                <button>
                  <Star
                    className={`opacity-0 ${
                      isStarred
                        ? "opacity-100 fill-yellow-500 text-yellow-500"
                        : "opacity-0"
                    } group-hover:opacity-100 hover:fill-yellow-300 hover:text-yellow-300 transition-opacity duration-500 size-6`}
                  />
                </button>
              </CardHeader>
              <CardContent className="flex-1 p-0 relative">
                <div className="relative w-full aspect-6/4">
                  <Image
                    src={diagram.imageUrl ?? "https://placehold.co/600x400"}
                    alt={diagram.title}
                    fill
                    className="object-cover rounded-md select-none pointer-events-none"
                  />

                  <Avatar className="rounded-full absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 top-2 right-2">
                    <AvatarImage src={diagram.owner.image ?? ""} alt="Avatar" />
                    <AvatarFallback>
                      {diagram.owner.name?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>

                  <Badge
                    variant="secondary"
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs"
                  >
                    {new Date(diagram.createdAt).toLocaleDateString(locale)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </>
    );
  }
);
