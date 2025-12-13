import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Calendar, Tag, ChevronRight, Share2, Twitter, Linkedin, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SEOHead, ArticleData, BreadcrumbData } from "@/components/seo/SEOHead";
import { getPostBySlug, getRelatedPosts, blogCategories } from "@/lib/blogData";
import conclusivLogo from "@/assets/conclusiv-logo.png";
import { format } from "date-fns";
import { useState } from "react";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  const post = slug ? getPostBySlug(slug) : undefined;
  const relatedPosts = slug ? getRelatedPosts(slug, 3) : [];

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/blog')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  const shareUrl = `https://conclusiv.ai/blog/${post.slug}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  // Simple markdown-ish rendering (for basic formatting)
  const renderContent = (content: string) => {
    const lines = content.trim().split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let inList = false;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-2 my-4 text-muted-foreground">
            {currentList.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );
        currentList = [];
      }
      inList = false;
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      if (!trimmed) {
        flushList();
        return;
      }

      // Headers
      if (trimmed.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={index} className="text-3xl md:text-4xl font-bold mt-8 mb-4">
            {trimmed.slice(2)}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={index} className="text-2xl font-semibold mt-8 mb-3">
            {trimmed.slice(3)}
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={index} className="text-xl font-semibold mt-6 mb-2">
            {trimmed.slice(4)}
          </h3>
        );
      }
      // List items
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        inList = true;
        currentList.push(trimmed.slice(2));
      }
      // Numbered list
      else if (/^\d+\.\s/.test(trimmed)) {
        if (!inList) {
          inList = true;
        }
        currentList.push(trimmed.replace(/^\d+\.\s/, ''));
      }
      // Bold text handling
      else {
        flushList();
        // Replace **text** with bold
        const processed = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        elements.push(
          <p 
            key={index} 
            className="text-muted-foreground leading-relaxed my-4"
            dangerouslySetInnerHTML={{ __html: processed }}
          />
        );
      }
    });

    flushList();
    return elements;
  };

  const categoryName = blogCategories.find(c => c.id === post.category)?.name || post.category;

  return (
    <>
      <SEOHead
        title={post.title}
        description={post.metaDescription}
        keywords={post.metaKeywords}
        type="article"
        publishedTime={post.publishedAt}
        modifiedTime={post.updatedAt}
        author={post.author}
        section={categoryName}
      />
      <ArticleData
        headline={post.title}
        description={post.metaDescription}
        image="https://conclusiv.ai/og-image.png"
        datePublished={post.publishedAt}
        dateModified={post.updatedAt}
        author={post.author}
      />
      <BreadcrumbData items={[
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blog' },
        { name: post.title, url: `/blog/${post.slug}` },
      ]} />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/30 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/blog')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Blog
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

        <main className="max-w-4xl mx-auto px-4 py-8 md:py-16">
          {/* Article Header */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Link 
                to={`/blog?category=${post.category}`}
                className="text-sm text-primary bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition-colors"
              >
                {categoryName}
              </Link>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {post.title}
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6">
              {post.excerpt}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-6 border-b border-border/30">
              <span className="font-medium text-foreground">{post.author}</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.readingTime} min read
              </span>
            </div>
          </motion.header>

          {/* Share Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-8"
          >
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Share2 className="w-4 h-4" />
              Share:
            </span>
            <Button variant="outline" size="sm" onClick={handleShareTwitter}>
              <Twitter className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleShareLinkedIn}>
              <Linkedin className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </motion.div>

          {/* Article Content */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="prose prose-invert max-w-none"
          >
            {renderContent(post.content)}
          </motion.article>

          {/* Tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 pt-8 border-t border-border/30"
          >
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <Link
                  key={tag}
                  to={`/blog?search=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground bg-muted/30 hover:bg-muted/50 px-3 py-1.5 rounded-full transition-colors"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </Link>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 p-8 rounded-2xl bg-primary/5 border border-primary/20 text-center"
          >
            <h2 className="text-2xl font-semibold mb-2">Ready to create your pitch?</h2>
            <p className="text-muted-foreground mb-6">
              Transform your research into a compelling narrative in under 60 seconds.
            </p>
            <Button variant="shimmer" size="lg" onClick={() => navigate('/')}>
              Try Conclusiv Free
            </Button>
          </motion.div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-16"
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Related Articles
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {relatedPosts.map((related, index) => (
                  <Link
                    key={related.slug}
                    to={`/blog/${related.slug}`}
                    className="group"
                  >
                    <motion.article
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="h-full p-4 rounded-xl border border-border/50 bg-card/20 hover:bg-card/50 hover:border-primary/20 transition-all"
                    >
                      <span className="text-xs text-muted-foreground capitalize">
                        {blogCategories.find(c => c.id === related.category)?.name}
                      </span>
                      <h3 className="font-medium mt-1 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {related.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{related.readingTime} min read</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.article>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border/30 py-8 mt-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <img src={conclusivLogo} alt="Conclusiv" className="h-4 w-auto opacity-60" />
              <div className="flex gap-6 text-sm text-muted-foreground">
                <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
                <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
                <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
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

export default BlogPost;
