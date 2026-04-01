import dotenv from 'dotenv';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: resolve(repoRoot, '.env') });

if (typeof fetch !== 'function') {
  console.error('Error: Node.js 18+ is required because native fetch is not available.');
  process.exit(1);
}

const argv = process.argv.slice(2).map((value) => value.toLowerCase());

if (argv.includes('--help') || argv.includes('-h') || argv.includes('help')) {
  console.log('Usage: node scripts/n8n-backup-workflow.mjs [test|prod]');
  console.log('Defaults to test.');
  process.exit(0);
}

const workflowType = resolveWorkflowType(argv);
const { N8N_BASE_URL, N8N_API_KEY, WORKFLOW_ID, TEST_WORKFLOW_ID } = process.env;
const baseUrl = N8N_BASE_URL?.trim();
const apiKey = N8N_API_KEY?.trim();
const workflowId = (workflowType === 'production' ? WORKFLOW_ID : TEST_WORKFLOW_ID)?.trim();

try {
  assertRequiredValue(baseUrl, 'N8N_BASE_URL');
  assertRequiredValue(apiKey, 'N8N_API_KEY');
  assertRequiredValue(workflowId, workflowType === 'production' ? 'WORKFLOW_ID' : 'TEST_WORKFLOW_ID');

  const url = buildWorkflowUrl(baseUrl, workflowId);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'X-N8N-API-KEY': apiKey,
    },
  });

  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiError(response, payload));
  }

  const workflow = extractWorkflowPayload(payload);
  const backupsDir = resolve(repoRoot, 'backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeWorkflowId = sanitizePathSegment(workflowId);
  const fileName = `${workflowType}-${safeWorkflowId}-${timestamp}.json`;
  const filePath = resolve(backupsDir, fileName);

  await mkdir(backupsDir, { recursive: true });
  await writeFile(filePath, `${JSON.stringify(workflow, null, 2)}\n`, 'utf8');

  console.log(`Success: backed up ${workflowType} workflow ${workflowId} to backups/${fileName}`);
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}

function resolveWorkflowType(tokens) {
  if (tokens.includes('--prod') || tokens.includes('--production') || tokens.includes('prod') || tokens.includes('production')) {
    return 'production';
  }

  return 'test';
}

function assertRequiredValue(value, name) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

function buildWorkflowUrl(baseUrl, workflowId) {
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return new URL(`api/v1/workflows/${encodeURIComponent(workflowId)}`, normalizedBaseUrl).toString();
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function formatApiError(response, payload) {
  const details = extractErrorDetails(payload);
  const baseMessage = `n8n API request failed (${response.status} ${response.statusText})`;
  return details ? `${baseMessage}: ${details}` : baseMessage;
}

function extractErrorDetails(payload) {
  if (typeof payload === 'string') {
    return payload.trim();
  }

  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const candidates = [
    payload.message,
    payload.error?.message,
    payload.error,
    payload.detail,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return '';
}

function extractWorkflowPayload(payload) {
  if (isWorkflowObject(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if (isWorkflowObject(payload.data)) {
    return payload.data;
  }

  if (isWorkflowObject(payload.workflow)) {
    return payload.workflow;
  }

  return payload;
}

function isWorkflowObject(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      ('nodes' in value || 'connections' in value || 'settings' in value || 'active' in value || 'name' in value),
  );
}

function sanitizePathSegment(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '_');
}
