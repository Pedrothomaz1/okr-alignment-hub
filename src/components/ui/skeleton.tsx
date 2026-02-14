import { cn } from "@/lib/utils";

type SkeletonVariant = "default" | "text" | "circle";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
}

const variantClasses: Record<SkeletonVariant, string> = {
  default: "animate-pulse rounded-[calc(var(--radius)-2px)] bg-muted",
  text: "skeleton-text",
  circle: "skeleton-circle",
};

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  return <div className={cn(variantClasses[variant], className)} {...props} />;
}

export { Skeleton };
