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
  onClick?: () => void;
}

export default function CreateButton({
  label,
  variant = "secondary",
  size = "default",
  icon,
  onClick,
}: CreateButtonProps) {
  return (
    <RippleButton variant={variant} size={size} onClick={onClick}>
      {label}
      {icon}
      <RippleButtonRipples />
    </RippleButton>
  );
}
