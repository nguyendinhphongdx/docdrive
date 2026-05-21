"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Lock, QrCode } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CreateDocumentResponse } from "../types";

interface DocumentCreatedDialogProps {
  open: boolean;
  data: CreateDocumentResponse | null;
  onOpenChange: (open: boolean) => void;
  /** Show the edit URL warning (only true for anonymous creators). */
  showEditUrl: boolean;
}

export function DocumentCreatedDialog({
  open,
  data,
  onOpenChange,
  showEditUrl,
}: DocumentCreatedDialogProps) {
  if (!data) return null;

  const isPublic = data.visibility === "PUBLIC" && !!data.shareUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Document created</DialogTitle>
          <DialogDescription>
            {data.expiresAt
              ? `This document will expire on ${new Date(data.expiresAt).toLocaleString()}.`
              : "This document has no expiration."}
          </DialogDescription>
        </DialogHeader>

        {isPublic ? (
          <Tabs defaultValue="link" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">Link</TabsTrigger>
              <TabsTrigger value="qr">
                <QrCode className="mr-2 h-4 w-4" />
                QR
              </TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="space-y-4">
              <CopyableUrl label="Share URL (anyone with the link)" value={data.shareUrl!} />
              {showEditUrl && (
                <div className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
                  <CopyableUrl
                    label="Edit URL — bookmark this, it's the ONLY way to edit later"
                    value={data.editUrl}
                  />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    We don&apos;t save this anywhere. If you lose it, the document
                    becomes read-only. Sign up to keep your documents tied to an
                    account.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="qr" className="flex flex-col items-center gap-3 py-4">
              <div className="rounded-md bg-white p-3">
                <QRCodeSVG value={data.shareUrl!} size={196} level="M" />
              </div>
              <p className="text-xs text-muted-foreground break-all text-center">
                {data.shareUrl}
              </p>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
            <Lock className="mr-2 inline h-4 w-4" />
            This document is private. Click <strong>Share</strong> on the
            document page to generate a link.
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {isPublic && (
            <Button asChild variant="outline">
              <Link href={data.shareUrl!} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </Link>
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CopyableUrl({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <Input value={value} readOnly onFocus={(e) => e.currentTarget.select()} />
        <Button type="button" size="icon" variant="outline" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
