/**
 * Shared TinyMCE configuration
 *
 * Single source of truth for API key and editor settings.
 * Two presets:
 *   - `simpleEditorConfig`  — for event forms (details, agreements, refund policies)
 *   - `emailEditorConfig`   — for email template editing (taller, merge-field toolbar button)
 *
 * The env var is VITE_TINYMCE_API_KEY (set in Railway + local .env).
 */

import type { IAllProps } from "@tinymce/tinymce-react";

// ── API key ─────────────────────────────────────────────────────────
export const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY || "";

// ── Merge-field options used by the email editors ───────────────────
const MERGE_FIELDS = [
  { text: "Choose a field...", value: "" },
  { text: "First Name", value: "{{firstName}}" },
  { text: "Last Name", value: "{{lastName}}" },
  { text: "Username", value: "{{username}}" },
  { text: "Email", value: "{{email}}" },
  { text: "Event Name", value: "{{eventName}}" },
  { text: "Team Name", value: "{{teamName}}" },
  { text: "Division", value: "{{division}}" },
  { text: "Age Group", value: "{{ageGroup}}" },
  { text: "Reset URL", value: "{{resetUrl}}" },
  { text: "Reset Token", value: "{{token}}" },
  { text: "Event Admin Email", value: "{{EVENT_ADMIN_EMAIL}}" },
];

/**
 * Builds the merge-field dialog + toolbar button via editor.setup().
 * Extracted so it can be shared across email template editors.
 */
function addMergeFieldsButton(editor: any) {
  const openDialog = () => {
    const overlay = document.createElement("div");
    overlay.className = "tinymce-custom-dialog";
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;justify-content:center;align-items:center;";

    const card = document.createElement("div");
    card.style.cssText =
      "background:#fff;padding:20px;border-radius:8px;width:420px;max-width:90%;box-shadow:0 8px 24px rgba(0,0,0,.2);";

    const title = document.createElement("h3");
    title.textContent = "Insert Merge Field";
    title.style.cssText = "margin:0 0 14px;font-size:17px;";

    const select = document.createElement("select");
    select.style.cssText =
      "width:100%;padding:8px;margin-bottom:16px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;";

    MERGE_FIELDS.forEach((opt) => {
      const o = document.createElement("option");
      o.textContent = opt.text;
      o.value = opt.value;
      select.appendChild(o);
    });

    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex;justify-content:flex-end;gap:8px;";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText =
      "padding:8px 14px;background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;cursor:pointer;font-size:14px;";
    cancelBtn.onclick = () => document.body.removeChild(overlay);

    const insertBtn = document.createElement("button");
    insertBtn.textContent = "Insert Field";
    insertBtn.style.cssText =
      "padding:8px 14px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;";
    insertBtn.onclick = () => {
      if (select.value) editor.insertContent(select.value);
      document.body.removeChild(overlay);
    };

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(insertBtn);
    card.appendChild(title);
    card.appendChild(select);
    card.appendChild(btnRow);
    overlay.appendChild(card);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) document.body.removeChild(overlay);
    });

    document.body.appendChild(overlay);
  };

  editor.ui.registry.addButton("mergefields", {
    text: "Merge Fields",
    tooltip: "Insert merge field",
    onAction: openDialog,
  });
}

// ── Shared base settings (HTML-email-safe) ──────────────────────────
const BASE_INIT: Record<string, any> = {
  menubar: "file edit view insert format tools table help",
  plugins: [
    "advlist",
    "autolink",
    "lists",
    "link",
    "image",
    "charmap",
    "preview",
    "anchor",
    "searchreplace",
    "visualblocks",
    "code",
    "fullscreen",
    "insertdatetime",
    "media",
    "table",
    "help",
    "wordcount",
    "codesample",
    "emoticons",
  ],
  extended_valid_elements: "*[*]",
  valid_children: "+body[style]",
  valid_elements: "*[*]",
  schema: "html5" as const,
  entity_encoding: "raw" as const,
  verify_html: false,
  content_style:
    "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
};

// ── Simple editor (event forms) ─────────────────────────────────────
export const simpleEditorConfig: Record<string, any> = {
  ...BASE_INIT,
  height: 300,
  toolbar:
    "code | undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat",
};

// ── Email template editor ───────────────────────────────────────────
export const emailEditorConfig: Record<string, any> = {
  ...BASE_INIT,
  height: 600,
  codesample_languages: [
    { text: "HTML/XML", value: "markup" },
    { text: "JavaScript", value: "javascript" },
    { text: "CSS", value: "css" },
  ],
  toolbar1:
    "code fullscreen | undo redo | formatselect | bold italic backcolor forecolor | alignleft aligncenter alignright alignjustify",
  toolbar2:
    "bullist numlist outdent indent | link image media | codesample removeformat | mergefields | help",
  file_picker_callback(callback: any) {
    const url = prompt("Enter URL", "https://");
    if (url) callback(url);
  },
  setup: addMergeFieldsButton,
  indent: false,
  forced_root_block: "",
  force_br_newlines: false,
  force_p_newlines: false,
};

/**
 * Helper that builds an emailEditorConfig with a custom height.
 * Useful for the modal variant (500 px) vs the full-page variant (600 px).
 */
export function emailEditorConfigWithHeight(h: number): Record<string, any> {
  return { ...emailEditorConfig, height: h };
}
