import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter,
  AlignRight, List, ListOrdered, Link2, Image, Heading1, Heading2,
  Heading3, Code, Quote, Undo, Redo
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const ToolbarButton = ({
  onClick, title, children
}: { onClick: () => void; title: string; children: React.ReactNode }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-foreground"
        title={title}
      >
        {children}
      </button>
    </TooltipTrigger>
    <TooltipContent>{title}</TooltipContent>
  </Tooltip>
);

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"rich" | "html">("rich");
  const [htmlValue, setHtmlValue] = useState(value || "");
  const isUpdatingRef = useRef(false);

  // Sync external value → editor on mount / when value prop changes externally
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
    setHtmlValue(value || "");
  }, [value]);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    handleInput();
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    isUpdatingRef.current = true;
    const html = editorRef.current.innerHTML;
    onChange(html);
    setHtmlValue(html);
    setTimeout(() => { isUpdatingRef.current = false; }, 0);
  };

  const handleHtmlChange = (raw: string) => {
    setHtmlValue(raw);
    onChange(raw);
    if (editorRef.current && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      editorRef.current.innerHTML = raw;
      setTimeout(() => { isUpdatingRef.current = false; }, 0);
    }
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) exec("createLink", url);
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) exec("insertImage", url);
  };

  const toolbarGroups = [
    [
      { icon: <Undo className="h-3.5 w-3.5" />, cmd: "undo", title: "Undo" },
      { icon: <Redo className="h-3.5 w-3.5" />, cmd: "redo", title: "Redo" },
    ],
    [
      { icon: <Heading1 className="h-3.5 w-3.5" />, cmd: "formatBlock", val: "h1", title: "Heading 1" },
      { icon: <Heading2 className="h-3.5 w-3.5" />, cmd: "formatBlock", val: "h2", title: "Heading 2" },
      { icon: <Heading3 className="h-3.5 w-3.5" />, cmd: "formatBlock", val: "h3", title: "Heading 3" },
    ],
    [
      { icon: <Bold className="h-3.5 w-3.5" />, cmd: "bold", title: "Bold" },
      { icon: <Italic className="h-3.5 w-3.5" />, cmd: "italic", title: "Italic" },
      { icon: <Underline className="h-3.5 w-3.5" />, cmd: "underline", title: "Underline" },
      { icon: <Strikethrough className="h-3.5 w-3.5" />, cmd: "strikeThrough", title: "Strikethrough" },
    ],
    [
      { icon: <AlignLeft className="h-3.5 w-3.5" />, cmd: "justifyLeft", title: "Align Left" },
      { icon: <AlignCenter className="h-3.5 w-3.5" />, cmd: "justifyCenter", title: "Center" },
      { icon: <AlignRight className="h-3.5 w-3.5" />, cmd: "justifyRight", title: "Align Right" },
    ],
    [
      { icon: <List className="h-3.5 w-3.5" />, cmd: "insertUnorderedList", title: "Bullet List" },
      { icon: <ListOrdered className="h-3.5 w-3.5" />, cmd: "insertOrderedList", title: "Numbered List" },
    ],
    [
      { icon: <Quote className="h-3.5 w-3.5" />, cmd: "formatBlock", val: "blockquote", title: "Quote" },
      { icon: <Code className="h-3.5 w-3.5" />, cmd: "formatBlock", val: "pre", title: "Code Block" },
    ],
  ];

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as "rich" | "html")}>
        <div className="flex items-center justify-between border-b bg-muted/30 px-2 py-1 gap-2 flex-wrap">
          {/* Toolbar (only in rich mode) */}
          {activeTab === "rich" && (
            <div className="flex items-center gap-0.5 flex-wrap">
              {toolbarGroups.map((group, gi) => (
                <div key={gi} className="flex items-center gap-0.5 mr-1.5">
                  {group.map((btn, bi) => (
                    <ToolbarButton key={bi} title={btn.title} onClick={() => exec(btn.cmd, btn.val)}>
                      {btn.icon}
                    </ToolbarButton>
                  ))}
                </div>
              ))}
              <div className="flex items-center gap-0.5">
                <ToolbarButton title="Insert Link" onClick={insertLink}>
                  <Link2 className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton title="Insert Image" onClick={insertImage}>
                  <Image className="h-3.5 w-3.5" />
                </ToolbarButton>
              </div>
            </div>
          )}
          {activeTab === "html" && <div className="text-xs text-muted-foreground px-1">Raw HTML Mode</div>}

          {/* Mode toggle */}
          <TabsList className="h-7 text-xs ml-auto shrink-0">
            <TabsTrigger value="rich" className="h-6 text-xs px-2">Rich Text</TabsTrigger>
            <TabsTrigger value="html" className="h-6 text-xs px-2">HTML</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="rich" className="m-0">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            className="min-h-[300px] max-h-[500px] overflow-y-auto p-4 text-sm text-foreground focus:outline-none
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2
              [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2
              [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-2
              [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-2
              [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
              [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded [&_pre]:font-mono [&_pre]:text-xs
              [&_a]:text-primary [&_a]:underline
              [&_img]:max-w-full [&_img]:rounded"
            data-placeholder={placeholder || "পেজ কন্টেন্ট লিখুন..."}
            style={{ outline: "none" }}
          />
        </TabsContent>

        <TabsContent value="html" className="m-0">
          <Textarea
            value={htmlValue}
            onChange={e => handleHtmlChange(e.target.value)}
            className="min-h-[300px] font-mono text-xs rounded-none border-0 resize-none focus-visible:ring-0"
            placeholder="<p>Raw HTML এখানে পেস্ট করুন...</p>"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
