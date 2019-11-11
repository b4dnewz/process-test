#!/usr/bin/env node

class EventEmitter extends require('events') {
  emit(type, ...args) {
    console.log(e + " emitted")
    super.emit(type, ...args)
  }
}

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Are you waiting? ', (answer) => {
  console.log(answer);
  rl.close();
});
