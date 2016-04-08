# Reproducing the bug

1. Clone this repo
2. `git checkout bug/snabbdom-list-error`
3. `cd examples && npm i` 
4. Comment out transposition from `node_modules/cycle-snabbdom/src/makeDOMDriver.js line 79` 
5. `npm start 03-counter-list`
6. Try to remove the first counter
