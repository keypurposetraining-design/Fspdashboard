"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  MessageSquare,
  ThumbsUp,
  Sparkles,
  PlusCircle,
  RefreshCcw,
  User,
} from "lucide-react";
import { logMemberActivity } from "@/lib/activity-log";

export const CommunityView: React.FC = () => {
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  const [posts, setPosts] = useState<any[]>([]);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [user]);

  async function fetchPosts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          id,
          content,
          created_at,
          parent_post_id,
          users (
            name,
            role
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err: any) {
      console.error("Error loading community posts:", err.message);
    } finally {
      setLoading(false);
    }
  }

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
    } catch (err: any) {
      alert("Error publishing post: " + err.message);
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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Community &amp; Peer Lounge
          </h1>
          <p className="text-sm text-slate-600 mt-1">
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
          <Card className="border-2 border-blue-100 bg-blue-50/20">
            <form onSubmit={handleCreatePost} className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0F4CFF]" />
                Share a question, template, or case study
              </h3>
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="What facilitation challenge or wins are on your mind today?"
                rows={3}
                className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F4CFF] resize-none"
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
          {loading ? (
            <div className="py-6 text-center text-slate-500 font-medium">Loading forum feeds...</div>
          ) : posts.length === 0 ? (
            <div className="py-6 text-center text-slate-500">No discussions started yet. Be the first!</div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="space-y-4 p-5 bg-white border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 uppercase">
                        {post.users?.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {post.users?.name || "Anonymous"}
                          </h4>
                          <Badge variant="pro" size="sm">
                            {post.users?.role || "Member"}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Posted: {new Date(post.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
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
            <CardContent className="text-xs text-slate-500 space-y-2 leading-relaxed">
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
