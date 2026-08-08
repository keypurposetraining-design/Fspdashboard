import React, { useState } from "react";
import { mockPosts, CommunityPost } from "@/data/mockData";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  MessageSquare,
  ThumbsUp,
  Share2,
  Filter,
  PlusCircle,
  Sparkles,
  TrendingUp,
  Image,
  Link,
  Paperclip,
} from "lucide-react";
import { clsx } from "clsx";

export const CommunityView: React.FC = () => {
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [posts, setPosts] = useState<CommunityPost[]>(mockPosts);

  const toggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            upvotes: isLiked ? p.upvotes + 1 : p.upvotes - 1,
          };
        }
        return p;
      })
    );
  };

  const tags = ["All", "GroupDynamics", "WorkshopTools", "Pricing", "Proposals", "Templates"];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">
              FSP FACILITATOR LOUNGE
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Community & Peer Lounge
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Connect, exchange workshop strategies, and collaborate with certified facilitators worldwide.
          </p>
        </div>

        <Button variant="primary" size="md" icon={<PlusCircle className="w-4 h-4" />}>
          Start Discussion Topic
        </Button>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Post Creator & Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post Widget */}
          <Card className="border-2 border-blue-100 bg-blue-50/20">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0F4CFF]" />
                Share a question, template, or case study
              </h3>
              <textarea
                placeholder="What facilitation challenge or wins are on your mind today?"
                rows={3}
                className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F4CFF] resize-none"
              />
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <button className="p-2 rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Attach Image">
                    <Image className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Add Link">
                    <Link className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Attach Document">
                    <Paperclip className="w-4 h-4" />
                  </button>
                </div>
                <Button variant="primary" size="sm">
                  Publish Post
                </Button>
              </div>
            </div>
          </Card>

          {/* Tags Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={clsx(
                  "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                  selectedTag === tag
                    ? "bg-[#0F4CFF] text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                )}
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Posts Feed */}
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} hoverEffect className="space-y-4">
                {/* Author Info Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {post.author.name}
                        </h4>
                        <Badge variant="pro" size="sm">
                          {post.author.tier}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">{post.author.role} • {post.postedAt}</p>
                    </div>
                  </div>
                  <Badge variant="primary" size="sm">
                    #{post.category}
                  </Badge>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug mb-1">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {post.tags.map((t, idx) => (
                    <span key={idx} className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Footer Interaction Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors",
                      post.isLiked ? "bg-blue-50 text-[#0F4CFF]" : "hover:bg-slate-100"
                    )}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{post.upvotes} Upvotes</span>
                  </button>

                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.commentsCount} Comments</span>
                  </button>

                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column (1 col): Member Spotlight & Guidelines */}
        <div className="space-y-6">
          {/* Member Spotlight Card */}
          <Card gradientBorder>
            <div className="space-y-3 text-center p-2">
              <div className="w-10 h-10 rounded-full bg-orange-100 text-[#FF7A00] flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF7A00]">
                FACILITATOR SPOTLIGHT
              </span>
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80"
                alt="Spotlight Facilitator"
                className="w-20 h-20 rounded-full object-cover mx-auto ring-4 ring-blue-500/20"
              />
              <h3 className="text-base font-bold text-slate-900">Sophia Martinez</h3>
              <p className="text-xs text-slate-500">
                Closed $120k in hybrid executive workshops in Q2.
              </p>
              <Button variant="outline" size="sm" fullWidth>
                Read Member Q&A
              </Button>
            </div>
          </Card>

          {/* Lounge Guidelines Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">FSP Community Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600">
              <p>1. Respect confidentiality of client workshop cases.</p>
              <p>2. Keep feedback constructive and practice-focused.</p>
              <p>3. Tag posts appropriately to help peer discovery.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
