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
  clean = clean.replace(/\\(?:text|mathrm|mathbf|mathit|bm|textbf|textit|underline|sf|rm|tt)\s*\{([^}]*)\}/gi, "$1");
  clean = clean.replace(/\\(?:displaystyle|textstyle|limits|nolimits)/gi, " ");

  // 3. Normalize LaTeX fractions with flexible spacing:
  // e.g. \frac{x}{y} -> x/y, \frac { 2y } { x } -> 2y/x, \dfrac{a}{b} -> a/b, \tfrac{a}{b} -> a/b
  clean = clean.replace(/\\(?:frac|dfrac|tfrac)\s*\{\s*([^}]*?)\s*\}\s*\{\s*([^}]*?)\s*\}/gi, "$1/$2");
  // Also handle \frac without braces e.g. \frac 1 2 -> 1/2 or \frac 2y x -> 2y/x
  clean = clean.replace(/\\(?:frac|dfrac|tfrac)\s+([a-zA-Z0-9]+)\s+([a-zA-Z0-9]+)/gi, "$1/$2");

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
  clean = clean.replace(/\\sqrt\[[^\]]*\]\s*\{\s*([^}]*?)\s*\}/gi, "sqrt($1)");
  clean = clean.replace(/\\sqrt\s*\{\s*([^}]*?)\s*\}/gi, "sqrt($1)");
  clean = clean.replace(/\\sqrt\b/gi, "sqrt");
  clean = clean.replace(/√\s*([a-zA-Z0-9]+)/g, "sqrt($1)");
  clean = clean.replace(/√/g, "sqrt");

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
  clean = clean.replace(/\\(?:left|right|quad|qquad|,|;|:|!)/gi, " ");
  clean = clean.replace(/\\over\b/gi, "/");

  // 9. Remove remaining LaTeX backslash commands (e.g. \over -> over, \sin -> sin)
  clean = clean.replace(/\\([a-zA-Z]+)/g, "$1");

  // 10. Remove remaining curly braces {} while keeping inner content
  clean = clean.replace(/[{}]/g, "");

  // 11. Normalize Unicode dashes & spaces
  clean = clean.replace(/[–—−]/g, "-");

  // 12. Convert Bengali digits to English digits for unified comparison
  clean = clean.replace(/[০-৯]/g, (digit) => BN_TO_EN_DIGIT_MAP[digit] || digit);

  // 13. Lowercase & collapse all extra spaces / newlines / tabs
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
 * Checks if a target string (e.g. a database question, option, or explanation)
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

  // 4. Token-based match: Every word/symbol in the query must match something in the target
  // e.g. user searches "x/y এর সাথে কত যোগ করলে" -> tokens: ["x/y", "এর", "সাথে", "কত", "যোগ", "করলে"]
  const queryTokens = normQuery.split(/\s+/).filter((tok) => tok.length > 0);
  if (queryTokens.length > 1) {
    const allTokensMatch = queryTokens.every((tok) => {
      // Check normalized target token
      if (normTarget.includes(tok)) return true;
      // Check compact target token
      const compactTok = normalizeCompactMathText(tok);
      if (compactTok && compactTarget.includes(compactTok)) return true;
      return false;
    });
    if (allTokensMatch) return true;
  }

  // 5. Bengali & English number equivalence (e.g. searching "১২" or "12")
  const targetWithBnDigits = normTarget.replace(/[0-9]/g, (d) => EN_TO_BN_DIGIT_MAP[d] || d);
  if (targetWithBnDigits.includes(rawQuery)) return true;

  return false;
}

/**
 * Comprehensive question matcher that searches across question text, options, and explanation.
 */
export function questionMatchesSearch(
  questionObj: any,
  searchQuery: string | null | undefined
): boolean {
  if (!searchQuery || !searchQuery.trim()) return true;
  if (!questionObj) return false;

  const qText = questionObj.question || questionObj.questionText || questionObj.title || "";
  if (matchesMathOrTextQuery(qText, searchQuery)) return true;

  // Check options
  if (Array.isArray(questionObj.options)) {
    for (const opt of questionObj.options) {
      if (typeof opt === "string" && matchesMathOrTextQuery(opt, searchQuery)) {
        return true;
      }
    }
  }

  // Check explanation
  if (questionObj.explanation && matchesMathOrTextQuery(questionObj.explanation, searchQuery)) {
    return true;
  }

  // Check subject or topic
  const subj = questionObj.subject || questionObj.subjectName || "";
  if (matchesMathOrTextQuery(subj, searchQuery)) return true;

  const topic = questionObj.topic || "";
  if (matchesMathOrTextQuery(topic, searchQuery)) return true;

  return false;
}
