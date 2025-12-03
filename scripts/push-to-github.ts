// Script to create GitHub repository and push code
import { getUncachableGitHubClient } from '../server/github';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function main() {
  const repoName = 'ambient-bgm';
  const repoDescription = 'Weather-based ambient BGM generator using OpenAI and ElevenLabs';
  
  try {
    console.log('Getting GitHub client...');
    const octokit = await getUncachableGitHubClient();
    
    // Get authenticated user
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`Authenticated as: ${user.login}`);
    
    // Check if repo exists
    let repoExists = false;
    try {
      await octokit.repos.get({
        owner: user.login,
        repo: repoName,
      });
      repoExists = true;
      console.log(`Repository ${repoName} already exists`);
    } catch (e: any) {
      if (e.status !== 404) throw e;
    }
    
    // Create repo if it doesn't exist
    if (!repoExists) {
      console.log(`Creating repository: ${repoName}...`);
      await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: repoDescription,
        private: false,
        auto_init: false,
      });
      console.log('Repository created!');
    }
    
    // Get access token for git operations
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY 
      ? 'repl ' + process.env.REPL_IDENTITY 
      : process.env.WEB_REPL_RENEWAL 
      ? 'depl ' + process.env.WEB_REPL_RENEWAL 
      : null;
    
    const connRes = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken!
        }
      }
    ).then(res => res.json());
    
    const accessToken = connRes.items?.[0]?.settings?.access_token || 
                        connRes.items?.[0]?.settings?.oauth?.credentials?.access_token;
    
    if (!accessToken) {
      throw new Error('Could not get access token');
    }
    
    const remoteUrl = `https://${user.login}:${accessToken}@github.com/${user.login}/${repoName}.git`;
    
    // Configure git
    console.log('Configuring git...');
    await execAsync('git config user.email "replit@users.noreply.github.com"');
    await execAsync('git config user.name "Replit Agent"');
    
    // Check if remote exists
    try {
      await execAsync('git remote remove origin');
    } catch (e) {
      // Remote doesn't exist, that's fine
    }
    
    // Add remote and push
    console.log('Adding remote...');
    await execAsync(`git remote add origin "${remoteUrl}"`);
    
    // Add all files and commit
    console.log('Adding files...');
    await execAsync('git add -A');
    
    try {
      await execAsync('git commit -m "Initial commit: Weather-based Ambient BGM app"');
      console.log('Created commit');
    } catch (e) {
      console.log('No changes to commit or already committed');
    }
    
    // Push to GitHub
    console.log('Pushing to GitHub...');
    await execAsync('git push -u origin main --force');
    
    console.log(`\n✅ Successfully pushed to: https://github.com/${user.login}/${repoName}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
