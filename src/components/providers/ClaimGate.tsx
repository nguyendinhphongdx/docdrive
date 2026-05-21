"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  forgetOwnedDocument,
  useOwnedDocuments,
} from "@/features/document";
import {
  forgetOwnedFolder,
  useOwnedFolders,
} from "@/features/folder";
import {
  useClaim,
  type ClaimItem,
  type ClaimResult,
} from "@/features/document/hooks/useClaim";

const SUPPRESS_KEY = "docdrive:claim-suppressed";

export function ClaimGate() {
  const { status } = useSession();
  const docs = useOwnedDocuments();
  const folders = useOwnedFolders();
  const claim = useClaim();

  const [open, setOpen] = useState(false);
  const [pickedDocs, setPickedDocs] = useState<Record<string, boolean>>({});
  const [pickedFolders, setPickedFolders] = useState<Record<string, boolean>>({});
  const [initializedFor, setInitializedFor] = useState<string | null>(null);

  const totalEligible = docs.length + folders.length;

  // First time we see an authenticated session with eligible items in this
  // browser session, prime the checkboxes and open the modal. Setting state
  // during render is the React-recommended pattern for derived prompts; we
  // gate on `initializedFor` so this runs once per (slug-set) signature.
  const sessionKey = `${status}:${docs.map((d) => d.slug).join(",")}:${folders.map((f) => f.id).join(",")}`;
  const suppressed =
    typeof window !== "undefined"
      ? window.sessionStorage.getItem(SUPPRESS_KEY)
      : null;
  if (
    status === "authenticated" &&
    totalEligible > 0 &&
    !suppressed &&
    initializedFor !== sessionKey
  ) {
    setInitializedFor(sessionKey);
    setPickedDocs(Object.fromEntries(docs.map((d) => [d.slug, true])));
    setPickedFolders(Object.fromEntries(folders.map((f) => [f.id, true])));
    setOpen(true);
  }

  const items = useMemo<ClaimItem[]>(() => {
    const selectedDocs: ClaimItem[] = docs
      .filter((d) => pickedDocs[d.slug])
      .map((d) => ({ kind: "doc", slug: d.slug, editToken: d.editToken }));
    const selectedFolders: ClaimItem[] = folders
      .filter((f) => pickedFolders[f.id])
      .map((f) => ({ kind: "folder", slug: f.slug, editToken: f.editToken }));
    return [...selectedDocs, ...selectedFolders];
  }, [docs, folders, pickedDocs, pickedFolders]);

  const handleClose = () => {
    setOpen(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(SUPPRESS_KEY, "1");
    }
  };

  const handleClaim = () => {
    if (items.length === 0) {
      handleClose();
      return;
    }
    claim.mutate(items, {
      onSuccess: (results: ClaimResult[]) => {
        const claimed = results.filter((r) => r.status === "claimed");
        const folderIdBySlug = new Map(folders.map((f) => [f.slug, f.id]));
        for (const r of claimed) {
          if (r.kind === "doc") {
            forgetOwnedDocument(r.slug);
          } else {
            const id = folderIdBySlug.get(r.slug);
            if (id) forgetOwnedFolder(id);
          }
        }
        const failed = results.length - claimed.length;
        if (claimed.length > 0) {
          toast.success(
            `Claimed ${claimed.length} item${claimed.length === 1 ? "" : "s"}` +
              (failed > 0 ? ` · ${failed} skipped` : ""),
          );
        } else if (failed > 0) {
          toast.error("Couldn't claim any items — tokens may have expired");
        }
        handleClose();
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Claim failed"),
    });
  };

  if (totalEligible === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Claim anonymous items</DialogTitle>
          <DialogDescription>
            We found {totalEligible} item{totalEligible === 1 ? "" : "s"} you
            created on this browser before signing in. Pick which to attach to
            your account.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
          {docs.length > 0 && (
            <section className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Documents
              </h3>
              <ul className="space-y-1">
                {docs.map((d) => (
                  <li key={d.slug} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
                    <Checkbox
                      id={`doc-${d.slug}`}
                      checked={!!pickedDocs[d.slug]}
                      onCheckedChange={(v) =>
                        setPickedDocs((p) => ({ ...p, [d.slug]: !!v }))
                      }
                    />
                    <label
                      htmlFor={`doc-${d.slug}`}
                      className="flex-1 cursor-pointer truncate text-sm"
                    >
                      {d.title || "Untitled document"}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {folders.length > 0 && (
            <section className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Folders
              </h3>
              <ul className="space-y-1">
                {folders.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
                    <Checkbox
                      id={`folder-${f.id}`}
                      checked={!!pickedFolders[f.id]}
                      onCheckedChange={(v) =>
                        setPickedFolders((p) => ({ ...p, [f.id]: !!v }))
                      }
                    />
                    <label
                      htmlFor={`folder-${f.id}`}
                      className="flex-1 cursor-pointer truncate text-sm"
                    >
                      {f.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {new Date(f.createdAt).toLocaleDateString()}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleClose}>
            Not now
          </Button>
          <Button onClick={handleClaim} disabled={claim.isPending || items.length === 0}>
            {claim.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Claiming…
              </>
            ) : (
              `Claim ${items.length} item${items.length === 1 ? "" : "s"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
