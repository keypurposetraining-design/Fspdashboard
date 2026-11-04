"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Search, Trash2, Eye, ShieldAlert, MessageSquare, RefreshCcw } from "lucide-react";

export default function AdminCommunity() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
      }
    });
    fetchPosts();
  }, []);

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
          user_id,
          users (
            name,
            email,
            role
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
      setFilteredPosts(data || []);
    } catch (err: any) {
      console.error("Error fetching community posts:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle Search
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = posts.filter(p => 
      (p.content || "").toLowerCase().includes(q) || 
      (p.users?.name || "").toLowerCase().includes(q) ||
      (p.users?.email || "").toLowerCase().includes(q)
    );
    setFilteredPosts(filtered);
  }, [searchQuery, posts]);

  const handleDeletePost = async (postId: string, contentSnippet: string) => {
    if (!confirm("Are you sure you want to moderate and delete this post? This action is logged.")) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action: "community post moderated",
        table_name: "community_posts",
        record_id: postId,
        performed_by: currentUser?.id,
        details: { contentSnippet }
      });

      await fetchPosts();
    } catch (err: any) {
      alert("Error deleting post: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="fsp-dot text-2xl font-black text-slate-900 tracking-tight">Community Moderation</h1>
          <p className="text-sm text-slate-500 font-medium">Monitor user-generated discussion forum posts and moderate inappropriate content.</p>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search posts content or author..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchPosts} icon={<RefreshCcw className="w-4 h-4" />}>
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* POSTS LIST */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium">Loading community feeds...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium">No posts found in the forum.</div>
          ) : (
            <Table
              columns={[
                { header: "Author", accessor: "author", render: (row) => (
                  <div>
                    <span className="font-semibold block text-slate-800">{row.users?.name || "Anonymous"}</span>
                    <span className="text-xs text-slate-400">{row.users?.email || "—"}</span>
                  </div>
                ) },
                { header: "Post Content", accessor: "content", render: (row) => (
                  <div className="max-w-md whitespace-pre-wrap text-sm text-slate-700 font-medium">
                    {row.content}
                  </div>
                ) },
                { header: "Type", accessor: "parent_post_id", render: (row) => (
                  row.parent_post_id ? <Badge variant="neutral">Reply</Badge> : <Badge variant="primary">Thread Starter</Badge>
                ) },
                { header: "Posted At", accessor: "created_at", render: (row) => new Date(row.created_at).toLocaleString() },
                { header: "Actions", accessor: "actions", render: (row) => (
                  <Button variant="outline" size="xs" onClick={() => handleDeletePost(row.id, row.content?.substring(0, 50))} className="border-rose-200 text-rose-600 hover:bg-rose-50" icon={<Trash2 className="w-3 h-3" />}>
                    Remove Post
                  </Button>
                ) }
              ]}
              data={filteredPosts}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
