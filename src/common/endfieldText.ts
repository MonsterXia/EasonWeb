/** Official game emphasis tokens are presentation only. Keep the text inert;
 * never interpret upstream game descriptions as HTML. */
export function endfieldPlainText(value: string | null | undefined): string {
  return value?.replace(/<@[\w.]+>|<\/>/g, '') ?? ''
}
