"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Button } from "@student-management-system/ui/components/button";
import { useIsMobile } from "@student-management-system/ui/hooks/use-mobile";
import { cn } from "@student-management-system/ui/lib/utils";
import { Menu, PanelLeft } from "lucide-react";
import * as React from "react";

const SIDEBAR_WIDTH = "220px";
const SIDEBAR_WIDTH_ICON = "56px";

type SidebarState = "expanded" | "collapsed";

type SidebarContextValue = {
  state: SidebarState;
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return ctx;
}

type SidebarProviderProps = React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  className,
  style,
  children,
  ...props
}: SidebarProviderProps) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = openProp ?? internalOpen;

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (onOpenChange) {
        onOpenChange(value);
      } else {
        setInternalOpen(value);
      }
    },
    [onOpenChange]
  );

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev);
    } else {
      setOpen(!open);
    }
  }, [isMobile, open, setOpen]);

  const state: SidebarState = open ? "expanded" : "collapsed";

  const value = React.useMemo<SidebarContextValue>(
    () => ({
      state,
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, openMobile, isMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={value}>
      <div
        data-slot="sidebar-wrapper"
        className={cn("group/sidebar-wrapper flex min-h-svh w-full", className)}
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

type SidebarProps = React.ComponentProps<"aside">;

function Sidebar({ className, children, ...props }: SidebarProps) {
  const { state, isMobile, openMobile, setOpenMobile } = useSidebar();

  const innerClasses = cn(
    "group/sidebar flex h-full w-full flex-col bg-sidebar text-sidebar-foreground",
    className
  );

  return (
    <>
      <aside
        data-slot="sidebar"
        data-state={state}
        data-collapsible="icon"
        className={cn(
          "group/sidebar hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex",
          "w-[var(--sidebar-width)] transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "data-[state=collapsed]:w-[var(--sidebar-width-icon)]",
          className
        )}
        {...props}
      >
        {children}
      </aside>

      <DialogPrimitive.Root open={openMobile} onOpenChange={setOpenMobile}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop
            className={cn(
              "fixed inset-0 z-50 bg-black/40 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden",
              "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
            )}
          />
          <DialogPrimitive.Popup
            data-slot="sidebar-mobile"
            data-state="expanded"
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex h-svh w-[var(--sidebar-width)] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-lg outline-none md:hidden",
              "data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            )}
          >
            {isMobile ? (
              <div className={innerClasses} data-state="expanded">
                <DialogPrimitive.Title className="sr-only">
                  Navigation
                </DialogPrimitive.Title>
                {children}
              </div>
            ) : null}
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

type SidebarInsetProps = React.ComponentProps<"main">;

function SidebarInset({ className, ...props }: SidebarInsetProps) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex min-h-svh flex-1 flex-col overflow-hidden bg-background",
        className
      )}
      {...props}
    />
  );
}

type SidebarTriggerProps = React.ComponentProps<typeof Button>;

function SidebarTrigger({ className, onClick, ...props }: SidebarTriggerProps) {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("size-8", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      aria-label="Toggle sidebar"
      {...props}
    >
      <Menu className="md:hidden" />
      <PanelLeft className="hidden md:inline" />
    </Button>
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn(
        "flex items-center gap-2 px-5 py-5 group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-2",
        className
      )}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-1 overflow-auto px-3 py-4 group-data-[state=collapsed]/sidebar:px-2",
        className
      )}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("flex flex-col", className)}
      {...props}
    />
  );
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-separator"
      role="separator"
      className={cn("h-px shrink-0 bg-sidebar-border", className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn("flex w-full flex-col gap-1", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      className={cn("relative", className)}
      {...props}
    />
  );
}

type SidebarMenuButtonProps = React.ComponentProps<"button"> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string;
};

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  tooltip,
  className,
  children,
  title,
  ...props
}: SidebarMenuButtonProps) {
  const { state, isMobile } = useSidebar();
  const collapsedTitle =
    !isMobile && state === "collapsed" ? (tooltip ?? title) : title;

  const baseClass = cn(
    "group/menu-button flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
    "group-data-[state=collapsed]/sidebar:h-10 group-data-[state=collapsed]/sidebar:w-10 group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:gap-0 group-data-[state=collapsed]/sidebar:px-0",
    isActive
      ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
    className
  );

  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement<
      React.HTMLAttributes<HTMLElement> & { className?: string }
    >;
    return React.cloneElement(child, {
      "data-slot": "sidebar-menu-button",
      "data-active": isActive ? "true" : undefined,
      title: collapsedTitle,
      className: cn(baseClass, child.props.className),
    } as React.HTMLAttributes<HTMLElement>);
  }

  return (
    <button
      data-slot="sidebar-menu-button"
      data-active={isActive ? "true" : undefined}
      type="button"
      title={collapsedTitle}
      className={baseClass}
      {...props}
    >
      {children}
    </button>
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
