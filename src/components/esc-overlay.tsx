"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";

interface EscOverlayProps {
  open: boolean;
  onResume: () => void;
  onQuit: () => void;
}

export function EscOverlay({ open, onResume, onQuit }: EscOverlayProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => { if (!o) onResume(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm
                     data-[state=open]:animate-in data-[state=open]:fade-in-0
                     data-[state=closed]:animate-out data-[state=closed]:fade-out-0
                     duration-150"
        />
        <DialogPrimitive.Content
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onResume();
          }}
          className="fixed top-1/2 left-1/2 z-[100] -translate-x-1/2 -translate-y-1/2
                     w-80 max-w-[calc(100vw-32px)] bg-background rounded-lg
                     border border-border shadow-xl p-6 flex flex-col gap-4
                     data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
                     data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
                     duration-150"
          aria-label="Game paused"
        >
          <DialogPrimitive.Title className="text-xl font-semibold tracking-tight text-center">
            Paused
          </DialogPrimitive.Title>
          <Button variant="default" className="w-full min-h-[44px]" onClick={onResume}>
            Resume
          </Button>
          <Button
            variant="outline"
            className="w-full min-h-[44px] text-muted-foreground hover:text-foreground"
            onClick={onQuit}
          >
            Quit to Lobby
          </Button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
