"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface MathRendererProps {
  content: string;
  className?: string;
}

/**
 * Pre-processes content to convert LaTeX style delimiters like \[...\] and \(...\)
 * to standard markdown math delimiters ($$...$$ and $...$) so remark-math parses them accurately.
 */
function preprocessMath(text: string): string {
  if (!text) return "";
  const mathProcessed = text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);

  // Ensure single line breaks are preserved as hard line breaks in Markdown
  return mathProcessed
    .replace(/\r\n/g, "\n")
    .replace(/(?<!\n)\n(?!\n)/g, "  \n");
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = "" }) => {
  const processedContent = preprocessMath(content);

  return (
    <div className={`markdown-math-content text-slate-800 leading-relaxed whitespace-pre-wrap break-words ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <span className="block my-1 leading-relaxed whitespace-pre-wrap break-words">{children}</span>,
          code: ({ children, className: codeClassName }) => (
            <code className={`bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-xs ${codeClassName || ""}`}>
              {children}
            </code>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MathRenderer;
