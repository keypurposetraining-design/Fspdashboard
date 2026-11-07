"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { logMemberActivity } from "@/lib/activity-log";
import { useAuth } from "@/lib/auth";
import { toDataError } from "@/lib/data/errors";
import { PostRow, errorMessage } from "@/lib/legacy-rows";
import { createClient } from "@/lib/supabase/client";
import {
RefreshCcw,
Sparkles
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

export const CommunityView: React.FC = () => {
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true); setLoadError(null);
      const { data, error } = await supabase
        .from("community_posts")
        // community_posts has three FKs to users (user_id, created_by,
        // updated_by), so the embed must name the one we mean: the author.
        // Without the hint PostgREST refuses the request with PGRST201.
        .select(`
          id,
          content,
          created_at,
          parent_post_id,
          users!community_posts_user_id_fkey (
            name,
            role
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts((data || []) as unknown as PostRow[]);
    } catch (err: unknown) {
      // toDataError logs the raw error for developers; no second console.error.
      setLoadError(toDataError(err, "community posts").message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      fetchPosts();
    });
    return () => { cancelled = true; };
  }, [fetchPosts]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newContent.trim()) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("community_posts")
        .insert({
          user_id: user.id,
          content: newContent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      await logMemberActivity("COMMUNITY_POST", { character_count: newContent.trim().length });

      setNewContent("");
      await fetchPosts();
    } catch (err: unknown) {
      alert("Error publishing post: " + errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">
              FSP FACILITATOR LOUNGE
            </Badge>
          </div>
          <h1 className="fsp-dot text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight">
            Community &amp; Peer Lounge
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Connect, exchange workshop strategies, and collaborate with certified facilitators worldwide.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPosts} icon={<RefreshCcw className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col – Post Creator & Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-2 border-[var(--brand-navy-light)] bg-[var(--brand-navy)]/5">
            <form onSubmit={handleCreatePost} className="space-y-3">
              <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--brand-navy)]" />
                Share a question, template, or case study
              </h3>
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="What facilitation challenge or wins are on your mind today?"
                rows={3}
                className="w-full p-3 text-xs bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[var(--brand-navy)] resize-none"
                required
              />
              <div className="flex items-center justify-end pt-1">
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? "Publishing..." : "Publish Post"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Posts Feed */}
          {loadError && <div role="alert" className="mb-4 flex items-start gap-3 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-light)] p-4 text-sm font-medium">{loadError}</div>}
          {loading ? (
            <div className="py-6 text-center text-[var(--muted)] font-medium">Loading forum feeds...</div>
          ) : posts.length === 0 ? (
            <div className="py-6 text-center text-[var(--muted)]">No discussions started yet. Be the first!</div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="space-y-4 p-5 bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--muted-light)] flex items-center justify-center font-bold text-[var(--muted)] uppercase">
                        {post.users?.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[var(--foreground)]">
                            {post.users?.name || "Anonymous"}
                          </h4>
                          <Badge variant="pro" size="sm">
                            {post.users?.role || "Member"}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--muted)] mt-0.5">Posted: {new Date(post.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--muted)] leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Col */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Lounge Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-[var(--muted)] space-y-2 leading-relaxed">
              <p>1. Be constructive and support other peers.</p>
              <p>2. Share canvases, templates, and Miro links.</p>
              <p>3. Do not post spam or unsolicited sales offers.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
