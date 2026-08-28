declare module "mammoth/mammoth.browser" {
  interface ConvertResult {
    value: string;
    messages: unknown[];
  }
  const mammoth: {
    convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<ConvertResult>;
    extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<ConvertResult>;
  };
  export default mammoth;
}
