"use client";

import { useEffect, type ChangeEvent, type ComponentType } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Markdown } from "tiptap-markdown";
import { Extension } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link2,
  Undo2,
  Redo2,
  Code2,
  Palette,
  Type,
  Eraser,
} from "lucide-react";
import clsx from "clsx";

type RichTextEditorProps = {
  id: string;
  label: string;
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  required?: boolean;
  description?: string;
  className?: string;
};

const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
});

function useMarkdownEditor(initialMarkdown: string, onChange: (markdown: string) => void, placeholder?: string) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: { keepMarks: true, keepAttributes: true },
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      TextStyle,
      Color,
      FontSize,
      Underline,
      Link.configure({
        autolink: true,
        openOnClick: false,
        linkOnPaste: true,
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Start writing your story…",
      }),
      Markdown,
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "tiptap prose prose-stone prose-sm max-w-none rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800 shadow-sm focus:outline-none min-h-[16rem] h-full overflow-auto",
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown?.getMarkdown?.();
      onChange(markdown ?? "");
    },
    autofocus: false,
    parseOptions: {
      preserveWhitespace: true,
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentMarkdown = editor.storage.markdown?.getMarkdown?.() ?? "";
    if (initialMarkdown === currentMarkdown) {
      return;
    }
    const setContent = editor.commands.setContent as unknown as (
      content: string,
      emitUpdate?: boolean,
      options?: { parseOptions?: { preserveWhitespace?: boolean }; format?: "markdown" | "html" },
    ) => boolean;
    setContent(initialMarkdown || "", false, {
      parseOptions: { preserveWhitespace: true },
      format: "markdown",
    });
  }, [editor, initialMarkdown]);

  return editor;
}

export default function RichTextEditor({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  description,
  className,
}: RichTextEditorProps) {
  const editor = useMarkdownEditor(value, onChange, placeholder);

  if (!editor) {
    return (
      <div className={clsx("flex w-full flex-col gap-2", className)}>
        <label className="text-sm font-medium text-stone-700" htmlFor={id}>
          {label}
          {required ? <span className="ml-1 text-red-600">*</span> : null}
        </label>
        <div className="h-48 animate-pulse rounded-xl border border-stone-300 bg-stone-100" />
      </div>
    );
  }

  const buttonBaseClasses =
    "inline-flex h-8 w-8 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-600 shadow hover:border-emerald-300 hover:text-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-50";

  const toolbarButton = (
    action: () => boolean | void,
    isActive: boolean,
    Icon: ComponentType<{ className?: string }>,
    ariaLabel: string,
    extraDisabled = false,
  ) => (
    <button
      type="button"
      onClick={() => {
        if (extraDisabled) return;
        editor.chain().focus();
        action();
      }}
      className={clsx(buttonBaseClasses, isActive && "border-emerald-500 bg-emerald-50 text-emerald-600")}
      aria-label={ariaLabel}
      disabled={extraDisabled}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  const currentStyle = editor.getAttributes("textStyle") as {
    color?: string;
    fontSize?: string;
  };

  const currentColor = currentStyle?.color ?? "#2d2d2d";
  const currentFontSize = currentStyle?.fontSize ?? "";

  function handleColorChange(event: ChangeEvent<HTMLInputElement>) {
    const nextColor = event.target.value;
    if (!editor) return;
    editor.chain().focus().setColor(nextColor).run();
  }

  function clearColor() {
    if (!editor) return;
    editor.chain().focus().unsetColor().run();
  }

  function setFontSize(size: string) {
    if (!editor) return;
    // @ts-expect-error TipTap augments commands at runtime via TextStyle extension
    editor.chain().focus().setTextStyle({ fontSize: size }).run();
    if (currentStyle?.color) {
      editor.chain().focus().setColor(currentStyle.color).run();
    }
  }

  function clearFontSize() {
    if (!editor) return;
    // @ts-expect-error TipTap augments commands at runtime via TextStyle extension
    editor.chain().focus().unsetTextStyle().run();
    if (currentStyle?.color) {
      editor.chain().focus().setColor(currentStyle.color).run();
    }
  }

  return (
    <div className={clsx("flex w-full flex-col gap-2", className)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-sm font-medium text-stone-700" htmlFor={id}>
          {label}
          {required ? <span className="ml-1 text-red-600">*</span> : null}
        </label>
        {description ? <p className="text-xs text-stone-500">{description}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-stone-300 bg-white/90 px-3 py-2 shadow-sm">
        {toolbarButton(() => editor.chain().focus().toggleBold().run(), editor.isActive("bold"), Bold, "Bold")}
        {toolbarButton(() => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"), Italic, "Italic")}
        {toolbarButton(
          () => editor.chain().focus().toggleUnderline().run(),
          editor.isActive("underline"),
          UnderlineIcon,
          "Underline",
        )}
        {toolbarButton(
          () => editor.chain().focus().toggleStrike().run(),
          editor.isActive("strike"),
          Strikethrough,
          "Strikethrough",
        )}
        {toolbarButton(
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          editor.isActive("heading", { level: 2 }),
          Heading2,
          "Heading level 2",
        )}
        {toolbarButton(() => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"), List, "Bullet list")}
        {toolbarButton(
          () => editor.chain().focus().toggleOrderedList().run(),
          editor.isActive("orderedList"),
          ListOrdered,
          "Numbered list",
        )}
        {toolbarButton(
          () => editor.chain().focus().toggleBlockquote().run(),
          editor.isActive("blockquote"),
          Quote,
          "Blockquote",
        )}
        {toolbarButton(() => editor.chain().focus().toggleCode().run(), editor.isActive("code"), Code2, "Inline code")}
        {toolbarButton(
          () => {
            if (editor.isActive("link")) {
              editor.chain().focus().unsetLink().run();
              return true;
            }
            const url = window.prompt("Enter URL", "https://");
            if (!url) return false;
            return editor.chain().focus().setLink({ href: url }).run();
          },
          editor.isActive("link"),
          Link2,
          editor.isActive("link") ? "Edit link" : "Insert link",
        )}
        <div className="ml-auto flex flex-wrap items-center gap-3 border-l border-stone-200 pl-3">
          <div className="flex gap-2">
            {toolbarButton(() => editor.chain().focus().undo().run(), false, Undo2, "Undo", !editor.can().undo())}
            {toolbarButton(() => editor.chain().focus().redo().run(), false, Redo2, "Redo", !editor.can().redo())}
          </div>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-stone-400" aria-hidden />
            <input
              type="color"
              value={currentColor}
              onChange={handleColorChange}
              className="h-8 w-10 cursor-pointer rounded border border-stone-200 bg-transparent p-0"
              aria-label="Text color"
            />
            <button
              type="button"
              onClick={clearColor}
              className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-stone-300 bg-white px-2 text-xs font-medium text-stone-600 shadow hover:border-emerald-300 hover:text-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              <Eraser className="h-3.5 w-3.5" aria-hidden />
              Reset
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-stone-400" aria-hidden />
            <select
              value={currentFontSize}
              onChange={(event) => {
                const value = event.target.value;
                if (value) {
                  setFontSize(value);
                } else {
                  clearFontSize();
                }
              }}
              className="h-8 rounded-md border border-stone-300 bg-white px-2 text-sm text-stone-600 shadow focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              aria-label="Text size"
            >
              <option value="">Default</option>
              <option value="0.9rem">Small</option>
              <option value="1rem">Normal</option>
              <option value="1.15rem">Large</option>
              <option value="1.3rem">Extra large</option>
            </select>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <EditorContent id={id} editor={editor} />
      </div>
    </div>
  );
}
