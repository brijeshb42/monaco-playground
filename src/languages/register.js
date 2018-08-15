import { languages as monacoLanguages } from 'monaco-editor';
import Tokenizer from './ace/tmTokenizer';


class State {
  constructor(state) {
    this.state = state;
  }

  equals(other) {
    return (other === this || other.state === this.state);
  }

  clone() {
    return new State(this.state);
  }
}

const languagePromises = {};

export function loadLanguage(languageId) {
  if (languagePromises[languageId]) {
    return languagePromises[languageId];
  }

  return import(`./ace/definitions/${languageId}`)
    .then(({ default: HighlightRules }) => {
      const rules = new HighlightRules();
      const tokenizer = new Tokenizer(rules.getRules());

      monacoLanguages.setTokensProvider(languageId, {
        getInitialState() {
          return new State('');
        },
        tokenize(line, startState) {
          const { tokens, state } = tokenizer.getLineTokens(line, startState.state);
          let offset = 0;

          const monacoTokens = tokens.map((token) => {
            const tok = {
              startIndex: offset,
              scopes: token.type,
            };

            offset += token.value.length;

            return tok;
          });

          return {
            endState: new State(state),
            tokens: monacoTokens,
          };
        },
      });

      if (languageId === 'kotlin') {
        const javadefinition = monacoLanguages.getLanguages().find(lang => lang.id === 'java');
        if (javadefinition) {
          javadefinition.loader().then(({ conf }) => {
            monacoLanguages.setLanguageConfiguration(languageId, conf);
          });
        }
      }
    });
}

export default function registerLanguage(languageId) {
  monacoLanguages.register({
    id: languageId,
  });

  monacoLanguages.onLanguage(languageId, () => {
    loadLanguage(languageId);
  });
}
