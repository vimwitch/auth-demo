import { createContext } from 'react'
import { makeAutoObservable } from 'mobx'

const MAX_MOBILE_WIDTH = 780

export default class Interface {
  // dark/light mode
  // interface viewport size
  darkmode = false
  modeCssClass = ''
  screenWidth = -1
  screenHeight = -1
  isMobile = false
  useSmallField = true

  constructor() {
    makeAutoObservable(this)
    if (typeof window !== 'undefined') {
      this.load()
    }
  }

  // must be called in browser, not in SSR
  load() {
    this.updateWindowSize()
    window.addEventListener('resize', this.updateWindowSize.bind(this))
    this.setDarkmode(!!localStorage.getItem('darkmode'))
    document.cookie = `darkmode=${this.darkmode.toString()}`
  }

  fieldElement(v) {
    if (!this.useSmallField) return v.toString()
    return (BigInt(v) % 19997n).toString()
  }

  updateWindowSize() {
    // possibly throttle on heavy sites
    this.screenWidth = window.innerWidth
    this.screenHeight = window.innerHeight
    this.isMobile = this.screenWidth <= MAX_MOBILE_WIDTH
  }

  setDarkmode(enabled) {
    this.darkmode = enabled
    if (enabled) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('darkmode', 'true')
        document.cookie = `darkmode=${this.darkmode.toString()}`
      }
      this.modeCssClass = 'dark'
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('darkmode')
        document.cookie = `darkmode=${this.darkmode.toString()}`
      }
      this.modeCssClass = ''
    }
  }
}
