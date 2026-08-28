/**
 * Search Normalizer Utility
 * 
 * Provides robust normalization and fuzzy matching for math expressions
 * (KaTeX/LaTeX format, e.g. $\frac{x}{y}$, \frac{2y}{x}, $$a + b = 12$$, a^2 - b^2, \sqrt{x}, etc.),
 * Bengali & English numbers, symbols, spaces, and text.
 * 
 * Egress-friendly & ultra-fast for client and server side matching.
 */

const BN_TO_EN_DIGIT_MAP: Record<string, string> = {
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9"
};

const EN_TO_BN_DIGIT_MAP: Record<string, string> = {
  "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
  "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯"
};

// Superscript & Subscript Unicode mappings to standard math notation
const SUPERSCRIPT_MAP: Record<string, string> = {
  "⁰": "^0", "¹": "^1", "²": "^2", "³": "^3", "⁴": "^4",
  "⁵": "^5", "⁶": "^6", "⁷": "^7", "⁸": "^8", "⁹": "^9",
  "⁺": "^+", "⁻": "^-", "⁼": "^=", "⁽": "^(", "⁾": "^)",
  "ⁿ": "^n", "ⁱ": "^i"
};

const SUBSCRIPT_MAP: Record<string, string> = {
  "₀": "_0", "₁": "_1", "₂": "_2", "₃": "_3", "₄": "_4",
  "₅": "_5", "₆": "_6", "₇": "_7", "₈": "_8", "₉": "_9",
  "₊": "_+", "₋": "_-", "₌": "_=", "₍": "_(", "₎": "_)"
};

/**
 * Strips KaTeX / LaTeX formatting, symbols, brackets, and math macros
 * converting math expressions into clean readable text for search.
 */
