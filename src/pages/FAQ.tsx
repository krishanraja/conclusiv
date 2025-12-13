import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, ArrowLeft, HelpCircle, Zap, Shield, CreditCard, FileText, Mic, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { SEOHead, StructuredData, BreadcrumbData } from "@/components/seo/SEOHead";
import conclusivLogo from "@/assets/conclusiv-logo.png";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

// Comprehensive FAQs optimized for search intent
const faqs: FAQItem[] = [
  // Getting Started - High-intent keywords
  {
    category: "Getting Started",
    question: "What is Conclusiv and how does it work?",
    answer: "Conclusiv is an AI-powered business plan and pitch deck generator. Simply paste your research, upload documents (PDF, Word, PowerPoint), or speak your ideas using voice input. Our AI analyzes your content, extracts key themes and claims, and generates a professional narrative presentation in under 60 seconds. You can then customize, present, and share your pitch deck with investors or stakeholders."
  },
  {
    category: "Getting Started",
    question: "How do I create a pitch deck with AI?",
    answer: "Creating an AI pitch deck with Conclusiv is simple: 1) Paste your research, market analysis, or business plan text into the input field, 2) Optionally add your company website to auto-import branding and colors, 3) Click 'Continue' to let our AI analyze and structure your content, 4) Review and customize the generated narrative, 5) Present live or export to PDF/PowerPoint. The entire process takes under 2 minutes."
  },
  {
    category: "Getting Started",
    question: "What types of documents can I upload?",
    answer: "Conclusiv supports PDF documents, Microsoft Word files (.docx), and PowerPoint presentations (.pptx) up to 20MB. Our AI extracts text from these documents and analyzes the content to generate your narrative. You can also paste text directly or use voice input to speak your ideas."
  },
  {
    category: "Getting Started",
    question: "Can I use voice to create my presentation?",
    answer: "Yes! Conclusiv features voice-first AI technology. Click the microphone button and speak your business idea, market analysis, or pitch points. Our AI transcribes your speech using advanced voice recognition, then structures and expands your ideas into a complete narrative presentation. This is perfect for brainstorming or capturing ideas on the go."
  },

  // Features - Product-focused keywords
  {
    category: "Features",
    question: "What narrative templates are available?",
    answer: "Conclusiv offers 8 professional narrative archetypes: Strategy Brief (for executive decision-making), Executive Decision Memo (board-level recommendations), Investor Pitch (fundraising and investment), Go-to-Market Plan (launch strategies), Problem Framing (opportunity analysis), Root Cause Analysis (diagnostic deep-dives), Workshop Outline (collaborative sessions), and Competitive Teardown (market positioning). Each template structures your content optimally for its purpose."
  },
  {
    category: "Features",
    question: "How does the AI Research Assistant work?",
    answer: "The Research Assistant helps you gather and synthesize information before building your presentation. Enter a company name or topic, and our AI conducts web research, analyzing multiple sources to find relevant market data, competitive insights, and industry trends. Results include summaries, key findings, and source citations. This is perfect for due diligence, competitive analysis, or market research."
  },
  {
    category: "Features",
    question: "Can I customize my brand colors and logo?",
    answer: "Absolutely! Enter your company website URL and Conclusiv automatically imports your logo, brand colors, and fonts using our brand detection technology. You can also manually upload a custom logo. Pro users get full branded exports without watermarks, including matching color schemes in PDF and PowerPoint exports."
  },
  {
    category: "Features",
    question: "What is the Narrative Quality Score?",
    answer: "The Narrative Quality Score is an AI-powered assessment of your presentation's effectiveness. It evaluates clarity, structure, persuasiveness, and completeness on a 0-100 scale. You'll receive specific recommendations to improve your narrative, such as adding supporting data, strengthening your call-to-action, or clarifying key claims. Higher scores typically correlate with more engaging presentations."
  },
  {
    category: "Features",
    question: "How do tensions and blind spots work?",
    answer: "Our AI analyzes your narrative for logical tensions (contradictions or inconsistencies) and blind spots (important topics you may have overlooked). These insights help you strengthen your argument before presenting to stakeholders. For example, the AI might flag that you claim rapid growth but haven't addressed scaling challenges, prompting you to add that context."
  },

  // Pricing & Plans
  {
    category: "Pricing",
    question: "Is Conclusiv free to use?",
    answer: "Yes! Conclusiv offers a free tier that includes your first unlimited narrative build, up to 5 sections per narrative, PDF export with watermark, and core AI features. This lets you fully experience the platform before deciding to upgrade. No credit card is required to start."
  },
  {
    category: "Pricing",
    question: "What does Conclusiv Pro include?",
    answer: "Conclusiv Pro ($19/month or $190/year) unlocks: Unlimited narrative builds, up to 12 sections per narrative, branded PDF and PowerPoint exports without watermarks, priority AI processing, advanced analytics, custom brand theming, deep research mode, and priority support. Pro is ideal for consultants, founders, and professionals who create presentations regularly."
  },
  {
    category: "Pricing",
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your Pro subscription at any time. Your access continues until the end of your current billing period. There are no cancellation fees or long-term commitments. You can manage your subscription from the settings menu or contact support for assistance."
  },

  // Security & Privacy
  {
    category: "Security",
    question: "Is my data secure with Conclusiv?",
    answer: "Security is our top priority. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We use Supabase for secure data storage with row-level security policies. Your documents and narratives are private by default and only shared when you explicitly create a share link. We never sell your data or use it to train AI models."
  },
  {
    category: "Security",
    question: "Who can see my presentations?",
    answer: "Your presentations are completely private by default. Only you can access them when logged in. If you choose to share, you can create a password-protected share link with an optional expiration date. You control exactly who sees your content and can revoke access at any time."
  },
  {
    category: "Security",
    question: "Do you store my uploaded documents?",
    answer: "Document text is extracted for AI processing but we don't permanently store your original uploaded files. The extracted content is used to generate your narrative and is associated with your account. You can delete your narratives and associated data at any time from your account settings."
  },

  // Export & Sharing
  {
    category: "Export & Sharing",
    question: "How do I export my presentation?",
    answer: "Click the 'Export' button in the preview screen to download your narrative. Free users get PDF export with a small Conclusiv watermark. Pro users can export to both PDF and PowerPoint (.pptx) with full branding and no watermarks. Exports include all sections, your brand colors, and a professional layout."
  },
  {
    category: "Export & Sharing",
    question: "Can I share my presentation with others?",
    answer: "Yes! Click 'Share' to generate a unique link. You can optionally add password protection for sensitive content. Recipients can view your interactive presentation in their browser without needing an account. For collaborating, they can leave comments and feedback directly on the shared presentation."
  },
  {
    category: "Export & Sharing",
    question: "Can I present directly from Conclusiv?",
    answer: "Absolutely! Click 'Present' to enter full-screen presentation mode. Navigate with arrow keys, swipe gestures (on mobile), or the on-screen controls. The presentation features smooth cinematic transitions, a minimap for navigation, and speaker notes (if you've added them). It works great for live pitches, whether in-person or on video calls."
  },

  // Use Cases - Long-tail SEO keywords
  {
    category: "Use Cases",
    question: "Can I use Conclusiv for investor pitches?",
    answer: "Conclusiv is perfect for investor pitches. Select the 'Investor Pitch' narrative template to structure your content for fundraising. The AI helps you articulate your problem, solution, market opportunity, business model, traction, and ask. Many founders use Conclusiv to prepare for seed rounds, Series A, and beyond."
  },
  {
    category: "Use Cases",
    question: "Is Conclusiv good for consultants?",
    answer: "Consultants love Conclusiv! Use it to rapidly transform client research and analysis into polished deliverables. The branded export feature lets you apply client branding, and the narrative templates cover everything from strategy briefs to competitive teardowns. Save hours on each engagement while delivering professional results."
  },
  {
    category: "Use Cases",
    question: "Can I create business plans with Conclusiv?",
    answer: "Yes! While Conclusiv specializes in narrative presentations, it's excellent for creating the pitch version of your business plan. Paste your full business plan text, and the AI will extract and structure the key elements into a compelling narrative. Many users create both a detailed written plan and a Conclusiv presentation for different audiences."
  },
  {
    category: "Use Cases",
    question: "How is Conclusiv different from PowerPoint or Canva?",
    answer: "Unlike traditional tools where you start with a blank slide, Conclusiv starts with your content and generates the entire presentation automatically. It's AI-native, meaning the structure, flow, and even design suggestions come from analyzing your specific content. This saves hours of work and ensures a logical, persuasive narrative flow that's often missing in manually-created decks."
  },

  // Technical
  {
    category: "Technical",
    question: "What AI technology powers Conclusiv?",
    answer: "Conclusiv uses state-of-the-art large language models (LLMs) including Google's Gemini for content analysis, theme extraction, and narrative generation. For voice transcription, we use OpenAI's Whisper. Our proprietary algorithms handle brand detection, quality scoring, and tension analysis. We continuously update our AI models to improve output quality."
  },
  {
    category: "Technical",
    question: "Does Conclusiv work on mobile devices?",
    answer: "Yes! Conclusiv is fully responsive and works on smartphones and tablets. You can create narratives using voice input on mobile, and the presentation mode is optimized for touch with swipe navigation. Export and sharing work seamlessly across all devices. It's perfect for preparing pitches on the go."
  },
  {
    category: "Technical",
    question: "What browsers are supported?",
    answer: "Conclusiv works on all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, we recommend using the latest version of Chrome or Safari. Voice input requires a browser that supports the Web Speech API (all major browsers do)."
  },

  // Support
  {
    category: "Support",
    question: "How do I get help or report an issue?",
    answer: "You can reach our support team through the Contact page, accessible from the settings menu. Describe your issue and we typically respond within 24 hours. For urgent matters, email us directly at support@conclusiv.ai. Pro users receive priority support with faster response times."
  },
  {
    category: "Support",
    question: "Can I request new features?",
    answer: "We love feature requests! Use the feedback option in the app to share your ideas. We review all suggestions and prioritize based on user demand. Many of our best features came from user feedback. Join our community to vote on upcoming features and participate in beta testing."
  },
];

