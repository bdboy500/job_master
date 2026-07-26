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
  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = "" }) => {
  const processedContent = preprocessMath(content);

  return (
    <div className={`markdown-math-content text-slate-800 leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <span className="inline-block my-0.5">{children}</span>,
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
