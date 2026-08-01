import { useState, useRef } from "react";
import { useRoastCode } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Flame, Share2, RotateCcw, Code2, Sparkles, Terminal, FileJson, ArrowRight } from "lucide-react";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "framer-motion";

const smellRatings = {
  "Fresh Bread": {
    emoji: "🍞",
    colors: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10",
    glow: "shadow-[0_0_40px_rgba(52,211,153,0.08)]",
    bg: "bg-emerald-400/5",
  },
  "Slightly Burnt": {
    emoji: "🥖",
    colors: "text-amber-400 border-amber-400/20 bg-amber-400/10",
    glow: "shadow-[0_0_40px_rgba(251,191,36,0.08)]",
    bg: "bg-amber-400/5",
  },
  "Getting Toasty": {
    emoji: "🔥",
    colors: "text-orange-400 border-orange-400/20 bg-orange-400/10",
    glow: "shadow-[0_0_40px_rgba(251,146,60,0.08)]",
    bg: "bg-orange-400/5",
  },
  Spaghetti: {
    emoji: "🍝",
    colors: "text-red-400 border-red-400/20 bg-red-400/10",
    glow: "shadow-[0_0_40px_rgba(248,113,113,0.08)]",
    bg: "bg-red-400/5",
  },
  "Burnt Toast": {
    emoji: "🍞💀",
    colors: "text-rose-500 border-rose-500/20 bg-rose-500/10",
    glow: "shadow-[0_0_40px_rgba(244,63,94,0.08)]",
    bg: "bg-rose-500/5",
  },
  "Radioactive Waste": {
    emoji: "☢️",
    colors: "text-fuchsia-400 border-fuchsia-400/20 bg-fuchsia-400/10",
    glow: "shadow-[0_0_40px_rgba(232,121,249,0.08)]",
    bg: "bg-fuchsia-400/5",
  },
};

