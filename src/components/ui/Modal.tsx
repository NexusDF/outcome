import type { ReactNode } from "react";
import {
  Dialog,
  Heading,
  Modal as AriaModal,
  ModalOverlay,
} from "react-aria-components";
import { Button } from "./Button";

export type ModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  children: ReactNode;
};

export function Modal({ isOpen, onOpenChange, title, children }: ModalProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable
      className="fixed inset-0 z-50 flex items-end justify-center bg-hero-deep/50 p-3 sm:items-center"
    >
      <AriaModal className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-[28px] bg-surface shadow-card outline-none">
        <Dialog className="p-6 outline-none">
          <div className="mb-4 flex items-start justify-between gap-3">
            <Heading
              slot="title"
              className="text-xl font-extrabold tracking-tight text-ink"
            >
              {title}
            </Heading>
            <Button variant="ghost" slot="close">
              Закрыть
            </Button>
          </div>
          {children}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}
