#!/usr/bin/env node
/**
 * SCHEDULER - Runs eternal lead bot every 2 hours
 * Also provides manual trigger endpoint
 */

import { runScraping } from './eternal-lead-bot.mjs';
import cron from 'node-cron';
import express from 'express';

const app = express();
const PORT = process.env.SCHEDULER_PORT || 3001;

let isRunning = false;
let lastRun = null;
let lastStats = null;
let nextRun = null;

// Calculate next run time
function calculateNextRun() {
  const now = new Date();
  const next = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 hours
  return next;
}

// Wrapper function to track state
async function runScrapingWithTracking() {
  if (isRunning) {
    console.log('⚠️  Scraping already in progress, skipping...');
    return;
  }
  
  isRunning = true;
  lastRun = new Date();
  nextRun = calculateNextRun();
  
  try {
    const stats = await runScraping();
    lastStats = stats;
    console.log(`✅ Scheduled run completed. Next run: ${nextRun.toISOString()}`);
  } catch (error) {
    console.error('❌ Scheduled run failed:', error);
    lastStats = { error: error.message };
  } finally {
    isRunning = false;
  }
}

// Schedule: Every 2 hours
// Cron format: minute hour day month weekday
// */120 would be every 120 minutes, but cron doesn't support that
// So we use: 0 */2 * * * (at minute 0 of every 2nd hour)
const schedule = '0 */2 * * *';

console.log('🤖 ETERNAL LEAD BOT SCHEDULER');
console.log(`📅 Schedule: Every 2 hours (${schedule})`);
console.log(`🌐 Manual trigger: http://localhost:${PORT}/trigger`);
console.log(`📊 Status endpoint: http://localhost:${PORT}/status`);
console.log('');

// Start cron job
cron.schedule(schedule, () => {
  console.log('\n⏰ Scheduled scraping triggered');
  runScrapingWithTracking();
}, {
  timezone: "America/Sao_Paulo"
});

// API endpoints
app.get('/status', (req, res) => {
  res.json({
    running: isRunning,
    lastRun: lastRun,
    lastStats: lastStats,
    nextRun: nextRun,
    schedule: 'Every 2 hours'
  });
});

app.post('/trigger', async (req, res) => {
  if (isRunning) {
    return res.status(409).json({
      error: 'Scraping already in progress'
    });
  }
  
  res.json({
    message: 'Scraping triggered manually',
    timestamp: new Date()
  });
  
  // Run async
  runScrapingWithTracking();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`✅ Scheduler API running on port ${PORT}`);
  console.log(`\nTo trigger manually: curl -X POST http://localhost:${PORT}/trigger`);
  console.log(`To check status: curl http://localhost:${PORT}/status\n`);
  
  // Run immediately on startup
  console.log('🚀 Running initial scraping...\n');
  runScrapingWithTracking();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down scheduler...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down scheduler...');
  process.exit(0);
});
