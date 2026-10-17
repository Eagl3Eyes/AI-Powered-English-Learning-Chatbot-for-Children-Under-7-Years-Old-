import http from 'node:http';
import { app } from '../../apps/api/src/server.js';

interface BenchmarkResult {
  totalRequests: number;
  concurrency: number;
  successfulRequests: number;
  errorRequests: number;
  errorRatePercent: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  minMs: number;
  maxMs: number;
  avgMs: number;
  subTwoSecondSuccessRate: number;
}

async function runBenchmark(): Promise<void> {
  console.log('===============================================================');
  console.log(' 🚀 AI English Learning Chatbot - Latency Benchmark Runner');
  console.log(' Target: p95 End-to-End Latency < 2,000 ms');
  console.log('===============================================================\n');

  // Start internal server on ephemeral port
  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(0, resolve));
  const address = server.address() as any;
  const port = address.port;
  const baseUrl = `http://localhost:${port}`;

  const TOTAL_REQUESTS = 60;
  const CONCURRENCY = 5;
  const latencies: number[] = [];
  let errors = 0;

  const testPayloads = [
    { learnerId: 'bench-kid', message: 'Hello Pip!' },
    { learnerId: 'bench-kid', message: 'What is your favorite animal?' },
    { learnerId: 'bench-kid', message: "I'm feeling happy today!" },
    { learnerId: 'bench-kid', message: "I want to learn English words" },
    { learnerId: 'bench-kid', message: "I can't do this, it is too hard" },
    { learnerId: 'bench-kid', message: "Stop lesson please" }
  ];

  let completed = 0;
  let running = 0;
  let index = 0;

  async function makeRequest(i: number): Promise<void> {
    const payload = testPayloads[i % testPayloads.length];
    const start = performance.now();

    try {
      const res = await fetch(`${baseUrl}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        errors++;
      } else {
        const body = (await res.json()) as any;
        const duration = performance.now() - start;
        latencies.push(duration);
      }
    } catch {
      errors++;
    } finally {
      completed++;
    }
  }

  const queue = Array.from({ length: TOTAL_REQUESTS }, (_, i) => i);

  console.log(`Executing ${TOTAL_REQUESTS} chat requests with concurrency ${CONCURRENCY}...`);

  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const nextIndex = queue.shift();
      if (nextIndex !== undefined) {
        await makeRequest(nextIndex);
      }
    }
  });

  await Promise.all(workers);
  server.close();

  latencies.sort((a, b) => a - b);

  const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const min = latencies[0] || 0;
  const max = latencies[latencies.length - 1] || 0;
  const avg = latencies.length ? latencies.reduce((acc, v) => acc + v, 0) / latencies.length : 0;
  const subTwoSec = (latencies.filter(l => l < 2000).length / latencies.length) * 100;

  const result: BenchmarkResult = {
    totalRequests: TOTAL_REQUESTS,
    concurrency: CONCURRENCY,
    successfulRequests: latencies.length,
    errorRequests: errors,
    errorRatePercent: (errors / TOTAL_REQUESTS) * 100,
    p50Ms: Math.round(p50 * 100) / 100,
    p95Ms: Math.round(p95 * 100) / 100,
    p99Ms: Math.round(p99 * 100) / 100,
    minMs: Math.round(min * 100) / 100,
    maxMs: Math.round(max * 100) / 100,
    avgMs: Math.round(avg * 100) / 100,
    subTwoSecondSuccessRate: Math.round(subTwoSec * 100) / 100
  };

  console.log('\n--- Latency Benchmark Results ---');
  console.log(`Total Requests:         ${result.totalRequests}`);
  console.log(`Concurrency:            ${result.concurrency}`);
  console.log(`Successful:             ${result.successfulRequests}`);
  console.log(`Errors:                 ${result.errorRequests} (${result.errorRatePercent}%)`);
  console.log(`Min Latency:            ${result.minMs} ms`);
  console.log(`Avg Latency:            ${result.avgMs} ms`);
  console.log(`p50 Latency:            ${result.p50Ms} ms`);
  console.log(`p95 Latency:            ${result.p95Ms} ms`);
  console.log(`p99 Latency:            ${result.p99Ms} ms`);
  console.log(`Max Latency:            ${result.maxMs} ms`);
  console.log(`Latency < 2000ms:       ${result.subTwoSecondSuccessRate}%`);
  console.log('---------------------------------\n');

  if (result.p95Ms < 2000) {
    console.log('✅ PASS: p95 latency is WELL BELOW the 2,000 ms target!');
  } else {
    console.log('❌ FAIL: p95 latency exceeded 2,000 ms target.');
    process.exit(1);
  }
}

runBenchmark().catch(err => {
  console.error('Benchmark execution error:', err);
  process.exit(1);
});
