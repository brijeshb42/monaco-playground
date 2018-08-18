"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Actions = require("./actions");
;
exports.prefixPreservingKeys = {
    "M-g": true,
    "C-x": true,
    "C-q": true,
    "C-u": true,
};
const setMarkAction = new Actions.SetMark();
const undoAction = new Actions.UndoAction();
const moveCursorDown = new Actions.MoveCursorDown();
const moveCursorUp = new Actions.MoveCursorUp();
const moveCursorRight = new Actions.MoveCursorRight();
const moveCursorLeft = new Actions.MoveCursorLeft();
exports.COMMANDS = {
    'M-;': 'editor.action.commentLine',
    'C-t': 'editor.action.transpose',
    'C-x C-p': 'selectAll',
    'C-SPC': setMarkAction,
    'S-C-2': setMarkAction,
    'C-/': undoAction,
    'S-C--': undoAction,
    'C-z': undoAction,
    'C-x u': undoAction,
    'C-n': moveCursorDown,
    'Down': moveCursorDown,
    'C-p': moveCursorUp,
    'Up': moveCursorUp,
    'C-f': moveCursorRight,
    'Right': moveCursorRight,
    'C-b': moveCursorLeft,
    'Left': moveCursorLeft,
    'C-k': new Actions.KillLines(),
    'C-m': new Actions.InsertLineAfter(),
    'C-w': new Actions.KillSelection(),
    'C-o': new Actions.InsertLineBelow(),
    'C-g': new Actions.KeyBoardQuit(),
    'C-e': new Actions.MoveCursorToLineEnd(),
    'C-a': new Actions.MoveCursorToLineStart(),
    'C-y': new Actions.Yank(),
    'M-w': new Actions.YankSelectionToRing(),
    'M-y': new Actions.YankRotate(),
    'C-l': new Actions.RevealToCenterAction(),
    // This needs to be dynamic so that the character after C-q is inserted
    'C-q Tab': new Actions.InsertTabs(),
    'M-r': new Actions.RotateCursorOnScreen(),
    'M-g M-g': new Actions.GotoLine(),
    'C-x C-x': new Actions.InvertSelection(),
    'Tab': 'editor.action.formatDocument',
};
function executeCommand(state, command, inputBuffer) {
    const editor = state.editor;
    if (typeof command === 'string') {
        editor.trigger(Actions.SOURCE, command, null);
    }
    else if (Array.isArray(command)) {
        command.forEach((cmd) => {
            editor.trigger(Actions.SOURCE, cmd, null);
        });
    }
    else {
        const repeat = parseInt(inputBuffer) || 1;
        command.run(editor, state, repeat);
    }
}
exports.executeCommand = executeCommand;
