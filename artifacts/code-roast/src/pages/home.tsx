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
import { Flame, Share2, RotateCcw, Code2, Sparkles } from "lucide-react";
import html2canvas from "html2canvas";

// Smell rating colors and metadata
const smellRatings = {
  "Fresh Bread": {
    emoji: "🍞",
    color: "text-green-400 border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.4)]",
    bg: "bg-green-950/30",
  },
  "Slightly Burnt": {
    emoji: "🥖",
    color: "text-lime-400 border-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.4)]",
    bg: "bg-lime-950/30",
  },
  "Getting Toasty": {
    emoji: "🔥",
    color: "text-orange-400 border-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.4)]",
    bg: "bg-orange-950/30",
  },
  Spaghetti: {
    emoji: "🍝",
    color: "text-red-400 border-red-400 shadow-[0_0_20px_rgba(248,113,113,0.4)]",
    bg: "bg-red-950/30",
  },
  "Burnt Toast": {
    emoji: "🍞💀",
    color: "text-red-600 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]",
    bg: "bg-red-950/40",
  },
  "Radioactive Waste": {
    emoji: "☢️",
    color: "text-yellow-300 border-yellow-300 shadow-[0_0_30px_rgba(253,224,71,0.6)]",
    bg: "bg-yellow-950/30",
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
      setValidationError("Drop some code first, coward.");
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
        backgroundColor: "#0A0A0F",
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
        color: "text-primary border-primary",
        bg: "bg-primary/10",
      }
    : null;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center px-4 py-8 md:py-16">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <header className="text-center space-y-4 mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Flame className="w-10 h-10 text-primary animate-pulse" />
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
              Code Roast
            </h1>
            <Flame className="w-10 h-10 text-accent animate-pulse" />
          </div>
          <p className="text-lg md:text-xl text-muted-foreground font-mono uppercase tracking-wider">
            Can your code take the heat? Let's find out.
          </p>
        </header>

        {/* Input Section */}
        {!hasResult && (
          <div className="space-y-6">
            {/* Language Selector */}
            <div className="space-y-2">
              <label
                htmlFor="language-select"
                className="block text-sm font-mono font-bold uppercase tracking-wider text-primary"
              >
                Language
              </label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger
                  id="language-select"
                  data-testid="select-language"
                  className="w-full md:w-64"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JavaScript">JavaScript</SelectItem>
                  <SelectItem value="Python">Python</SelectItem>
                  <SelectItem value="Java">Java</SelectItem>
                  <SelectItem value="C++">C++</SelectItem>
                  <SelectItem value="TypeScript">TypeScript</SelectItem>
                  <SelectItem value="Rust">Rust</SelectItem>
                  <SelectItem value="Go">Go</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Code Input */}
            <div className="space-y-2">
              <label
                htmlFor="code-input"
                className="block text-sm font-mono font-bold uppercase tracking-wider text-primary"
              >
                Your Code
              </label>
              <Textarea
                id="code-input"
                data-testid="textarea-code"
                placeholder="// Paste your masterpiece here&#10;function example() {&#10;  return 'prepare to be roasted';&#10;}"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setValidationError("");
                }}
                className="min-h-[300px] text-base leading-relaxed"
              />
              {validationError && (
                <p className="text-destructive text-sm font-mono font-bold animate-pulse">
                  {validationError}
                </p>
              )}
            </div>

            {/* API Error */}
            {roastMutation.isError && (
              <div className="border-2 border-destructive bg-destructive/10 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-destructive" />
                  <h3 className="font-mono font-bold uppercase text-destructive">
                    Error
                  </h3>
                </div>
                <p className="text-sm font-mono text-foreground">
                  {(roastMutation.error as any)?.error ||
                    "Something went wrong. Try again."}
                </p>
              </div>
            )}

            {/* Roast Button */}
            <Button
              data-testid="button-roast"
              onClick={handleRoast}
              disabled={roastMutation.isPending}
              size="lg"
              className="w-full group relative overflow-hidden"
            >
              {roastMutation.isPending ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  Sniffing your code...
                </>
              ) : (
                <>
                  <Flame className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                  Roast My Code
                </>
              )}
            </Button>
          </div>
        )}

        {/* Result Section */}
        {hasResult && result && (
          <div className="space-y-6">
            <div
              ref={resultCardRef}
              data-testid="card-result"
              className="border-2 border-primary bg-card p-6 md:p-8 space-y-6 shadow-[0_0_40px_rgba(57,255,20,0.2)]"
            >
              {/* Roast */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-primary" />
                  <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-primary">
                    The Roast
                  </h2>
                </div>
                <div className="bg-muted/50 border-l-4 border-primary p-4">
                  <p
                    data-testid="text-roast"
                    className="text-base md:text-lg font-mono leading-relaxed text-foreground"
                  >
                    {result.roast}
                  </p>
                </div>
              </div>

              {/* Smell Rating */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-primary" />
                  <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-primary">
                    Smell Rating
                  </h2>
                </div>
                <div
                  data-testid="badge-smell-rating"
                  className={`inline-flex items-center gap-3 px-6 py-4 border-2 font-mono font-black text-xl md:text-2xl uppercase tracking-wider ${smellData?.color} ${smellData?.bg}`}
                >
                  <span className="text-3xl">{smellData?.emoji}</span>
                  <span>{result.smellRating}</span>
                </div>
              </div>

              {/* Improvement Tip */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-accent">
                    Improvement Tip
                  </h2>
                </div>
                <div className="bg-accent/10 border-l-4 border-accent p-4">
                  <p
                    data-testid="text-improvement"
                    className="text-sm md:text-base font-mono leading-relaxed text-foreground"
                  >
                    {result.improvementTip}
                  </p>
                </div>
              </div>

              {/* Encouragement */}
              <div className="pt-4 border-t border-border">
                <p
                  data-testid="text-encouragement"
                  className="text-sm md:text-base font-mono italic text-muted-foreground text-center"
                >
                  {result.encouragement}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                data-testid="button-roast-again"
                onClick={handleReset}
                variant="secondary"
                size="lg"
                className="flex-1"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Roast Again
              </Button>
              <Button
                data-testid="button-share"
                onClick={handleShare}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share Result
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-xs font-mono text-muted-foreground uppercase tracking-wider">
        <p>Built for devs who can take a joke</p>
      </footer>
    </div>
  );
}
