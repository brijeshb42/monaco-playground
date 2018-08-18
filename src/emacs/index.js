"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const monaco = require("monaco-editor");
const throttle = require("lodash.throttle");
const commands_1 = require("./commands");
const util_1 = require("./util");
const actions_1 = require("./actions");
const basicInput_1 = require("./basicInput");
const prefixKeyMap = {
    'C-u': new actions_1.AddPrefixMap(),
};
const { TextEditorCursorBlinkingStyle, TextEditorCursorStyle, } = monaco.editor;
class EmacsExtension {
    constructor(editor) {
        this._subs = [];
        this._prefixKey = null;
        this._killRing = [];
        this._inSelectionMode = false;
        this._changeDisposable = null;
        this._inputBuffer = null;
        this._lastInputBuffer = null;
        this._prefixMap = false;
        this._prefixKeyMap = null;
        this._editor = editor;
        const config = editor.getConfiguration().viewInfo;
        this._intialCursorType = TextEditorCursorStyle[config.cursorStyle].toLowerCase();
        this._intialCursorBlinking = TextEditorCursorBlinkingStyle[config.cursorBlinking].toLowerCase();
        this._basicInputWidget = new basicInput_1.BasicInputWidget();
    }
    start() {
        if (this._subs.length) {
            return;
        }
        this.addListeners();
        this._editor.updateOptions({
            cursorStyle: TextEditorCursorStyle[TextEditorCursorStyle.Block].toLowerCase(),
            cursorBlinking: TextEditorCursorBlinkingStyle[TextEditorCursorBlinkingStyle.Blink].toLowerCase(),
        });
        this._editor.addOverlayWidget(this._basicInputWidget);
    }
    get editor() {
        return this._editor;
    }
    addListeners() {
        this._subs.push(this._editor.onKeyDown(this.onKeyDown.bind(this)));
        this._throttledScroll = throttle(this.onEditorScroll.bind(this), 500);
        this._subs.push(this._editor.onDidScrollChange(this._throttledScroll));
    }
    cancelKey(ev) {
        ev.preventDefault();
        ev.stopPropagation();
    }
    /**
     *
     * @todo Refactor this function as it may lead to future complexity
     * and it is the entry point for all key presses.
     */
    onKeyDown(ev) {
        let key = util_1.monacoToEmacsKey(ev);
        if (!key) {
            return;
        }
        if (this._prefixKey === 'C-u' && key !== 'C-u') {
            this.tryRemovePrefixMap(key, ev);
        }
        else if (key !== 'C-g') {
            if (commands_1.prefixPreservingKeys[key]) {
                this.cancelKey(ev);
                if (this._prefixKey !== key) {
                    this._prefixKey = key;
                    return;
                }
                this._prefixKey += ` ${key}`;
                key = this._prefixKey;
            }
            else {
                key = this._prefixKey ? `${this._prefixKey} ${key}` : key;
            }
        }
        const command = commands_1.COMMANDS[key];
        if (!command) {
            return;
        }
        this._prefixKey = null;
        this.cancelKey(ev);
        commands_1.executeCommand(this, command, this._lastInputBuffer);
        this._lastInputBuffer = null;
    }
    onEditorScroll(ev) {
        const { height } = this._editor.getLayoutInfo();
        const pos = this._editor.getPosition();
        const layout = this._editor.getScrolledVisiblePosition(this._editor.getPosition());
        if (layout.top >= 0 && layout.top <= height) {
            return;
        }
        const ranges = this.editor.getVisibleRanges();
        if (!ranges.length) {
            return;
        }
        let newPos;
        if (layout.top < 0) {
            newPos = new monaco.Position(ranges[0].getStartPosition().lineNumber, 1);
        }
        else if (layout.top > height) {
            newPos = new monaco.Position(ranges[ranges.length - 1].getEndPosition().lineNumber, 1);
        }
        this._editor.setPosition(newPos);
    }
    onContentChange() {
        this.selectionMode = false;
    }
    clearPrefixKey() {
        this._prefixKey = null;
    }
    addToRing(str) {
        this._killRing.push(str);
        if (this._killRing.length > 50)
            this._killRing.shift();
    }
    growRingTop(str) {
        if (!this._killRing.length) {
            this.addToRing(str);
            this._killRing[this._killRing.length - 1] += str;
        }
    }
    getFromRing(n) {
        return this._killRing[this._killRing.length - (n ? Math.min(n, 1) : 1)] || '';
    }
    popFromRing() {
        if (this._killRing.length > 1) {
            return this._killRing.pop();
        }
        return this.getFromRing();
    }
    set selectionMode(mode) {
        if (mode === this._inSelectionMode) {
            return;
        }
        this._inSelectionMode = mode;
        if (mode) {
            /**
             * @todo Fire mark set event
             */
            this._changeDisposable = this._editor.onDidChangeModelContent(this.onContentChange.bind(this));
        }
        else if (this._changeDisposable) {
            /**
             * @todo Fire mark unset event
             */
            this._changeDisposable.dispose();
        }
    }
    get selectionMode() {
        return this._inSelectionMode;
    }
    addPrefixMap() {
        this._prefixMap = true;
        this._prefixKeyMap = prefixKeyMap;
    }
    tryRemovePrefixMap(arg, ev) {
        if (typeof arg === 'string' && (/^\d$/.test(arg) || arg == 'C-u')) {
            this.cancelKey(ev);
            this._inputBuffer = (this._inputBuffer || '') + arg;
            return;
        }
        // if (prefixPreservingKeys[arg]) {
        //   return;
        // }
        this._lastInputBuffer = this._inputBuffer;
        this._inputBuffer = null;
        this._prefixKeyMap = null;
        this._prefixMap = false;
    }
    clearPrefix() {
        this._prefixMap = false;
    }
    getCursorAnchor() {
        const sel = this._editor.getSelection();
        const dir = sel.getDirection();
        return dir === monaco.SelectionDirection.LTR ? sel.getEndPosition() : sel.getStartPosition();
    }
    getBasicInput(message) {
        return this._basicInputWidget.getInput(message);
    }
    dispose() {
        this._subs.forEach(d => d.dispose());
        this._subs = [];
        if (this._changeDisposable) {
            this._changeDisposable.dispose();
            this._changeDisposable = null;
        }
        this._editor.updateOptions({
            cursorStyle: this._intialCursorType,
            cursorBlinking: this._intialCursorBlinking,
        });
        this._editor.removeOverlayWidget(this._basicInputWidget);
        this._throttledScroll.cancel();
    }
}
exports.EmacsExtension = EmacsExtension;
