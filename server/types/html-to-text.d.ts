declare module 'html-to-text' {
  export interface HtmlToTextOptions {
    wordwrap?: number | null;
    selectors?: Array<{
      selector: string;
      format?: string;
      options?: Record<string, any>;
    }>;
    [key: string]: any;
  }
  
  export function htmlToText(html: string, options?: HtmlToTextOptions): string;
}