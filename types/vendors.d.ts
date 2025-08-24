declare module 'jsbarcode' {
  const JsBarcode: any
  export default JsBarcode
}

declare module '@zxing/browser' {
  export const BrowserMultiFormatReader: any
  export type Result = any
}
