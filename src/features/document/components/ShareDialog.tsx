"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Lock,
  QrCode,
  Share2,
  Unlock,
} from "lucide-react";
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
import type { Visibility } from "../types";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  visibility: Visibility;
  shareToken: string | null;
  expiresAt: string | null;
  /** When true, the user lacks a session — show the editUrl warning + no toggle. */
  isAnonymous: boolean;
  /** Required when isAnonymous so we can show the bookmark-this URL. */
  editToken: string | null;
  /** When provided, owner can flip visibility from this dialog. */
  onToggleVisibility?: (next: Visibility) => void;
  toggling?: boolean;
}

export function ShareDialog({
  open,
  onOpenChange,
  slug: _slug,
  visibility,
  shareToken,
  expiresAt,
  isAnonymous,
  editToken,
  onToggleVisibility,
  toggling = false,
}: ShareDialogProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = shareToken ? `${origin}/sd/${shareToken}` : null;
  const editUrl =
    editToken && origin ? `${origin}/d/${_slug}?token=${editToken}` : null;
  const isPublic = visibility === "PUBLIC" && !!shareUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share document
          </DialogTitle>
          <DialogDescription>
            {isPublic
              ? expiresAt
                ? `Anyone with the link can read this until ${new Date(expiresAt).toLocaleString()}.`
                : "Anyone with the link can read this."
              : "This document is private — only you can see it."}
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
              <CopyableUrl label="Share URL" value={shareUrl!} />
              {isAnonymous && editUrl && (
                <div className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
                  <CopyableUrl
                    label="Your edit URL — bookmark this NOW"
                    value={editUrl}
                  />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    The only way to edit later. We don&apos;t save it for you.
                    Sign up to claim this document into an account.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="qr" className="flex flex-col items-center gap-3 py-4">
              <div className="rounded-md bg-white p-3">
                <QRCodeSVG value={shareUrl!} size={196} level="M" />
              </div>
              <p className="text-xs text-muted-foreground break-all text-center">
                {shareUrl}
              </p>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-3 rounded-md border bg-muted/40 p-4 text-sm">
            <div className="flex items-start gap-2 text-muted-foreground">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                No one else can see this document. Generate a share link to
                give anyone with the URL read access.
              </p>
            </div>
            {onToggleVisibility && (
              <Button
                onClick={() => onToggleVisibility("PUBLIC")}
                disabled={toggling}
                className="w-full"
              >
                {toggling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Generate share link
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {isPublic && shareUrl && (
            <Button asChild variant="outline">
              <Link href={shareUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </Link>
            </Button>
          )}
          {isPublic && onToggleVisibility && (
            <Button
              variant="ghost"
              onClick={() => onToggleVisibility("PRIVATE")}
              disabled={toggling}
              className="text-destructive hover:text-destructive"
            >
              {toggling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Unlock className="mr-2 h-4 w-4" />
              )}
              Stop sharing
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
