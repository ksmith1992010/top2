import { cn } from "@/lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        variant === "primary" && "auth-button-primary",
        variant === "secondary" && "auth-button-secondary",
        variant === "ghost" &&
          "rounded-lg px-3 py-2 text-sm text-top-muted transition-colors hover:bg-top-surface-raised hover:text-top-text",
        className,
      )}
      {...props}
    />
  );
}
