declare module 'merchant-category-code' {
  interface MccEntry {
    mcc: string
    edited_description: string
    combined_description: string
    usda_description: string
    irs_description: string
    irs_reportable: string
    id: number
  }

  function mcc(code: string | number): MccEntry | undefined
  export = mcc
}
