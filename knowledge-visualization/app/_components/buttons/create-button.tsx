import { Button } from "@/components/ui/button";

interface CreateButtonProps {
  label: string;
  icon: React.ReactNode;
}

export function CreateButton({ label, icon }: CreateButtonProps) {
  return (
    <Button variant="ghost">
      {label}
      {icon}
    </Button>
  );
}
