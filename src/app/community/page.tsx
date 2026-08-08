import React from "react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Heart, MessageCircle, Share2, Filter, Users, HelpCircle, Upload, UserPlus, Pen, Search } from "lucide-react";
import { mockPosts, mockLeaderboard, mockUser } from "@/data/mockData";

// Dummy member directory data
const mockMembers = Array.from({ length: 12 }, (_, i) => ({
  id: `member-${i}`,
  name: ["Anand", "Priya", "Raja", "Sneha", "Kumar", "Latha"][i % 6] + " " + ["Sharma", "Patel", "Rao", "Singh", "Kaur", "Mehta"][i % 6],
  avatar: `https://images.unsplash.com/photo-${150 + i}?w=150&auto=format&fit=crop&q=80`,
  company: ["Acme Corp", "TechSoft", "InnovateX", "FutureLabs"][i % 4],
  city: ["Chennai", "Bangalore", "Hyderabad", "Delhi"][i % 4],
  expertise: ["Agile Coaching", "Design Thinking", "Facilitation", "Leadership"][i % 4],
  years: Math.floor(Math.random() * 10) + 1,
}));

// Dummy discussion categories
const discussionCategories = [
  { name: "General Discussion", posts: 124, latest: "5 min ago" },
  { name: "Facilitation Tips", posts: 87, latest: "10 min ago" },
  { name: "Corporate Training", posts: 53, latest: "22 min ago" },
  { name: "Marketing", posts: 41, latest: "1 hr ago" },
  { name: "Business Growth", posts: 29, latest: "2 hrs ago" },
  { name: "Activity Ideas", posts: 19, latest: "3 hrs ago" },
  { name: "Technology", posts: 12, latest: "Yesterday" },
  { name: "Q&A", posts: 67, latest: "30 min ago" },
];

// Dummy mentors
const mockMentors = [
  {
    id: "mentor-1",
    name: "Anand Verma",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    expertise: "Executive Facilitation",
    years: 12,
  },
  {
    id: "mentor-2",
    name: "Priya Nair",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    expertise: "Agile Coaching",
    years: 9,
  },
];

// Dummy success stories
const successStories = [
  {
    id: "story-1",
    title: "From Rookie to Certified Mentor",
    photo: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80",
    description: "Karunai turned her first 30‑day challenge into a full‑time mentorship role within 3 months.",
  },
  {
    id: "story-2",
    title: "Scaling Workshops Globally",
    photo: "https://images.unsplash.com/photo-1515162305281-9be0c4e1e636?w=300&auto=format&fit=crop&q=80",
    description: "Raja leveraged the community to secure 5 corporate contracts across APAC.",
  },
];