export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) return "";
  let clean = String(text);

  // 1. Remove LaTeX enclosing wrappers: $$, $, \(, \), \[, \], \begin{...}, \end{...}
  clean = clean.replace(/\$\$/g, " ");
  clean = clean.replace(/\$/g, " ");
  clean = clean.replace(/\\\(|\\\)|\\\[|\\\]/g, " ");
  clean = clean.replace(/\\begin\{[^}]*\}|\\end\{[^}]*\}/gi, " ");

  // 2. Extract content from LaTeX text/format wrappers: \text{...}, \mathrm{...}, \mathbf{...}, \textbf{...}, \mathit{...}
  clean = clean.replace(/\\(?:text|mathrm|mathbf|mathit|bm|textbf|textit|underline|sf|rm|tt)\s*\{([^}]*)\}/gi, " $1 ");
  clean = clean.replace(/\\(?:displaystyle|textstyle|limits|nolimits)/gi, " ");

  // 3. Normalize LaTeX fractions with flexible spacing:
  // e.g. \frac{x}{y} -> x/y, \frac { 2y } { x } -> 2y/x, \dfrac{a}{b} -> a/b, \tfrac{a}{b} -> a/b
  clean = clean.replace(/\\(?:frac|dfrac|tfrac)\s*\{\s*([^}]*?)\s*\}\s*\{\s*([^}]*?)\s*\}/gi, " $1/$2 ");
  // Also handle \frac without braces e.g. \frac 1 2 -> 1/2 or \frac 2y x -> 2y/x
  clean = clean.replace(/\\(?:frac|dfrac|tfrac)\s+([a-zA-Z0-9]+)\s+([a-zA-Z0-9]+)/gi, " $1/$2 ");

  // 4. Normalize exponents and superscripts: e.g. a^{2} -> a^2, x_{1} -> x_1
  clean = clean.replace(/\^\{\s*([^}]*?)\s*\}/g, "^$1");
  clean = clean.replace(/_\{s*([^}]*?)\s*\}/g, "_$1");

  // 5. Replace Unicode Superscripts and Subscripts
  for (const [sup, rep] of Object.entries(SUPERSCRIPT_MAP)) {
    clean = clean.replaceAll(sup, rep);
  }
  for (const [sub, rep] of Object.entries(SUBSCRIPT_MAP)) {
    clean = clean.replaceAll(sub, rep);
  }

  // 6. Normalize square roots: \sqrt[n]{x} -> sqrt(x), \sqrt{x} -> sqrt(x), √x -> sqrt(x)
  clean = clean.replace(/\\sqrt\[[^\]]*\]\s*\{\s*([^}]*?)\s*\}/gi, " sqrt($1) ");
  clean = clean.replace(/\\sqrt\s*\{\s*([^}]*?)\s*\}/gi, " sqrt($1) ");
  clean = clean.replace(/\\sqrt\b/gi, " sqrt ");
  clean = clean.replace(/√\s*([a-zA-Z0-9]+)/g, " sqrt($1) ");
  clean = clean.replace(/√/g, " sqrt ");

  // 7. Normalize common LaTeX math symbols and operators
  clean = clean.replace(/\\times\b|×/gi, "*");
  clean = clean.replace(/\\cdot\b|·|•/gi, ".");
  clean = clean.replace(/\\div\b|÷/gi, "/");
  clean = clean.replace(/\\pm\b|±/gi, "+-");
  clean = clean.replace(/\\mp\b|∓/gi, "-+");
  clean = clean.replace(/\\(?:le|leq)\b|≤/gi, "<=");
  clean = clean.replace(/\\(?:ge|geq)\b|≥/gi, ">=");
  clean = clean.replace(/\\(?:neq|ne)\b|≠/gi, "!=");
  clean = clean.replace(/\\approx\b|≈/gi, "~=");
  clean = clean.replace(/\\equiv\b|≡/gi, "==");
  clean = clean.replace(/\\infty\b|∞/gi, "infinity");
  clean = clean.replace(/\\(?:degree|circ)\b|°/gi, "deg");
  clean = clean.replace(/\\angle\b|∠/gi, "angle");
  clean = clean.replace(/\\pi\b|π/gi, "pi");
  clean = clean.replace(/\\theta\b|θ/gi, "theta");
  clean = clean.replace(/\\alpha\b|α/gi, "alpha");
  clean = clean.replace(/\\beta\b|β/gi, "beta");
  clean = clean.replace(/\\gamma\b|γ/gi, "gamma");
  clean = clean.replace(/\\Delta\b|Δ/gi, "delta");
  clean = clean.replace(/\\delta\b|δ/gi, "delta");
  clean = clean.replace(/\\lambda\b|λ/gi, "lambda");
  clean = clean.replace(/\\sigma\b|σ/gi, "sigma");
  clean = clean.replace(/\\sum\b|∑/gi, "sum");
  clean = clean.replace(/\\prod\b|∏/gi, "prod");
  clean = clean.replace(/\\int\b|∫/gi, "int");

  // 8. Remove formatting commands, spacings and brackets
  clean = clean.replace(/\\(?:left|right|quad|qquad|;|:|!)/gi, " ");
  clean = clean.replace(/\\over\b/gi, "/");

  // 9. Remove remaining LaTeX backslash commands (e.g. \over -> over, \sin -> sin)
  clean = clean.replace(/\\([a-zA-Z]+)/g, "$1");

  // 10. Remove remaining curly braces {} while keeping inner content
  clean = clean.replace(/[{}]/g, "");

  // 11. Normalize Unicode dashes & spaces
  clean = clean.replace(/[–—−]/g, "-");

  // 12. Add space around commas and operators for better token separation
  clean = clean.replace(/,/g, " , ");
  clean = clean.replace(/([0-9a-zA-Z\)])\s*এবং\s*([0-9a-zA-Z\(])/g, "$1 এবং $2");
  clean = clean.replace(/এবং([0-9a-zA-Z\(])/g, " এবং $1");
  clean = clean.replace(/([0-9a-zA-Z\)])এবং/g, "$1 এবং ");

  // 13. Convert Bengali digits to English digits for unified comparison
  clean = clean.replace(/[০-৯]/g, (digit) => BN_TO_EN_DIGIT_MAP[digit] || digit);

  // 14. Support common user typing of powers without caret: e.g. "x 2" or "y 2" -> "x^2" or "y^2"
  clean = clean.replace(/\b([a-zA-Z])\s+([0-9]+)\b/g, "$1^$2");

  // 15. Lowercase & collapse all extra spaces / newlines / tabs
  clean = clean.toLowerCase().replace(/\s+/g, " ").trim();

  return clean;
}

