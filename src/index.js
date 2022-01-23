import * as monaco from 'monaco-editor';
import themeList from 'monaco-themes/themes/themelist.json'
import { registerAllAvailableLanguages } from 'monaco-ace-tokenizer/lib/lazy';

import './index.css';

class HelpWidget {
  static ID = 'extension.emacs.help.widget';
  constructor() {
    this._dom = document.createElement('div');
    this._dom.setAttribute('class', 'extension-emacs-help-widget');
    this._dom.setAttribute('tabIndex', 0);
    this._dom.style.visibility = 'hidden';
    this._dom.addEventListener('blur', this.onBlur);
  }

  getId() {
    return HelpWidget.ID;
  }
  getDomNode() {
    return this._dom;
  }
  getPosition() {
    return {
      preference: monaco.editor.OverlayWidgetPositionPreference.TOP_CENTER,
    }
  }

  onBlur = () => {
    this._dom.style.visibility = 'hidden';
    this._dom.textContent = '';
  }

  show(text) {
    this._dom.style.visibility = 'visible';
    this._dom.innerHTML = text;
    this._dom.focus();
  }
}

let helpWidget = new HelpWidget();

registerAllAvailableLanguages();

const lightThemes = [{
  label: 'VS',
  value: 'vs',
}, {
  label: 'VS Dark',
  value: 'vs-dark',
}, {
  label: 'High Contrast (Dark)',
  value: 'hc-black',
}];

Object.keys(themeList).forEach((key) => {
  lightThemes.push({
    label: themeList[key],
    value: key,
  });
});

const loadedThemes = {
  'vs': true,
  'vs-dark': true,
  'hc-black': true,
};

const themeLoadPromises = {};

function loadTheme(value) {
  if (themeLoadPromises[value]) {
    return themeLoadPromises[value];
  }

  const themePath = themeList[value];
  return import(/* webpackChunkName: "theme/[request]" */`monaco-themes/themes/${themePath}`)
    .then((data) => {
      loadedThemes[value] = true;
      monaco.editor.defineTheme(value, data);
    });
}

const codeSamples = {
  'elixir': {
    text: '',
    url: 'https://raw.githubusercontent.com/phoenixframework/phoenix/master/lib/phoenix/router/route.ex',
  },
  coffeescript: {
    text: '',
    url: 'https://raw.githubusercontent.com/cypress-io/cypress/develop/packages/electron/lib/electron.coffee',
  },
  swift: {
    text: '',
    url: 'https://raw.githubusercontent.com/yichengchen/clashX/master/ClashX/General/ConfigFileFactory.swift',
  },
  python: {
    text: '',
    url: 'https://raw.githubusercontent.com/brijeshb42/yapper/master/yapper/lib/models.py',
  },
  kotlin: {
    text: '',
    url: 'https://raw.githubusercontent.com/JetBrains/kotlin/master/core/builtins/src/kotlin/Annotations.kt',
  },
  clojure: {
    text: '',
    url: 'https://raw.githubusercontent.com/clojure/clojure/master/src/clj/clojure/core_deftype.clj',
  },
};

// --- DOM --- //

const langNode = document.getElementById('language-select');
const themeNode = document.getElementById('theme-select');
const minimapNode = document.getElementById('minimap');
const vimNode = document.getElementById('vim');
const emacsNode = document.getElementById('emacs');
const statusNode = document.getElementById('vim-statusbar');

monaco.languages.getLanguages().forEach((lang) => {
  const opt = document.createElement('option');
  opt.value = lang.id;
  opt.text = lang.id;

  if (lang.id === 'kotlin') {
    opt.selected = true;
  }

  langNode.add(opt);
});

lightThemes.forEach((theme) => {
  const opt = document.createElement('option');
  opt.value = theme.value;
  opt.text = theme.label;

  if (theme.value === 'cobalt') {
    opt.selected = true;
  }

  themeNode.add(opt);
});


const node = document.getElementById('editor');
const editor = monaco.editor.create(node, {
  language: 'javascript',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  fontSize: 14,
});
editor.focus();

