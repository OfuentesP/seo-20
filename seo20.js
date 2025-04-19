#!/usr/bin/env node
async function main(url) {
  if (!url) {
    throw new Error('No URL provided');
  }
  console.log(`url received: ${url}`);
}

module.exports = { main };