export default function CommunityPage() {
  return (
    <main className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <section className="text-center">
        <h1 className="text-4xl font-bold text-primary">FSP Community</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Connect, collaborate, learn, and grow with fellow facilitators across the FSP community.
        </p>
      </section>

      {/* Section 1 – Community Overview */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Members" value="1000+" />
        <StatCard title="Online Now" value="68" />
        <StatCard title="Posts This Week" value="145" />
        <StatCard title="Upcoming Meetups" value="6" />
      </section>

      {/* Section 2 – Community Feed */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Community Feed</h2>
        <div className="space-y-6">
          {mockPosts.map((post) => (
            <Card key={post.id} className="p-4 space-y-2">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={post.author.avatar} alt={post.author.name} />
                  <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{post.author.name}</p>
                  <p className="text-sm text-muted-foreground">{post.postedAt}</p>
                </div>
              </div>
              <p className="mt-2">{post.content}</p>
              <div className="flex items-center space-x-4 mt-3 text-sm">
                <Button variant="ghost" size="sm">
                  <Heart className="w-4 h-4 mr-1" /> {post.upvotes} Likes
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageCircle className="w-4 h-4 mr-1" /> {post.commentsCount} Comments
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="w-4 h-4 mr-1" /> Share
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 3 – Member Directory */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Member Directory</h2>
        <div className="flex items-center space-x-4 mb-4">
          <Input placeholder="Search members..." className="max-w-sm" />
          <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-1" />Filter</Button>
        </div>
        <ScrollArea className="h-[400px] rounded-md border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockMembers.map((member) => (
              <Card key={member.id} className="p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.company}</p>
                  </div>
                </div>
                <p className="text-sm">{member.city} · {member.expertise}</p>
                <p className="text-sm text-muted-foreground">{member.years} years experience</p>
                <div className="flex space-x-2 mt-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="#" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="#">View Profile</a>
                  </Button>
                  <Button size="sm" asChild>
                    <a href="#">Message</a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </section>

      {/* Section 4 – Discussion Forum */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Discussion Forum</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {discussionCategories.map((cat) => (
            <Card key={cat.name} className="p-4 space-y-2">
              <h3 className="font-medium text-lg">{cat.name}</h3>
              <p className="text-sm text-muted-foreground">{cat.posts} posts</p>
              <p className="text-xs text-muted-foreground">Latest: {cat.latest}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 5 – Mentor Connect */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Mentor Connect</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockMentors.map((mentor) => (
            <Card key={mentor.id} className="p-4 flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={mentor.avatar} alt={mentor.name} />
                <AvatarFallback>{mentor.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{mentor.name}</p>
                <p className="text-sm text-muted-foreground">{mentor.expertise}</p>
                <p className="text-sm text-muted-foreground">{mentor.years} years</p>
              </div>
              <div className="flex flex-col space-y-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="#">Book a Call</a>
                </Button>
                <Button size="sm" asChild>
                  <a href="#">Request Mentorship</a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 6 – Success Stories */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Success Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {successStories.map((story) => (
            <Card key={story.id} className="p-4 flex items-start space-x-4">
              <img src={story.photo} alt={story.title} className="w-24 h-24 rounded-md object-cover" />
              <div>
                <h3 className="font-medium">{story.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{story.description}</p>
                <Button variant="link" size="sm" className="mt-2" asChild>
                  <a href="#">Read More →</a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 7 – Leaderboard */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Leaderboard</h2>
        <div className="space-y-2">
          {mockLeaderboard.map((member) => (
            <Card key={member.rank} className="flex items-center p-3 space-x-4">
              <span className="w-6 text-center font-medium">{member.rank}</span>
              <Avatar>
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>{member.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{member.name}</p>
                {member.badge && <Badge variant="pro">{member.badge}</Badge>}
              </div>
              <span className="font-medium">{member.points} pts</span>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 8 – Accountability Groups */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Accountability Groups</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["30-Day Challenge Group", "Book Reading Circle", "Marketing Accountability", "Weekly Practice Group"].map((group) => (
            <Card key={group} className="p-4 flex items-center justify-between">
              <span>{group}</span>
              <Button variant="outline" size="sm">Join</Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 9 – Community Resources */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Community Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["Proposal Templates", "Activity PDFs", "Marketing Templates", "Icebreakers", "Games", "Canva Templates"].map((res) => (
            <Card key={res} className="p-4 flex items-center justify-between">
              <span>{res}</span>
              <Button variant="outline" size="sm" asChild>
                <a href="#">Download</a>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 10 – Referral Program */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Referral Program</h2>
        <Card className="p-6 space-y-4 max-w-md mx-auto">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Referral Code</label>
            <Input value="FSP-REF-2026" readOnly />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Referral Link</label>
            <div className="flex space-x-2">
              <Input value="https://fspcommunity.com/ref/FSP-REF-2026" readOnly />
              <Button variant="outline" size="sm">Copy Link</Button>
            </div>
          </div>
          <p className="text-sm">Members Referred: <span className="font-medium">12</span></p>
          <p className="text-sm">Rewards Earned: <span className="font-medium">₹1,200</span></p>
        </Card>
      </section>

      {/* Section 11 – Community Calendar */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Community Calendar</h2>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">[Calendar integration placeholder]</p>
        </Card>
      </section>

      {/* Section 12 – Recognition Wall */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Recognition Wall</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "Member of the Month", desc: "Anand – Outstanding facilitation leadership" },
            { title: "Challenge Champion", desc: "Priya – 30‑Day Challenge completed" },
            { title: "Top Mentor", desc: "Raja – 150 mentee sessions" },
            { title: "Most Helpful Member", desc: "Sneha – 200 upvotes on answers" },
            { title: "Fastest Growing Trainer", desc: "Kumar – 3‑month 400% activity boost" },
          ].map((item) => (
            <Card key={item.title} className="p-4">
              <h3 className="font-medium mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 13 – Quick Actions */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[
            { label: "Create Post", Icon: Pen },
            { label: "Find Members", Icon: Search },
            { label: "Join Group", Icon: Users },
            { label: "Ask Question", Icon: HelpCircle },
            { label: "Share Resource", Icon: Upload },
            { label: "Invite Friend", Icon: UserPlus },
          ].map((action) => (
            <Card key={action.label} className="p-6 flex flex-col items-center hover:shadow-lg transition-shadow text-center">
              <action.Icon className="w-8 h-8 mb-2 text-primary" />
              <span className="font-medium">{action.label}</span>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 14 – Empty State */}
      <section className="text-center py-12">
        <p className="text-xl mb-4">Welcome to the FSP Community.</p>
        <p className="text-muted-foreground mb-6">Be the first to start a conversation.</p>
        <Button size="lg" asChild>
          <a href="#">Create First Post</a>
        </Button>
      </section>
    </main>
  );
}
