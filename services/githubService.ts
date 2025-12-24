
export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string;
}

export async function validateGitHubToken(token: string): Promise<GitHubUser | null> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`,
      },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Erro ao validar token GitHub:", error);
    return null;
  }
}

export async function listUserRepos(token: string) {
  try {
    const response = await fetch('https://api.github.com/user/repos?sort=updated', {
      headers: {
        Authorization: `token ${token}`,
      },
    });
    return await response.json();
  } catch (error) {
    return [];
  }
}
