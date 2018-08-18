"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const monaco = require("monaco-editor");
exports.SOURCE = 'extension.emacs';
function moveCursor(editor, hasSelection, direction, repeat = 1) {
    const action = `cursor${direction}${hasSelection ? 'Select' : ''}`;
    for (let i = 0; i < repeat; i++) {
        editor.trigger(exports.SOURCE, action, null);
    }
}
class BaseAction {
}
exports.BaseAction = BaseAction;
class KillSelection extends BaseAction {
    run(editor, ext) {
        const selections = editor.getSelections();
        if (!selections.length) {
            return;
        }
        selections.forEach((sel) => {
            const text = editor.getModel().getValueInRange(sel);
            ext.addToRing(text);
            editor.executeEdits(exports.SOURCE, [{
                    range: sel,
                    text: '',
                }]);
        });
    }
}
exports.KillSelection = KillSelection;
class KillLines extends BaseAction {
    run(editor, ext, repeat) {
        ext.selectionMode = false;
        const model = editor.getModel();
        const pos = ext.getCursorAnchor();
        let endPos;
        if (repeat === 1) {
            const lineLength = model.getLineLength(pos.lineNumber);
            const isAtEnd = pos.column === lineLength + 1;
            if (!lineLength || isAtEnd) {
                ext.addToRing(model.getEOL());
                editor.trigger(exports.SOURCE, 'deleteAllRight', null);
                return;
            }
            else {
                endPos = new monaco.Position(pos.lineNumber, model.getLineLength(pos.lineNumber) + 1);
            }
        }
        else {
            const totalLines = model.getLineCount();
            const endLine = (pos.lineNumber + repeat) > totalLines ? totalLines : (pos.lineNumber + repeat);
            endPos = new monaco.Position(endLine, model.getLineLength(endLine) + 1);
        }
        const range = monaco.Range.fromPositions(pos, endPos);
        ext.addToRing(model.getValueInRange(range));
        editor.executeEdits(exports.SOURCE, [{
                range,
                text: '',
            }]);
        editor.setSelection(monaco.Selection.fromPositions(pos, pos));
    }
}
exports.KillLines = KillLines;
class InsertLineBelow extends BaseAction {
    run(editor, ext, repeat) {
        const pos = editor.getPosition();
        editor.trigger(exports.SOURCE, 'editor.action.insertLineAfter', null);
        editor.setPosition(pos);
    }
}
exports.InsertLineBelow = InsertLineBelow;
class InsertLineAfter extends BaseAction {
    run(editor, ext, repeat) {
        let text = '';
        for (let i = 0; i < repeat; i++) {
            text += editor.getModel().getEOL();
        }
        ext.selectionMode = false;
        const pos = ext.getCursorAnchor();
        editor.executeEdits(exports.SOURCE, [{
                range: monaco.Range.fromPositions(pos),
                text,
                forceMoveMarkers: true,
            }]);
    }
}
exports.InsertLineAfter = InsertLineAfter;
class SetMark extends BaseAction {
    run(editor, ext) {
        const mode = ext.selectionMode;
        const sel = editor.getSelection();
        const selEmpty = sel.isEmpty();
        if (!selEmpty) {
            const dir = sel.getDirection();
            if (dir === monaco.SelectionDirection.LTR) {
                editor.setSelection(monaco.Selection.fromPositions(sel.getEndPosition(), sel.getEndPosition()));
            }
            else {
                editor.setSelection(monaco.Selection.fromPositions(sel.getStartPosition(), sel.getStartPosition()));
            }
        }
        if (selEmpty && ext.selectionMode) {
            ext.selectionMode = false;
        }
        else {
            ext.selectionMode = true;
        }
    }
}
exports.SetMark = SetMark;
class MoveCursorAction extends BaseAction {
    run(editor, ext, repeat) {
        moveCursor(editor, ext.selectionMode, this.direction, repeat);
    }
}
class MoveCursorUp extends MoveCursorAction {
    constructor() {
        super(...arguments);
        this.direction = 'Up';
    }
}
exports.MoveCursorUp = MoveCursorUp;
class MoveCursorDown extends MoveCursorAction {
    constructor() {
        super(...arguments);
        this.direction = 'Down';
    }
}
exports.MoveCursorDown = MoveCursorDown;
class MoveCursorLeft extends MoveCursorAction {
    constructor() {
        super(...arguments);
        this.direction = 'Left';
    }
}
exports.MoveCursorLeft = MoveCursorLeft;
class MoveCursorRight extends MoveCursorAction {
    constructor() {
        super(...arguments);
        this.direction = 'Right';
    }
}
exports.MoveCursorRight = MoveCursorRight;
class MoveCursorToLineEnd extends MoveCursorAction {
    constructor() {
        super(...arguments);
        this.direction = 'End';
    }
}
exports.MoveCursorToLineEnd = MoveCursorToLineEnd;
class MoveCursorToLineStart extends MoveCursorAction {
    constructor() {
        super(...arguments);
        this.direction = 'Home';
    }
}
exports.MoveCursorToLineStart = MoveCursorToLineStart;
class AddPrefixMap extends BaseAction {
    run(editor, ext) {
        ext.addPrefixMap();
    }
}
exports.AddPrefixMap = AddPrefixMap;
class KeyBoardQuit extends BaseAction {
    run(editor, ext) {
        ext.selectionMode = false;
        ext.clearPrefixKey();
        editor.setPosition(editor.getPosition());
    }
}
exports.KeyBoardQuit = KeyBoardQuit;
class HistoryAction extends BaseAction {
    run(editor, ext, repeat) {
        for (let i = 0; i < repeat; i++) {
            editor.trigger(exports.SOURCE, this.action, null);
        }
    }
}
class UndoAction extends HistoryAction {
    constructor() {
        super(...arguments);
        this.action = 'undo';
    }
}
exports.UndoAction = UndoAction;
class RedoAction extends HistoryAction {
    constructor() {
        super(...arguments);
        this.action = 'redo';
    }
}
exports.RedoAction = RedoAction;
class Yank extends BaseAction {
    run(editor, ext, repeat) {
        const text = ext.getFromRing(repeat);
        if (!text) {
            return;
        }
        const pos = editor.getPosition();
        editor.executeEdits(exports.SOURCE, [{
                range: monaco.Range.fromPositions(pos, pos),
                text,
                forceMoveMarkers: true,
            }]);
    }
}
exports.Yank = Yank;
class YankSelectionToRing extends BaseAction {
    run(editor, ext, repeat) {
        const sel = editor.getSelection();
        if (sel.isEmpty()) {
            return;
        }
        ext.addToRing(editor.getModel().getValueInRange(sel));
        ext.selectionMode = false;
        const pos = ext.getCursorAnchor();
        editor.setSelection(monaco.Selection.fromPositions(pos, pos));
    }
}
exports.YankSelectionToRing = YankSelectionToRing;
class YankRotate extends BaseAction {
    run(editor, ext, repeat) {
        const text = ext.popFromRing();
        if (!text) {
            return;
        }
        const pos = ext.getCursorAnchor();
        editor.executeEdits(exports.SOURCE, [{
                range: monaco.Range.fromPositions(pos),
                text,
                forceMoveMarkers: true,
            }]);
    }
}
exports.YankRotate = YankRotate;
class RevealEditorAction extends BaseAction {
    run(editor, ext, repeat) {
        const sel = editor.getSelection();
        if (this.revealFunction === 'up') {
            editor.trigger(exports.SOURCE, 'scrollPageUp', null);
        }
        else {
            editor[this.revealFunction](sel);
        }
    }
}
exports.RevealEditorAction = RevealEditorAction;
class RevealToTopAction extends RevealEditorAction {
    constructor() {
        super(...arguments);
        this.revealFunction = 'revealRangeAtTop';
    }
}
exports.RevealToTopAction = RevealToTopAction;
class RevealToCenterAction extends RevealEditorAction {
    constructor() {
        super(...arguments);
        this.revealFunction = 'revealRangeInCenter';
    }
}
exports.RevealToCenterAction = RevealToCenterAction;
class RevealToBottomAction extends RevealEditorAction {
    constructor() {
        super(...arguments);
        this.revealFunction = 'up';
    }
}
exports.RevealToBottomAction = RevealToBottomAction;
class InsertTabs extends BaseAction {
    run(editor, ext, repeat) {
        const model = editor.getModel();
        const { tabSize, insertSpaces } = model.getOptions();
        let text = '';
        for (let i = 0; i < repeat; i++) {
            text += (insertSpaces ? ' '.repeat(tabSize) : '\t');
        }
        editor.executeEdits(exports.SOURCE, [{
                range: editor.getSelection(),
                text,
                forceMoveMarkers: true,
            }]);
    }
}
exports.InsertTabs = InsertTabs;
class RotateCursorOnScreen extends BaseAction {
    run(editor, ext, repeat) {
        const ranges = editor.getVisibleRanges();
        if (!ranges.length) {
            return;
        }
        const lineMapping = [];
        let start = 1;
        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            for (let j = range.startLineNumber; j <= range.endLineNumber; j++) {
                lineMapping.push(j);
            }
        }
        const pos = editor.getPosition();
        const expectedCenter = Math.ceil(lineMapping.length / 2);
        let toMovePos;
        if (pos.lineNumber === lineMapping[expectedCenter]) {
            toMovePos = new monaco.Position(lineMapping[0], 1);
        }
        else if (pos.lineNumber === lineMapping[0]) {
            toMovePos = new monaco.Position(lineMapping[lineMapping.length - 1], 1);
        }
        else {
            toMovePos = new monaco.Position(lineMapping[expectedCenter], 1);
        }
        editor.setPosition(toMovePos);
    }
}
exports.RotateCursorOnScreen = RotateCursorOnScreen;
class GotoLine extends BaseAction {
    run(editor, ext, repeat) {
        ext.getBasicInput('Goto Line: ').then(val => {
            let line = parseInt(val) || 0;
            const model = editor.getModel();
            const totalLines = model.getLineCount();
            editor.focus();
            if (!line) {
                line = 1;
            }
            else if (line > totalLines) {
                line = totalLines;
            }
            const pos = new monaco.Position(line, 1);
            editor.setPosition(pos);
            editor.revealPositionInCenter(pos);
            editor.focus();
        }).catch(() => {
            editor.focus();
        });
    }
}
exports.GotoLine = GotoLine;
class InvertSelection extends BaseAction {
    run(editor, ext, repeat) {
        const sel = editor.getSelection();
        if (sel.isEmpty()) {
            return;
        }
        let newSel;
        if (sel.getDirection() === monaco.SelectionDirection.LTR) {
            newSel = monaco.Selection.fromPositions(sel.getEndPosition(), sel.getStartPosition());
        }
        else {
            newSel = monaco.Selection.fromPositions(sel.getStartPosition(), sel.getEndPosition());
        }
        editor.setSelection(newSel);
    }
}
exports.InvertSelection = InvertSelection;
