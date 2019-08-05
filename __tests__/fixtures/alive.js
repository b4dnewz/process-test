#!/usr/bin/env node

let i = 0;
setInterval(function () {
  if (i === 4) {
    process.stdout.write('listening');
  }
  ++i;
}, 500);
