import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const components: Components = {
  h1: (props) => <h3 className="mb-1.5 mt-3 text-base font-semibold text-slate-100 first:mt-0 light:text-slate-900" {...props} />,
  h2: (props) => <h3 className="mb-1.5 mt-3 text-sm font-semibold text-slate-100 first:mt-0 light:text-slate-900" {...props} />,
  h3: (props) => <h4 className="mb-1 mt-2.5 text-sm font-semibold text-slate-200 first:mt-0 light:text-slate-800" {...props} />,
  h4: (props) => <h4 className="mb-1 mt-2 text-sm font-semibold text-slate-300 first:mt-0 light:text-slate-700" {...props} />,
  p: (props) => <p className="mb-2 leading-relaxed last:mb-0" {...props} />,
  ul: (props) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0" {...props} />,
  ol: (props) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0" {...props} />,
  li: (props) => <li {...props} />,
  a: (props) => <a className="text-sky-400 hover:underline light:text-sky-700" target="_blank" rel="noreferrer" {...props} />,
  strong: (props) => <strong className="font-semibold text-slate-100 light:text-slate-900" {...props} />,
  em: (props) => <em className="text-slate-200 light:text-slate-800" {...props} />,
  blockquote: (props) => <blockquote className="my-2 border-l-2 border-slate-700 pl-3 text-slate-400 light:border-slate-300 light:text-slate-600" {...props} />,
  hr: () => <hr className="my-3 border-slate-800 light:border-slate-200" />,
  pre: (props) => <pre className="my-2 overflow-x-auto rounded-md bg-slate-950/60 p-3 text-xs leading-relaxed light:bg-slate-100" {...props} />,
  code: (props) => <code className="rounded bg-slate-800/80 px-1 py-0.5 font-mono text-[11px] text-fuchsia-300 light:bg-slate-200 light:text-fuchsia-700" {...props} />,
  input: (props) => <input disabled className="mr-1.5 accent-fuchsia-500" {...props} />,
  table: (props) => (
    <div className="my-2 overflow-x-auto">
      <table className="border-collapse text-xs" {...props} />
    </div>
  ),
  thead: (props) => <thead className="border-b border-slate-700 light:border-slate-300" {...props} />,
  th: (props) => <th className="px-2 py-1 text-left font-medium text-slate-300 light:text-slate-700" {...props} />,
  td: (props) => <td className="border-t border-slate-800 px-2 py-1 text-slate-300 light:border-slate-200 light:text-slate-700" {...props} />,
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-sm text-slate-300 light:text-slate-700">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
