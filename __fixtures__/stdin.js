#!/usr/bin/env node

let count = '';
process.stdin.on('data', function(data) {
  count += data.toString();
});

process.stdin.on('end', function() {
  process.stdin.end();
  process.stdout.write(count);
  process.exit();
});