/**
 * Compact representation with all spaces and extraneous punctuation removed.
 * Useful for math matching like "a+b=12" vs "a + b = 12" or "a^2-b^2" vs "a^2 - b^2" or "x/y" vs "x / y".
 */
export function normalizeCompactMathText(text: string | null | undefined): string {
  const normalized = normalizeSearchText(text);
  // Keep english & bengali alphanumeric, plus core math operators: + - * / = ^ < > ! . ( ) % _
  return normalized.replace(/[^a-z0-9\u0980-\u09FF+\-*\/=^<>!%()_]/gi, "");
}

/**
 * Ultra-compact representation where even carets ^ are normalized so "x^2" and "x2" match.
 */
export function normalizeUltraCompactMath(text: string | null | undefined): string {
  const compact = normalizeCompactMathText(text);
  return compact.replace(/\^/g, "");
}

/**
 * Checks if a target string (e.g. a question or option)
 * matches a user's search query, handling LaTeX, spaces, case, and Bengali numerals.
 */
export function matchesMathOrTextQuery(
  targetText: string | null | undefined,
  searchQuery: string | null | undefined
): boolean {
  if (!searchQuery || !searchQuery.trim()) return true;
  if (!targetText) return false;

  const rawTarget = targetText.toLowerCase();
  const rawQuery = searchQuery.toLowerCase().trim();

  // 1. Direct raw substring match
  if (rawTarget.includes(rawQuery)) return true;

  // 2. Normalized LaTeX text match (spaces preserved)
  const normTarget = normalizeSearchText(targetText);
  const normQuery = normalizeSearchText(searchQuery);
  if (normTarget && normQuery && normTarget.includes(normQuery)) return true;

  // 3. Compact space-free / punctuation-free math match
  const compactTarget = normalizeCompactMathText(targetText);
  const compactQuery = normalizeCompactMathText(searchQuery);
  if (compactQuery.length >= 1 && compactTarget.includes(compactQuery)) {
    return true;
  }

  // 3b. Ultra-compact (handles caret differences like x 2 vs x^2)
  const ultraTarget = normalizeUltraCompactMath(targetText);
  const ultraQuery = normalizeUltraCompactMath(searchQuery);
  if (ultraQuery.length >= 2 && ultraTarget.includes(ultraQuery)) {
    return true;
  }

  // 4. Token-based match: Every word/symbol in the query must match something in the target
  const queryTokens = normQuery.split(/\s+/).filter((tok) => tok.length > 0 && tok !== ",");
  if (queryTokens.length > 1) {
    let matchedCount = 0;
    for (const tok of queryTokens) {
      if (normTarget.includes(tok)) {
        matchedCount++;
        continue;
      }
      const compactTok = normalizeCompactMathText(tok);
      if (compactTok && compactTarget.includes(compactTok)) {
        matchedCount++;
        continue;
      }
      const ultraTok = normalizeUltraCompactMath(tok);
      if (ultraTok && ultraTarget.includes(ultraTok)) {
        matchedCount++;
        continue;
      }
    }
    // If all tokens match or > 75% of meaningful tokens match
    if (matchedCount === queryTokens.length || (queryTokens.length >= 3 && matchedCount >= queryTokens.length - 1)) {
      return true;
    }
  }

  // 5. Bengali & English number equivalence (e.g. searching "১২" or "12")
  const targetWithBnDigits = normTarget.replace(/[0-9]/g, (d) => EN_TO_BN_DIGIT_MAP[d] || d);
  if (targetWithBnDigits.includes(rawQuery)) return true;

  return false;
}

