import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  gradientBorder?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = true,
  gradientBorder = false,
  ...props
}) => {
  if (gradientBorder) {
    return (
      <div className="gradient-card-border">
        <div
          className={twMerge(
            clsx(
              "gradient-card-inner p-6 transition-all duration-300",
              hoverEffect && "hover:shadow-xl hover:shadow-blue-500/5",
              className
            )
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={twMerge(
        clsx(
          "bg-white border border-slate-200/80 rounded-2xl p-6 transition-all duration-200 shadow-xs",
          hoverEffect && "hover:shadow-md hover:border-slate-300/80",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={twMerge(clsx("flex items-center justify-between pb-4 mb-4 border-b border-slate-100", className))} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => (
  <h3 className={twMerge(clsx("text-lg font-bold text-slate-900 tracking-tight", className))} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => (
  <p className={twMerge(clsx("text-sm text-slate-500 mt-0.5", className))} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => <div className={twMerge(clsx("", className))} {...props}>{children}</div>;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={twMerge(clsx("pt-4 mt-4 border-t border-slate-100 flex items-center justify-between", className))} {...props}>
    {children}
  </div>
);
