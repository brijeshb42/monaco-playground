import * as monaco from 'monaco-editor';
import themeList from 'monaco-themes/themes/themelist.json'

import registerLanguage from './languages/register';

import './index.css';

const availableLanguages = preval`
  const fs = require('fs');
  const path = require('path');
  const langPath = path.join(process.cwd(), 'src', 'languages', 'ace', 'definitions');
  const langFiles = fs.readdirSync(langPath);
  module.exports = langFiles.map(lang => lang.split('.')[0]);
`;

availableLanguages.forEach(lang => {
  if (monaco.languages.getLanguages().find(l => l.id === lang)) {
    return;
  }
  registerLanguage(lang);
});


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
  return import(`monaco-themes/themes/${themePath}`)
    .then((data) => {
      loadedThemes[value] = true;
      monaco.editor.defineTheme(value, data);
    });
}

const codeSamples = {
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
  monaco.editor.setModelLanguage(editor.model, value);
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
vimNode.addEventListener('change', function(ev) {
  if (ev.target.checked) {
    if (emacsMode) {
      emacsNode.checked = false;
      emacsMode.dispose();
      emacsMode = null;
    }
    import('./cm/vim')
      .then(({ attachVim }) => {
        vimAdapter = attachVim(editor, document.getElementById('vim-statusbar'));
        editor.focus();
      });
  } else if (vimAdapter) {
    vimAdapter.dispose();
    vimAdapter = null;
    document.getElementById('vim-statusbar').innerHTML = '';
  }
  editor.focus();
});

emacsNode.addEventListener('change', function(ev) {
  if (ev.target.checked) {
    if (vimAdapter) {
      vimNode.checked = false;
      vimAdapter.dispose();
      vimAdapter = null;
    }
    import('./emacs/')
      .then(({ EmacsExtension }) => {
        emacsMode = new EmacsExtension(editor);
        emacsMode.start();
        editor.focus();
      });
  } else if (emacsMode) {
    emacsMode.dispose();
    emacsMode = null;
  }
  editor.focus();
});

langNode.style.display = 'initial';
themeNode.style.display = 'initial';
onThemeChange(themeNode.value);
onLanguageChange(langNode.value);

window.editor = editor;