/**
 * Calculates search score for a question:
 * - Tier 1 (100 - 1000): Query matches QUESTION TEXT (Highest priority, appears at top)
 * - Tier 2 (20 - 99): Query matches OPTIONS (Lower priority, appears below question matches)
 * - Tier 3 (5 - 19): Query matches EXPLANATION or TOPIC
 * - 0: No match
 */
export function getQuestionSearchScore(
  questionObj: any,
  searchQuery: string | null | undefined
): number {
  if (!searchQuery || !searchQuery.trim()) return 100; // default visible when no query
  if (!questionObj) return 0;

  const qText = questionObj.question || questionObj.questionText || questionObj.title || "";
  const rawQuery = searchQuery.toLowerCase().trim();

  // 1. Check Question Text (Tier 1 Priority: 100 - 1000)
  if (qText) {
    const rawTarget = qText.toLowerCase();
    if (rawTarget.includes(rawQuery)) {
      return rawTarget.startsWith(rawQuery) ? 1000 : 900;
    }
    const normTarget = normalizeSearchText(qText);
    const normQuery = normalizeSearchText(searchQuery);
    if (normTarget.includes(normQuery)) {
      return 850;
    }
    const compactTarget = normalizeCompactMathText(qText);
    const compactQuery = normalizeCompactMathText(searchQuery);
    if (compactQuery.length >= 1 && compactTarget.includes(compactQuery)) {
      return 800;
    }
    const ultraTarget = normalizeUltraCompactMath(qText);
    const ultraQuery = normalizeUltraCompactMath(searchQuery);
    if (ultraQuery.length >= 2 && ultraTarget.includes(ultraQuery)) {
      return 750;
    }
    if (matchesMathOrTextQuery(qText, searchQuery)) {
      return 600;
    }
  }

  // 2. Check Options (Tier 2 Priority: 20 - 99)
  if (Array.isArray(questionObj.options)) {
    for (let i = 0; i < questionObj.options.length; i++) {
      const opt = String(questionObj.options[i] || "");
      if (opt && matchesMathOrTextQuery(opt, searchQuery)) {
        // Higher score if it matches the correct option
        const correctIdx = questionObj.correctIndex ?? questionObj.correctOptionIndex ?? 0;
        return i === correctIdx ? 70 : 40;
      }
    }
  }

  // 3. Check Explanation (Tier 3 Priority: 5 - 19)
  if (questionObj.explanation && matchesMathOrTextQuery(questionObj.explanation, searchQuery)) {
    return 15;
  }

  // 4. Check Topic / Subject
  const topic = questionObj.topic || "";
  if (topic && matchesMathOrTextQuery(topic, searchQuery)) {
    return 10;
  }

  return 0;
}

/**
 * Checks if question matches query (boolean).
 */
export function questionMatchesSearch(
  questionObj: any,
  searchQuery: string | null | undefined
): boolean {
  if (!searchQuery || !searchQuery.trim()) return true;
  return getQuestionSearchScore(questionObj, searchQuery) > 0;
}

/**
 * Filters and ranks questions:
 * 1. Removes questions that don't match (score === 0)
 * 2. Ranks matches so Question Text matches ALWAYS come FIRST at the top,
 *    followed by Option matches below them.
 */
export function filterAndRankQuestions<T = any>(
  questionsList: T[],
  searchQuery: string | null | undefined
): T[] {
  if (!Array.isArray(questionsList) || questionsList.length === 0) return [];
  if (!searchQuery || !searchQuery.trim()) return questionsList;

  const cleanQuery = searchQuery.trim();
  const scoredItems: { question: T; score: number }[] = [];

  for (const q of questionsList) {
    const score = getQuestionSearchScore(q, cleanQuery);
    if (score > 0) {
      scoredItems.push({ question: q, score });
    }
  }

  // Sort by score descending: High scores (Question text matches) FIRST, Options matches AFTER
  scoredItems.sort((a, b) => b.score - a.score);

  return scoredItems.map((item) => item.question);
}