export default function Home() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [validationError, setValidationError] = useState("");
  const resultCardRef = useRef<HTMLDivElement>(null);

  const roastMutation = useRoastCode();

  const handleRoast = () => {
    setValidationError("");

    if (!code.trim()) {
      setValidationError("Please provide a code snippet first.");
      return;
    }

    roastMutation.mutate({
      data: {
        code: code.trim(),
        language,
      },
    });
  };

  const handleReset = () => {
    setCode("");
    setValidationError("");
    roastMutation.reset();
  };

  const handleShare = async () => {
    if (!resultCardRef.current) return;

    try {
      const canvas = await html2canvas(resultCardRef.current, {
        backgroundColor: "#0D0E15",
        scale: 2,
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `code-roast-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error("Failed to capture screenshot:", error);
    }
  };

  const result = roastMutation.data;
  const hasResult = result && !roastMutation.isPending;
  const smellData = result
    ? smellRatings[result.smellRating as keyof typeof smellRatings] || {
        emoji: result.smellEmoji,
        colors: "text-primary border-primary/20 bg-primary/10",
        glow: "shadow-[0_0_40px_rgba(255,79,0,0.08)]",
      }
    : null;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center px-4 py-12 md:py-24 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-[-10%] left-[50%] translate-x-[-50%] w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none z-[-1]" />
      
      <div className="w-full max-w-3xl space-y-12 z-10">
        <header className="text-center space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center p-2 rounded-2xl bg-card border border-border/50 shadow-sm mb-2"
          >
            <div className="bg-primary/10 p-2 rounded-xl">
              <Terminal className="w-6 h-6 text-primary" />
            </div>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight"
          >
            Code Roast <span className="text-muted-foreground font-serif italic font-medium">&amp;</span> Smell Test
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto"
          >
            Submit your snippet for a brutally honest, AI-powered critique. 
            Because your code probably stinks.
          </motion.p>
        </header>

        <AnimatePresence mode="wait">
          {!hasResult ? (
            <motion.div
              key="input-section"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="rounded-2xl border border-border/50 bg-card shadow-2xl shadow-black/40 overflow-hidden backdrop-blur-xl">
                {/* Editor Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground">main.code</span>
                  </div>
                  <div className="w-24">
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger
                        id="language-select"
                        data-testid="select-language"
                        className="h-7 text-xs border-none bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 px-2 justify-end gap-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="JavaScript">JavaScript</SelectItem>
                        <SelectItem value="TypeScript">TypeScript</SelectItem>
                        <SelectItem value="Python">Python</SelectItem>
                        <SelectItem value="Java">Java</SelectItem>
                        <SelectItem value="C++">C++</SelectItem>
                        <SelectItem value="Rust">Rust</SelectItem>
                        <SelectItem value="Go">Go</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Editor Body */}
                <div className="relative group">
                  <Textarea
                    id="code-input"
                    data-testid="textarea-code"
                    placeholder="Paste your code here..."
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setValidationError("");
                    }}
                    className="min-h-[320px] resize-y rounded-none border-0 bg-transparent p-6 text-sm md:text-base font-mono leading-relaxed focus-visible:ring-0 text-foreground/90 placeholder:text-muted-foreground/30 selection:bg-primary/30"
                    spellCheck={false}
                  />
                </div>
              </div>

              {validationError && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-destructive text-sm font-medium px-2"
                >
                  {validationError}
                </motion.p>
              )}

              {roastMutation.isError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex gap-3 items-start"
                >
                  <Flame className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-destructive">
                      Analysis Failed
                    </h3>
                    <p className="text-sm text-destructive/80">
                      {(roastMutation.error as any)?.error || "Our roasting engine overheated. Try again."}
                    </p>
                  </div>
                </motion.div>
              )}

              <Button
                data-testid="button-roast"
                onClick={handleRoast}
                disabled={roastMutation.isPending}
                size="lg"
                className="w-full h-14 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-xl relative overflow-hidden group"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                
                {roastMutation.isPending ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5 animate-spin" />
                    <span>Analyzing code quality...</span>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <span>Roast My Code</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="result-section"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
              className="space-y-6"
            >
              <div
                ref={resultCardRef}
                data-testid="card-result"
                className={`relative rounded-2xl border border-border/50 bg-card overflow-hidden ${smellData?.glow}`}
              >
                <div className={`px-6 py-8 md:px-10 border-b border-border/50 ${smellData?.bg} flex flex-col items-center justify-center text-center space-y-4`}>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Smell Rating</p>
                    <div
                      data-testid="badge-smell-rating"
                      className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full border ${smellData?.colors} backdrop-blur-sm`}
                    >
                      <span className="text-2xl" role="img" aria-label={result?.smellRating}>{smellData?.emoji}</span>
                      <span className="font-bold tracking-wide">{result?.smellRating}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-10 space-y-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Flame className="w-4 h-4" />
                      <h2 className="text-xs font-semibold uppercase tracking-widest">The Verdict</h2>
                    </div>
                    <blockquote 
                      data-testid="text-roast"
                      className="text-xl md:text-2xl font-serif text-foreground leading-relaxed tracking-tight italic"
                    >
                      "{result?.roast}"
                    </blockquote>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Code2 className="w-4 h-4" />
                      <h2 className="text-xs font-semibold uppercase tracking-widest">How to Fix It</h2>
                    </div>
                    <div className="bg-muted/30 border border-border/50 rounded-xl p-5">
                      <p
                        data-testid="text-improvement"
                        className="text-sm md:text-base font-mono text-muted-foreground leading-relaxed"
                      >
                        {result?.improvementTip}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/50 text-center">
                    <p
                      data-testid="text-encouragement"
                      className="text-sm text-muted-foreground/80 italic"
                    >
                      {result?.encouragement}
                    </p>
                  </div>
                </div>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button
                  data-testid="button-roast-again"
                  onClick={handleReset}
                  variant="outline"
                  size="lg"
                  className="flex-1 h-12 rounded-xl"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Roast Another
                </Button>
                <Button
                  data-testid="button-share"
                  onClick={handleShare}
                  size="lg"
                  className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Result
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="mt-auto pt-16 pb-8 text-center text-sm text-muted-foreground">
        <p>Built for developers who can handle the truth.</p>
      </footer>
    </div>
  );
}
