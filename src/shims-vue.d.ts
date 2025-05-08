import type { Loader, Modal, CustomTable, CustomHeader } from './components'
declare module 'vue' {
  export interface GlobalComponents {
    Modal: typeof Modal
    CTable: typeof CustomTable
    Loader: typeof Loader
    CustomHeader: typeof CustomHeader
  }
}
declare module '*.vue' {
  import Vue from 'vue'

  export default Vue
}

