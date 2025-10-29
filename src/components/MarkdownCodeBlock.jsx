import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';

export const MarkdownCodeBlock = ({ node, inline, className, children, ...props }) => {
  const [hasCopied, setHasCopied] = useState(false);

  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text'; // 'text' como padrão se não houver linguagem

  const handleCopy = () => {
    const codeString = String(children).replace(/\n$/, ''); // Pega o texto do nó filho
    navigator.clipboard.writeText(codeString).then(() => {
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    });
  };

  // Se for código inline (ex: `variavel`), renderiza de forma simples
  if (inline) {
    return (
      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
        {children}
      </code>
    );
  }

  // Se for um bloco de código
  return (
    <div className="relative my-4 rounded-md bg-zinc-900 text-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
        <span className="text-xs text-zinc-400">{language}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-400 hover:bg-zinc-700 hover:text-white"
          onClick={handleCopy}
        >
          {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>

      <SyntaxHighlighter
        style={atomDark} // Você pode escolher outros temas
        language={language}
        PreTag="div"
        customStyle={{ 
          background: 'transparent', 
          margin: 0, 
          padding: '1rem',
          fontSize: '0.875rem' // Equivalente a text-sm
        }}
        codeTagProps={{
          style: {
            fontFamily: 'var(--font-mono)', // Usar sua fonte mono do Tailwind
          },
        }}
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
};