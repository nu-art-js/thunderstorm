/**
 * Created by tacb0ss on 27/07/2018.
 */

import {Module} from "nu-art--react-core";

class FontsModule
  extends Module {

  init() {
    this.fontTypes = this.config.fonts;
    this.fontList = {};
    this.fontTypes.forEach(fontType => this.fontList[fontType.name] = fontType);
  }

  getFonts() {
    return this.fontTypes;
  }

  getDefaultFont() {
    return this.fontList[this.config.defaultFont];
  }

  getFontUrl(fontName) {
    return this.fontList[fontName].url
  }
}

export default new FontsModule();
