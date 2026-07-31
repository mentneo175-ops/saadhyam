/**
 * SearchTab.tsx
 * Debounced email search with cancel support, result list, and viewer.
 */

import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MailCard } from "./MailCard";
import { MailViewer } from "./MailViewer";
import { PaginationControls } from "./PaginationControls";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState, ErrorState } from "./MailStates";
import { useMail } from "@/hooks/useMail";
import { usePagination } from "@/hooks/usePagination";
import type { EmailDetail } from "@/lib/gmailApi";
import * as gmailApi from "@/lib/gmailApi";

const DEBOUNCE_MS = 300;

export const SearchTab = memo(function SearchTab() {
  const [query, setQuery] = useState("");
  const [viewingEmail, setViewingEmail] = useState<EmailDetail | null>(null);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const mail = useMail();
  const paging = usePagination();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const doSearch = useCallback(
    async (q: string, token: string | null) => {
      if (!q.trim()) {
        mail.setEmails([]);
        return;
      }
      // Cancel previous
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const cacheKey = `search:${q}:${token ?? "first"}`;
      await mail.fetchEmails(
        () => gmailApi.searchEmails(q, { page_token: token ?? undefined, max_results: 20 }),
        cacheKey
      );
    },
    [mail]
  );

  // Debounced search when query changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    paging.reset();
    debounceRef.current = setTimeout(() => {
      doSearch(query, null);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Re-search when page token changes
  useEffect(() => {
    if (query.trim() && paging.currentToken !== null) {
      doSearch(query, paging.currentToken);
    }
  }, [paging.currentToken]);

  // Sync next page token
  useEffect(() => {
    paging.setNextToken(mail.nextPageToken);
  }, [mail.nextPageToken]);

  const handleRead = useCallback(async (id: string) => {
    setIsLoadingEmail(true);
    try {
      const detail = await gmailApi.getEmail(id);
      setViewingEmail(detail);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open email");
    } finally {
      setIsLoadingEmail(false);
    }
  }, []);

  if (viewingEmail || isLoadingEmail) {
    return (
      <MailViewer
        email={viewingEmail}
        isLoading={isLoadingEmail}
        onClose={() => setViewingEmail(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="mail-search-input"
            type="search"
            placeholder="Search emails…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-9"
            aria-label="Search emails"
            autoFocus
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => {
                setQuery("");
                mail.setEmails([]);
              }}
              aria-label="Clear search"
            >
              <X className="w-4 h-4" aria-hidden />
            </Button>
          )}
        </div>
        {mail.isLoading && query && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1" aria-live="polite">
            <Loader2 className="w-3 h-3 animate-spin" aria-hidden />
            Searching…
          </p>
        )}
        {!mail.isLoading && query && mail.emails.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1" aria-live="polite">
            {mail.emails.length} results
            {mail.hasMore ? "+" : ""}
          </p>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {mail.isLoading && <LoadingSkeleton rows={6} />}
        {!mail.isLoading && mail.error && (
          <ErrorState message={mail.error} onRetry={() => doSearch(query, null)} />
        )}
        {!mail.isLoading && !mail.error && !query && (
          <EmptyState
            title="Search your mail"
            description="Type a keyword, sender, or subject to find emails."
            icon={<Search className="w-8 h-8 text-muted-foreground" aria-hidden />}
          />
        )}
        {!mail.isLoading && !mail.error && query && mail.emails.length === 0 && (
          <EmptyState
            title="No results found"
            description={`No emails matched "${query}". Try a different search term.`}
          />
        )}
        {!mail.isLoading &&
          mail.emails.map((email) => (
            <MailCard
              key={email.id}
              email={email}
              isSelected={false}
              onSelect={() => {}}
              onRead={handleRead}
              onArchive={async () => {}}
              onDelete={async () => {}}
              onStar={async () => {}}
              onMarkRead={async () => {}}
              onMarkUnread={async () => {}}
            />
          ))}
      </div>

      {/* Pagination */}
      {!mail.isLoading && mail.emails.length > 0 && (
        <PaginationControls
          pageIndex={paging.pageIndex}
          canGoBack={paging.canGoBack}
          canGoForward={paging.canGoForward}
          isLoading={mail.isLoading}
          onPrev={paging.goPrev}
          onNext={() => paging.nextToken && paging.goNext(paging.nextToken)}
        />
      )}
    </div>
  );
});
