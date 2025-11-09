import {
  RippleButton,
  RippleButtonRipples,
  type RippleButtonProps,
} from "@/components/animate-ui/components/buttons/ripple";

interface CreateButtonProps {
  label: string;
  icon: React.ReactNode;
  variant?: RippleButtonProps["variant"];
  size?: RippleButtonProps["size"];
}

export default function CreateButton({
  label,
  variant = "secondary",
  size = "default",
  icon,
}: CreateButtonProps) {
  return (
    <RippleButton variant={variant} size={size}>
      {label}
      {icon}
      <RippleButtonRipples />
    </RippleButton>
  );
}