function onLanguageChange(ev) {
  const value =   (typeof ev === 'string') ? ev : ev.target.value;
  monaco.editor.setModelLanguage(editor.getModel(), value);
  editor.setValue('');
  editor.focus();

  if (!codeSamples[value]) {
    return;
  }

  if (codeSamples[value].text) {
    editor.setValue(codeSamples[value].text);
  } else {
    fetch(codeSamples[value].url)
      .then(r => r.text())
      .then(text => {
        codeSamples[value].text = text;
        editor.setValue(text);
      });
  }
  gtag('event', 'language', {value});
}

function onThemeChange(ev) {
  const value = (typeof ev === 'string') ? ev : ev.target.value;
  if (loadedThemes[value]) {
    monaco.editor.setTheme(ev.target.value);
  } else {
    loadTheme(value).then(() => {
      monaco.editor.setTheme(value);
    });
  }
  gtag('event', 'theme', {value});
  editor.focus();
}

langNode.addEventListener('change', onLanguageChange);
themeNode.addEventListener('change', onThemeChange);

minimapNode.addEventListener('change', function(ev) {
  editor.updateOptions({
    minimap: {
      enabled: ev.target.checked,
    },
  });
  editor.focus();
});

let vimAdapter;
let emacsMode;

function disposeModes() {
  if (vimAdapter) {
    vimAdapter.dispose();
    vimAdapter = null;
    vimNode.checked = false;
  }

  if (emacsMode) {
    emacsMode.dispose();
    emacsMode = null;
    emacsNode.checked = false;
  }

  editor.removeOverlayWidget(helpWidget);
  statusNode.style.display = 'none';
  statusNode.innerHTML = '';
  window.vimAdapter = undefined;
  window.emacsMode = undefined;
}

function saveCurrentData() {
  localStorage.setItem('currentvalue', editor.getValue());
}

vimNode.addEventListener('change', function(ev) {
  if (ev.target.checked) {
    disposeModes();
    vimNode.checked = true;
    import(/* webpackChunkName: "vim" */ 'monaco-vim')
      .then(({ VimMode, initVimMode }) => {
        VimMode.Vim.defineEx('write', 'w', saveCurrentData);
        vimAdapter = initVimMode(editor, statusNode);
        editor.focus();
        window.vimAdapter = vimAdapter;
      });
  } else {
    disposeModes();
  }
  gtag('event', 'mode-vim', {
    type: 'vim',
    action: ev.target.checked ? 'enabled' : 'disabled',
  });
  editor.focus();
});

emacsNode.addEventListener('change', function(ev) {
  if (ev.target.checked) {
    disposeModes();
    emacsNode.checked = true;
    import(/* webpackChunkName: "emacs" */ 'monaco-emacs')
      .then(({ EmacsExtension, registerGlobalCommand, getAllMappings }) => {
        registerGlobalCommand('C-h', {
          description: 'Show this help command',
          run() {
            const data = getAllMappings();
            console.log(data);
            const res = Object.keys(data).map(key => [key, data[key]]).map(([k, v]) => {
              return `<li>${k} - ${v}</li>`;
            }).join('\n');
            helpWidget.show(`<ul>${res}</ul>`);
          }
        });

        emacsMode = new EmacsExtension(editor);
        editor.addOverlayWidget(helpWidget);
        statusNode.style.display = 'block';
        emacsMode.onDidMarkChange((ev) => {
          statusNode.textContent = ev ? 'Mark Set!' : 'Mark Unset';
        });
        emacsMode.onDidChangeKey((str) => {
          statusNode.textContent = str;
        });
        emacsMode.start();
        editor.focus();
        window.emacsMode = emacsMode;
      });
  } else {
    disposeModes();
  }
  editor.focus();
  gtag('event', 'mode-emacs', {
    type: 'emacs',
    action: ev.target.checked ? 'enabled' : 'disabled',
  });
});

langNode.style.display = 'initial';
themeNode.style.display = 'initial';
onThemeChange(themeNode.value);
onLanguageChange(langNode.value);

window.editor = editor;
