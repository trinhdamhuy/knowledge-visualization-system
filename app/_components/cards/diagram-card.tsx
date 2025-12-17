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
import { forwardRef, useState } from "react";
import { starDiagram, unstarDiagram } from "@/app/_actions";
import { useQueryClient } from "@tanstack/react-query";
import { starredKeys } from "@/hooks/use-starred";
import { itemsKeys } from "@/hooks/use-items";

interface DiagramCardProps {
  variant: "list" | "grid";
  diagram: FullDiagram;
  isSelected?: boolean;
  onCardClick?: (diagramId: string, e: React.MouseEvent) => void;
  onCardRightClick?: (diagramId: string, e: React.MouseEvent) => void;
}

export const DiagramCard = forwardRef<HTMLDivElement, DiagramCardProps>(
  function DiagramCard(
    { variant, diagram, isSelected = false, onCardClick, onCardRightClick },
    ref
  ) {
    const { data: session } = useSession();
    const router = useRouter();
    const locale = useLocale();
    const queryClient = useQueryClient();
    const [isStarring, setIsStarring] = useState(false);

    // Check if diagram is starred by current user
    const isStarred =
      session?.user?.id &&
      diagram.starreds?.some((s) => s.userId === session.user.id);

    const owner = diagram.owner;

    const handleCardDoubleClick = () => {
      router.push(`/diagrams/${diagram.id}`);
    };

    const handleCardClick = (e: React.MouseEvent) => {
      // Don't trigger if clicking on buttons or links
      if ((e.target as HTMLElement).closest("button")) return;
      if ((e.target as HTMLElement).closest("a")) return;

      onCardClick?.(diagram.id, e);
    };

    const handleCardRightClick = (e: React.MouseEvent) => {
      // Don't trigger if clicking on buttons or links
      if ((e.target as HTMLElement).closest("button")) return;
      if ((e.target as HTMLElement).closest("a")) return;

      onCardRightClick?.(diagram.id, e);
    };

    const handleStarClick = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!session?.user?.id || isStarring) return;

      setIsStarring(true);
      try {
        if (isStarred) {
          await unstarDiagram(diagram.id);
        } else {
          await starDiagram(diagram.id);
        }
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: starredKeys.list() });
        queryClient.invalidateQueries({ queryKey: starredKeys.all });
        queryClient.invalidateQueries({
          queryKey: starredKeys.detail(diagram.id),
        });
        queryClient.invalidateQueries({ queryKey: itemsKeys.all });
      } catch (error) {
        console.error("Failed to toggle star:", error);
      } finally {
        setIsStarring(false);
      }
    };

    return (
      <>
        {variant === "list" ? (
          <div ref={ref} className="w-full">
            <Card
              onClick={handleCardClick}
              onContextMenu={handleCardRightClick}
              onDoubleClick={handleCardDoubleClick}
              onDragStart={(e) => e.preventDefault()}
              draggable={false}
              className={`flex flex-row items-center justify-between gap-4 p-2 hover:bg-secondary transition-colors w-full relative group ${
                isSelected ? "ring-2 ring-blue-500 bg-blue-500/10" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="relative w-16 aspect-square">
                  <Image
                    src={diagram.imageUrl ?? "https://placehold.co/600x600"}
                    alt={diagram.name}
                    fill
                    className="object-cover rounded-md select-none pointer-events-none"
                  />
                </div>

                <CardTitle className="text-sm sm:text-base font-medium truncate">
                  {diagram.name}
                </CardTitle>
              </div>

              {/* Date overlay - only visible on hover */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleStarClick}
                    disabled={isStarring}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Star
                      className={`size-6 transition-all ${
                        isStarred
                          ? "fill-yellow-500 text-yellow-500"
                          : "hover:fill-yellow-300 hover:text-yellow-300"
                      }`}
                    />
                  </button>
                  <Avatar className="rounded-full">
                    <AvatarImage src={owner?.image ?? ""} alt="Avatar" />
                    <AvatarFallback>
                      {owner?.name?.charAt(0) ?? "U"}
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
              onContextMenu={handleCardRightClick}
              onDoubleClick={handleCardDoubleClick}
              onDragStart={(e) => e.preventDefault()}
              draggable={false}
              className={`p-4 overflow-hidden hover:bg-secondary hover:shadow-md transition-shadow w-full h-full flex flex-col relative group ${
                isSelected ? "ring-2 ring-blue-500 bg-blue-500/10" : ""
              }`}
            >
              <CardHeader className="flex items-center justify-between px-0">
                <CardTitle className="text-sm sm:text-base font-medium truncate">
                  {diagram.name}
                </CardTitle>
                <button
                  onClick={handleStarClick}
                  disabled={isStarring}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Star
                    className={`size-6 transition-all ${
                      isStarred
                        ? "fill-yellow-500 text-yellow-500"
                        : "hover:fill-yellow-300 hover:text-yellow-300"
                    }`}
                  />
                </button>
              </CardHeader>
              <CardContent className="flex-1 p-0 relative">
                <div className="relative w-full aspect-6/4">
                  <Image
                    src={diagram.imageUrl ?? "https://placehold.co/600x400"}
                    alt={diagram.name}
                    fill
                    className="object-cover rounded-md select-none pointer-events-none"
                  />

                  <Avatar className="rounded-full absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 top-2 right-2">
                    <AvatarImage src={owner?.image ?? ""} alt="Avatar" />
                    <AvatarFallback>
                      {owner?.name?.charAt(0) ?? "U"}
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
