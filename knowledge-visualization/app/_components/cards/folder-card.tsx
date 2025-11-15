"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "next-intl";
import { FullFolder } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Folder } from "lucide-react";
import { forwardRef } from "react";

interface FolderCardProps {
  variant: "list" | "grid";
  folder: FullFolder;
  isSelected?: boolean;
  onCardClick?: (folderId: string, e: React.MouseEvent) => void;
  onCardRightClick?: (folderId: string, e: React.MouseEvent) => void;
}

export const FolderCard = forwardRef<HTMLDivElement, FolderCardProps>(
  function FolderCard(
    { variant, folder, isSelected = false, onCardClick, onCardRightClick },
    ref
  ) {
    const locale = useLocale();

    const handleCardDoubleClick = () => {
      // Navigate to folder view (can be implemented later)
      // router.push(`/folders/${folder.id}`);
    };

    const handleCardClick = (e: React.MouseEvent) => {
      // Don't trigger if clicking on buttons or links
      if ((e.target as HTMLElement).closest("button")) return;
      if ((e.target as HTMLElement).closest("a")) return;

      onCardClick?.(folder.id, e);
    };

    const handleCardRightClick = (e: React.MouseEvent) => {
      // Don't trigger if clicking on buttons or links
      if ((e.target as HTMLElement).closest("button")) return;
      if ((e.target as HTMLElement).closest("a")) return;

      onCardRightClick?.(folder.id, e);
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
                <div className="relative w-16 aspect-square flex items-center justify-center bg-muted rounded-md">
                  <Folder className="size-8 text-muted-foreground" />
                </div>

                <CardTitle className="text-sm sm:text-base font-medium truncate">
                  {folder.name}
                </CardTitle>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Avatar className="rounded-full">
                  <AvatarImage src={folder.owner.image ?? ""} alt="Avatar" />
                  <AvatarFallback>
                    {folder.owner.name?.charAt(0) ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <Badge variant="secondary" className="text-xs">
                  {new Date(folder.createdAt).toLocaleDateString(locale)}
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
                  {folder.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 relative">
                <div className="relative w-full aspect-6/4 flex items-center justify-center bg-muted rounded-md">
                  <Folder className="size-16 text-muted-foreground" />

                  <Avatar className="rounded-full absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 top-2 right-2">
                    <AvatarImage src={folder.owner.image ?? ""} alt="Avatar" />
                    <AvatarFallback>
                      {folder.owner.name?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>

                  <Badge
                    variant="secondary"
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs"
                  >
                    {new Date(folder.createdAt).toLocaleDateString(locale)}
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
