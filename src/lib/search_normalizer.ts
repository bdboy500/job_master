/**
 * Search Normalizer Utility
 * 
 * Provides robust normalization and fuzzy matching for math expressions
 * (KaTeX/LaTeX format, e.g. $$a + b = 12$$, a^2 - b^2, \frac{a}{b}, etc.),
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
  clean = clean.replace(/\\(?:text|mathrm|mathbf|mathit|bm|textbf|textit|underline|sf|rm|tt)\{([^}]*)\}/gi, "$1");

  // 3. Normalize LaTeX fractions: \frac{a}{b}, \dfrac{a}{b}, \tfrac{a}{b} -> a/b
  clean = clean.replace(/\\(?:frac|dfrac|tfrac)\{([^}]*)\}\{([^}]*)\}/gi, "$1/$2");

  // 4. Normalize square roots: \sqrt[n]{x} -> sqrt(x), \sqrt{x} -> sqrt(x)
  clean = clean.replace(/\\sqrt\[[^\]]*\]\{([^}]*)\}/gi, "sqrt($1)");
  clean = clean.replace(/\\sqrt\{([^}]*)\}/gi, "sqrt($1)");
  clean = clean.replace(/\\sqrt\b/gi, "sqrt");

  // 5. Normalize common LaTeX math symbols and operators
  clean = clean.replace(/\\times\b/gi, "x");
  clean = clean.replace(/\\cdot\b/gi, ".");
  clean = clean.replace(/\\div\b/gi, "/");
  clean = clean.replace(/\\pm\b/gi, "+-");
  clean = clean.replace(/\\mp\b/gi, "-+");
  clean = clean.replace(/\\(?:le|leq)\b/gi, "<=");
  clean = clean.replace(/\\(?:ge|geq)\b/gi, ">=");
  clean = clean.replace(/\\neq\b/gi, "!=");
  clean = clean.replace(/\\approx\b/gi, "~=");
  clean = clean.replace(/\\equiv\b/gi, "==");
  clean = clean.replace(/\\infty\b/gi, "infinity");
  clean = clean.replace(/\\degree\b/gi, "deg");
  clean = clean.replace(/\\circ\b/gi, "deg");
  clean = clean.replace(/\\angle\b/gi, "angle");
  clean = clean.replace(/\\pi\b/gi, "pi");
  clean = clean.replace(/\\theta\b/gi, "theta");
  clean = clean.replace(/\\alpha\b/gi, "alpha");
  clean = clean.replace(/\\beta\b/gi, "beta");
  clean = clean.replace(/\\gamma\b/gi, "gamma");
  clean = clean.replace(/\\Delta\b/gi, "delta");
  clean = clean.replace(/\\delta\b/gi, "delta");
  clean = clean.replace(/\\lambda\b/gi, "lambda");
  clean = clean.replace(/\\sigma\b/gi, "sigma");
  clean = clean.replace(/\\sum\b/gi, "sum");
  clean = clean.replace(/\\prod\b/gi, "prod");
  clean = clean.replace(/\\int\b/gi, "int");

  // 6. Remove remaining LaTeX command backslashes (e.g. \over -> over, \left, \right -> empty)
  clean = clean.replace(/\\(?:left|right)\b/gi, "");
  clean = clean.replace(/\\([a-zA-Z]+)/g, "$1");

  // 7. Remove remaining curly braces {} and brackets while keeping the inner content
  clean = clean.replace(/[{}]/g, "");

  // 8. Convert Bengali digits to English digits for unified comparison
  clean = clean.replace(/[০-৯]/g, (digit) => BN_TO_EN_DIGIT_MAP[digit] || digit);

  // 9. Lowercase & collapse all extra spaces / newlines / tabs
  clean = clean.toLowerCase().replace(/\s+/g, " ").trim();

  return clean;
}

/**
 * Compact representation with all spaces and extraneous punctuation removed.
 * Useful for math matching like "a+b=12" vs "a + b = 12" or "a^2-b^2" vs "a^2 - b^2".
 */
export function normalizeCompactMathText(text: string | null | undefined): string {
  const normalized = normalizeSearchText(text);
  // Keep english & bengali alphanumeric, plus core math operators: + - * / = ^ < > ! . ( ) %
  return normalized.replace(/[^a-z0-9\u0980-\u09FF+\-*\/=^<>!%()]/gi, "");
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
  if (normTarget.includes(normQuery)) return true;

  // 3. Compact space-free / punctuation-free math match
  const compactTarget = normalizeCompactMathText(targetText);
  const compactQuery = normalizeCompactMathText(searchQuery);
  if (compactQuery.length >= 2 && compactTarget.includes(compactQuery)) {
    return true;
  }

  // 4. Token-based match: Every word/symbol in the query must match something in the target
  const queryTokens = normQuery.split(" ").filter((tok) => tok.length > 0);
  if (queryTokens.length > 1 && queryTokens.every((tok) => normTarget.includes(tok))) {
    return true;
  }

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
