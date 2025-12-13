import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock, Tag, ChevronRight, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SEOHead, BreadcrumbData } from "@/components/seo/SEOHead";
import { blogPosts, blogCategories, getFeaturedPosts, getRecentPosts } from "@/lib/blogData";
import conclusivLogo from "@/assets/conclusiv-logo.png";
import { format } from "date-fns";

const Blog = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const featuredPosts = getFeaturedPosts();
  const recentPosts = getRecentPosts(10);

  // Filter posts
  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = searchQuery === "" || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <SEOHead
        title="Blog - AI Pitch Decks, Startup Tips & Business Strategy"
        description="Expert insights on creating pitch decks, AI presentation tools, startup strategy, and fundraising. Learn how to transform your ideas into compelling investor narratives."
        keywords="pitch deck blog, startup tips, AI presentation maker, business strategy, fundraising advice, investor pitch tips, startup blog"
      />
      <BreadcrumbData items={[
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blog' },
      ]} />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/30 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
            <img 
              src={conclusivLogo} 
              alt="Conclusiv" 
              className="h-5 w-auto cursor-pointer"
              onClick={() => navigate('/')}
            />
            <Button variant="shimmer" size="sm" onClick={() => navigate('/')}>
              Try Free
            </Button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8 md:py-16">
          {/* Hero */}
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-bold mb-4"
            >
              The Conclusiv Blog
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Expert insights on pitch decks, AI tools, startup strategy, and building compelling business narratives.
            </motion.p>
          </div>

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {blogCategories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Featured Posts */}
          {!searchQuery && !selectedCategory && featuredPosts.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-16"
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Featured Articles
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {featuredPosts.slice(0, 2).map((post, index) => (
                  <Link
                    key={post.slug}
                    to={`/blog/${post.slug}`}
                    className="group"
                  >
                    <motion.article
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="h-full p-6 rounded-2xl border border-border/50 bg-card/30 hover:bg-card/60 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Featured
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {blogCategories.find(c => c.id === post.category)?.name}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(post.publishedAt), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {post.readingTime} min read
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.article>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          {/* All Posts */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {selectedCategory 
                ? blogCategories.find(c => c.id === selectedCategory)?.name 
                : searchQuery 
                  ? 'Search Results' 
                  : 'All Articles'
              }
              <span className="text-sm font-normal text-muted-foreground">
                ({filteredPosts.length})
              </span>
            </h2>

            {filteredPosts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No articles found matching your criteria.</p>
                <Button 
                  variant="link" 
                  onClick={() => { setSearchQuery(""); setSelectedCategory(null); }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post, index) => (
                  <Link
                    key={post.slug}
                    to={`/blog/${post.slug}`}
                    className="group block"
                  >
                    <motion.article
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="p-4 md:p-6 rounded-xl border border-border/50 bg-card/20 hover:bg-card/50 hover:border-primary/20 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-muted-foreground capitalize bg-muted/50 px-2 py-0.5 rounded">
                              {blogCategories.find(c => c.id === post.category)?.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(post.publishedAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                            {post.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {post.excerpt}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground md:shrink-0">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {post.readingTime} min
                          </span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {post.tags.slice(0, 4).map(tag => (
                          <span 
                            key={tag}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </motion.article>
                  </Link>
                ))}
              </div>
            )}
          </motion.section>

          {/* Newsletter CTA */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16 text-center p-8 rounded-2xl bg-primary/5 border border-primary/20"
          >
            <h2 className="text-2xl font-semibold mb-2">Ready to create your pitch?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Transform your research into a compelling investor narrative in under 60 seconds.
            </p>
            <Button variant="shimmer" size="lg" onClick={() => navigate('/')}>
              Try Conclusiv Free
            </Button>
          </motion.section>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/30 py-8 mt-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <img src={conclusivLogo} alt="Conclusiv" className="h-4 w-auto opacity-60" />
              <div className="flex gap-6 text-sm text-muted-foreground">
                <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
                <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
              </div>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Conclusiv
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Blog;
