"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { Bell, Search } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { useEffect, useState, useRef } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ModeToggle } from "./mode-toggle";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: session } = useSession();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearch("");
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
    }
  };

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        e.stopPropagation();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
    };
    document.addEventListener("keydown", handleShortcut, true);
    return () => {
      document.removeEventListener("keydown", handleShortcut, true);
    };
  }, []);

  return (
    <header className="flex h-16 px-4 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear border-b">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-4"
        />
        <InputGroup className="relative w-96">
          <InputGroupInput
            ref={searchInputRef}
            id="search-input"
            placeholder="Search..."
            value={search}
            onChange={handleSearch}
            onKeyDown={handleSearchKeyDown}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell />
          </Button>
          <ModeToggle />
        </div>
        <div className="p-0.5 rounded-full hover:bg-conic/decreasing from-violet-700 via-lime-300 to-violet-700 transition-all duration-300 ease-linear">
          <Avatar className="cursor-pointer">
            <AvatarImage src={session?.user?.image ?? ""} alt="Avatar" />
            <AvatarFallback>
              {session?.user?.name?.charAt(0) ?? "User"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
