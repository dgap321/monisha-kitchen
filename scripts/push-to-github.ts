// GitHub integration - push code to repository
import { Octokit } from '@octokit/rest'
import * as fs from 'fs'
import * as path from 'path'

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

const SKIP_DIRS = new Set([
  '.git', 'node_modules', 'dist', '.cache', '.config', '.local', '.npm', '.upm', 'attached_assets'
]);

const SKIP_FILES = new Set([
  'package-lock.json', '.replit', 'replit.nix'
]);

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.avif', '.svg',
  '.mp4', '.mp3', '.wav', '.ogg', '.webm',
  '.woff', '.woff2', '.ttf', '.eot',
  '.pdf', '.zip', '.tar', '.gz'
]);

function collectFiles(dir: string, baseDir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...collectFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(entry.name)) continue;
      if (entry.name.endsWith('.log')) continue;
      files.push(relativePath);
    }
  }
  
  return files;
}

function isBinary(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

async function main() {
  const octokit = await getUncachableGitHubClient();
  
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);
  
  const owner = 'dgap321';
  const repo = 'monisha-kitchen';
  const branch = 'main';
  const commitMessage = 'Update: vibrant amber theme, image upload improvements';
  const baseDir = '/home/runner/workspace';
  
  console.log(`Target repo: ${owner}/${repo}`);
  
  let latestCommitSha: string | undefined;
  let baseTreeSha: string | undefined;
  
  try {
    const { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
    latestCommitSha = ref.object.sha;
    const { data: commit } = await octokit.git.getCommit({ owner, repo, commit_sha: latestCommitSha });
    baseTreeSha = commit.tree.sha;
    console.log(`Existing branch found. Latest commit: ${latestCommitSha.substring(0, 7)}`);
  } catch (e: any) {
    if (e.status === 404 || e.status === 409) {
      console.log('Repository is empty or branch not found. Will create initial commit.');
    } else {
      throw e;
    }
  }
  
  const allFiles = collectFiles(baseDir, baseDir);
  console.log(`Found ${allFiles.length} files to push`);
  
  const BATCH_SIZE = 10;
  const treeItems: Array<{ path: string; mode: '100644'; type: 'blob'; sha: string }> = [];
  
  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    const batch = allFiles.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (filePath) => {
      const fullPath = path.join(baseDir, filePath);
      const binary = isBinary(filePath);
      
      let content: string;
      let encoding: 'utf-8' | 'base64';
      
      if (binary) {
        content = fs.readFileSync(fullPath).toString('base64');
        encoding = 'base64';
      } else {
        content = fs.readFileSync(fullPath, 'utf-8');
        encoding = 'utf-8';
      }
      
      const { data: blob } = await octokit.git.createBlob({
        owner, repo,
        content,
        encoding
      });
      
      return {
        path: filePath,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha
      };
    });
    
    const results = await Promise.all(promises);
    treeItems.push(...results);
    console.log(`  Uploaded ${Math.min(i + BATCH_SIZE, allFiles.length)}/${allFiles.length} files...`);
  }
  
  console.log('Creating tree...');
  const { data: tree } = await octokit.git.createTree({
    owner, repo,
    tree: treeItems,
    ...(baseTreeSha ? { base_tree: baseTreeSha } : {})
  });
  
  console.log('Creating commit...');
  const { data: newCommit } = await octokit.git.createCommit({
    owner, repo,
    message: commitMessage,
    tree: tree.sha,
    ...(latestCommitSha ? { parents: [latestCommitSha] } : { parents: [] })
  });
  
  console.log(`Commit created: ${newCommit.sha.substring(0, 7)}`);
  
  if (latestCommitSha) {
    await octokit.git.updateRef({
      owner, repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
      force: true
    });
    console.log(`Updated branch '${branch}' to ${newCommit.sha.substring(0, 7)}`);
  } else {
    try {
      await octokit.git.createRef({
        owner, repo,
        ref: `refs/heads/${branch}`,
        sha: newCommit.sha
      });
      console.log(`Created branch '${branch}' at ${newCommit.sha.substring(0, 7)}`);
    } catch {
      await octokit.git.updateRef({
        owner, repo,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
        force: true
      });
      console.log(`Updated branch '${branch}' to ${newCommit.sha.substring(0, 7)}`);
    }
  }
  
  console.log(`\nDone! Code pushed to https://github.com/${owner}/${repo}`);
}

main().catch((err) => {
  console.error('Push failed:', err.message || err);
  process.exit(1);
});