// Get unique categories
const categories = [...new Set(faqs.map(faq => faq.category))];

// Category icons
const categoryIcons: Record<string, React.ReactNode> = {
  "Getting Started": <Zap className="w-4 h-4" />,
  "Features": <Sparkles className="w-4 h-4" />,
  "Pricing": <CreditCard className="w-4 h-4" />,
  "Security": <Shield className="w-4 h-4" />,
  "Export & Sharing": <Share2 className="w-4 h-4" />,
  "Use Cases": <FileText className="w-4 h-4" />,
  "Technical": <HelpCircle className="w-4 h-4" />,
  "Support": <Mic className="w-4 h-4" />,
};

const FAQ = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter FAQs based on search and category
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchQuery === "" || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  // Generate FAQ structured data for this page
  const faqStructuredData = {
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <SEOHead
        title="FAQ - Frequently Asked Questions"
        description="Find answers to common questions about Conclusiv AI pitch deck generator. Learn about features, pricing, security, and how to create AI-powered business presentations."
        keywords="Conclusiv FAQ, AI pitch deck help, business plan generator questions, how to use Conclusiv, Conclusiv pricing, AI presentation maker support"
      />
      <StructuredData data={faqStructuredData} />
      <BreadcrumbData items={[
        { name: 'Home', url: '/' },
        { name: 'FAQ', url: '/faq' },
      ]} />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/30 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <img 
              src={conclusivLogo} 
              alt="Conclusiv" 
              className="h-5 w-auto cursor-pointer"
              onClick={() => navigate('/')}
            />
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8 md:py-16">
          {/* Hero */}
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Frequently Asked Questions
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground max-w-2xl mx-auto"
            >
              Everything you need to know about creating AI-powered pitch decks and business presentations with Conclusiv.
            </motion.p>
          </div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </motion.div>

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="gap-1.5"
              >
                {categoryIcons[category]}
                {category}
              </Button>
            ))}
          </motion.div>

          {/* FAQ List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No questions found matching your search.</p>
                <Button 
                  variant="link" 
                  onClick={() => { setSearchQuery(""); setSelectedCategory(null); }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => {
                const globalIndex = faqs.indexOf(faq);
                const isExpanded = expandedItems.has(globalIndex);
                
                return (
                  <motion.div
                    key={globalIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border border-border/50 rounded-lg overflow-hidden bg-card/30 hover:bg-card/50 transition-colors"
                  >
                    <button
                      onClick={() => toggleExpand(globalIndex)}
                      className="w-full px-4 py-4 flex items-start justify-between text-left"
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {faq.category}
                          </span>
                        </div>
                        <h3 className="font-medium text-foreground">
                          {faq.question}
                        </h3>
                      </div>
                      <ChevronDown className={cn(
                        "w-5 h-5 text-muted-foreground transition-transform shrink-0 mt-1",
                        isExpanded && "rotate-180"
                      )} />
                    </button>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 text-muted-foreground text-sm leading-relaxed border-t border-border/30 pt-3">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16 text-center p-8 rounded-2xl bg-primary/5 border border-primary/20"
          >
            <h2 className="text-xl font-semibold mb-2">Still have questions?</h2>
            <p className="text-muted-foreground mb-4">
              Can't find what you're looking for? We're here to help.
            </p>
            <Button onClick={() => navigate('/contact')}>
              Contact Support
            </Button>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/30 py-8 mt-16">
          <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Conclusiv. All rights reserved.</p>
            <div className="flex justify-center gap-4 mt-4">
              <button onClick={() => navigate('/terms')} className="hover:text-foreground transition-colors">Terms</button>
              <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">Privacy</button>
              <button onClick={() => navigate('/contact')} className="hover:text-foreground transition-colors">Contact</button>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default FAQ;
