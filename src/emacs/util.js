"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const monaco = require("monaco-editor");
exports.modifierKeys = {
    Alt: 'M',
    Control: 'C',
    Ctrl: 'C',
    Meta: 'CMD',
    Shift: 'S',
};
const specialKeys = {
    Enter: 'Return',
    Space: 'SPC',
    BACKSLASH: '\\',
    SLASH: '/',
    BACKTICK: '`',
    CLOSE_SQUARE_BRACKET: ']',
    OPEN_SQUARE_BRACKET: '[',
    COMMA: ',',
    DOT: '.',
    EQUAL: '=',
    MINUS: '-',
    QUOTE: ',',
    SEMICOLON: ';',
};
function monacoToEmacsKey(ev) {
    const keyName = monaco.KeyCode[ev.keyCode];
    if (exports.modifierKeys[keyName]) {
        // return modifierKeys[keyName];
        return '';
    }
    let key = ((keyName.startsWith('KEY_') || keyName.startsWith('NUMPAD_')) ? keyName[keyName.length - 1] : keyName);
    if (keyName.endsWith('Arrow')) {
        key = keyName.substr(0, keyName.length - 5);
    }
    else if (keyName.startsWith('US_')) {
        key = specialKeys[keyName.substr(3)];
    }
    else if (specialKeys[keyName]) {
        key = specialKeys[key];
    }
    if (key.length === 1) {
        key = key.toLowerCase();
    }
    if (ev.altKey) {
        key = `${exports.modifierKeys.Alt}-${key}`;
    }
    if (ev.ctrlKey) {
        key = `${exports.modifierKeys.Ctrl}-${key}`;
    }
    if (ev.metaKey) {
        key = `${exports.modifierKeys.Meta}-${key}`;
    }
    if (ev.shiftKey) {
        key = `${exports.modifierKeys.Shift}-${key}`;
    }
    return key;
}
exports.monacoToEmacsKey = monacoToEmacsKey;
