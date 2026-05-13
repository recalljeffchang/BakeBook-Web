
import { readFileSync, writeFileSync } from 'fs';
const file = 'd:/bakebook/src/pages/RecipeDetail.jsx';
let text = readFileSync(file, 'utf8');

// Fix the closing of the editGroups IIFE
// Currently it has:   ))}  then </div> then )}
// Needs to be:        ))} then </div> then ); then }); then })()
const oldClose = `              ))}\n            </div>\n          )}\n\n          {/* ── 新增食材表單 ── */}`;
const newClose = `                      ))}\n                    </div>\n                  );\n                });\n              })()}\n            </div>\n          )}\n\n          {/* ── 新增食材表單 ── */}`;
if (text.includes(oldClose)) {
  text = text.replace(oldClose, newClose);
  console.log('Close fixed OK');
} else {
  console.log('Close anchor not found, trying alternate...');
  // Try to find the position
  const idx = text.indexOf('))}');
  console.log('First ))} at idx:', idx);
  console.log('Context:', JSON.stringify(text.substring(idx - 20, idx + 80)));
}

writeFileSync(file, text, 'utf8');
const opens  = text.split('').filter(c => c === '{').length;
const closes = text.split('').filter(c => c === '}').length;
console.log(`Bracket diff: ${opens - closes}`);
