/**
 * MongoDB Atlas MCP Integration
 * 
 * Database-as-a-Service (DBaaS) da MongoDB
 * Docs: https://www.mongodb.com/docs/atlas/api/
 */

export interface MongoDBAtlasConfig {
  publicKey: string; // API Public Key
  privateKey: string; // API Private Key
  groupId: string; // Project/Group ID
}

export interface MongoDBCluster {
  id?: string;
  name: string;
  clusterType: 'REPLICASET' | 'SHARDED' | 'GEOSHARDED';
  mongoDBVersion: string;
  providerSettings: {
    providerName: 'AWS' | 'GCP' | 'AZURE' | 'TENANT';
    regionName: string;
    instanceSizeName: string; // M0, M10, M20, M30, etc
  };
  diskSizeGB?: number;
  backupEnabled?: boolean;
  autoScaling?: {
    diskGBEnabled?: boolean;
    compute?: {
      enabled?: boolean;
      scaleDownEnabled?: boolean;
      minInstanceSize?: string;
      maxInstanceSize?: string;
    };
  };
  stateName?: 'IDLE' | 'CREATING' | 'UPDATING' | 'DELETING' | 'DELETED' | 'REPAIRING';
}

export interface MongoDBUser {
  username: string;
  password?: string;
  databaseName: string; // Geralmente 'admin'
  roles: Array<{
    databaseName: string;
    roleName: 'read' | 'readWrite' | 'dbAdmin' | 'userAdmin' | 'clusterAdmin' | 'readAnyDatabase' | 'readWriteAnyDatabase' | 'dbAdminAnyDatabase' | 'atlasAdmin';
  }>;
  scopes?: Array<{
    name: string;
    type: 'CLUSTER' | 'DATA_LAKE';
  }>;
}

export interface MongoDBIPWhitelist {
  ipAddress?: string; // IP único (ex: 192.168.1.1)
  cidrBlock?: string; // Bloco CIDR (ex: 10.0.0.0/24)
  comment?: string;
}

export interface MongoDBBackup {
  id: string;
  clusterId: string;
  clusterName: string;
  created: string;
  expires: string;
  status: 'PENDING' | 'COMPLETE' | 'FAILED';
  type: 'SCHEDULED' | 'ON_DEMAND';
}

export class MongoDBAtlasMCP {
  private config: MongoDBAtlasConfig;
  private baseUrl = 'https://cloud.mongodb.com/api/atlas/v1.0';

  constructor(config: MongoDBAtlasConfig) {
    this.config = config;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const auth = Buffer.from(`${this.config.publicKey}:${this.config.privateKey}`).toString('base64');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`MongoDB Atlas API Error: ${error.detail || error.error || response.statusText}`);
    }

    return response.json();
  }

  // ========================================
  // CLUSTERS
  // ========================================

  /**
   * Cria cluster
   */
  async createCluster(cluster: MongoDBCluster): Promise<MongoDBCluster> {
    return this.request(`/groups/${this.config.groupId}/clusters`, {
      method: 'POST',
      body: JSON.stringify(cluster)
    });
  }

  /**
   * Busca cluster
   */
  async getCluster(clusterName: string): Promise<MongoDBCluster> {
    return this.request(`/groups/${this.config.groupId}/clusters/${clusterName}`);
  }

  /**
   * Lista clusters
   */
  async listClusters(): Promise<{ results: MongoDBCluster[] }> {
    return this.request(`/groups/${this.config.groupId}/clusters`);
  }

  /**
   * Atualiza cluster
   */
  async updateCluster(clusterName: string, updates: Partial<MongoDBCluster>): Promise<MongoDBCluster> {
    return this.request(`/groups/${this.config.groupId}/clusters/${clusterName}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Deleta cluster
   */
  async deleteCluster(clusterName: string): Promise<void> {
    await this.request(`/groups/${this.config.groupId}/clusters/${clusterName}`, {
      method: 'DELETE'
    });
  }

  /**
   * Pausa cluster (apenas M10+)
   */
  async pauseCluster(clusterName: string): Promise<MongoDBCluster> {
    return this.request(`/groups/${this.config.groupId}/clusters/${clusterName}`, {
      method: 'PATCH',
      body: JSON.stringify({ paused: true })
    });
  }

  /**
   * Retoma cluster pausado
   */
  async resumeCluster(clusterName: string): Promise<MongoDBCluster> {
    return this.request(`/groups/${this.config.groupId}/clusters/${clusterName}`, {
      method: 'PATCH',
      body: JSON.stringify({ paused: false })
    });
  }

  /**
   * Busca string de conexão
   */
  async getConnectionString(clusterName: string): Promise<{
    standard: string;
    standardSrv: string;
    private: string;
    privateSrv: string;
  }> {
    const cluster = await this.getCluster(clusterName);
    return cluster as any; // connectionStrings na resposta
  }

  // ========================================
  // USUÁRIOS DO DATABASE
  // ========================================

  /**
   * Cria usuário do database
   */
  async createDatabaseUser(user: MongoDBUser): Promise<MongoDBUser> {
    return this.request(`/groups/${this.config.groupId}/databaseUsers`, {
      method: 'POST',
      body: JSON.stringify(user)
    });
  }

  /**
   * Busca usuário
   */
  async getDatabaseUser(username: string): Promise<MongoDBUser> {
    return this.request(`/groups/${this.config.groupId}/databaseUsers/admin/${username}`);
  }

  /**
   * Lista usuários
   */
  async listDatabaseUsers(): Promise<{ results: MongoDBUser[] }> {
    return this.request(`/groups/${this.config.groupId}/databaseUsers`);
  }

  /**
   * Atualiza usuário
   */
  async updateDatabaseUser(username: string, updates: Partial<MongoDBUser>): Promise<MongoDBUser> {
    return this.request(`/groups/${this.config.groupId}/databaseUsers/admin/${username}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Deleta usuário
   */
  async deleteDatabaseUser(username: string): Promise<void> {
    await this.request(`/groups/${this.config.groupId}/databaseUsers/admin/${username}`, {
      method: 'DELETE'
    });
  }

  // ========================================
  // IP WHITELIST (NETWORK ACCESS)
  // ========================================

  /**
   * Adiciona IP à whitelist
   */
  async addIPToWhitelist(entries: MongoDBIPWhitelist[]): Promise<{ results: MongoDBIPWhitelist[] }> {
    return this.request(`/groups/${this.config.groupId}/whitelist`, {
      method: 'POST',
      body: JSON.stringify(entries)
    });
  }

  /**
   * Lista IPs na whitelist
   */
  async listWhitelist(): Promise<{ results: MongoDBIPWhitelist[] }> {
    return this.request(`/groups/${this.config.groupId}/whitelist`);
  }

  /**
   * Remove IP da whitelist
   */
  async removeIPFromWhitelist(ipAddress: string): Promise<void> {
    await this.request(`/groups/${this.config.groupId}/whitelist/${encodeURIComponent(ipAddress)}`, {
      method: 'DELETE'
    });
  }

  /**
   * Permite acesso de qualquer IP (0.0.0.0/0) - NÃO RECOMENDADO EM PRODUÇÃO
   */
  async allowAnywhereAccess(comment: string = 'Allow from anywhere'): Promise<any> {
    return this.addIPToWhitelist([{
      cidrBlock: '0.0.0.0/0',
      comment
    }]);
  }

  // ========================================
  // BACKUPS
  // ========================================

  /**
   * Lista backups do cluster
   */
  async listBackups(clusterName: string): Promise<{ results: MongoDBBackup[] }> {
    return this.request(`/groups/${this.config.groupId}/clusters/${clusterName}/backupSnapshots`);
  }

  /**
   * Cria backup on-demand
   */
  async createOnDemandBackup(clusterName: string, params: {
    description?: string;
    retentionInDays?: number;
  }): Promise<MongoDBBackup> {
    return this.request(`/groups/${this.config.groupId}/clusters/${clusterName}/backupSnapshots`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  /**
   * Deleta backup
   */
  async deleteBackup(clusterName: string, snapshotId: string): Promise<void> {
    await this.request(
      `/groups/${this.config.groupId}/clusters/${clusterName}/backupSnapshots/${snapshotId}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Restaura backup
   */
  async restoreBackup(params: {
    clusterName: string;
    snapshotId: string;
    targetClusterName: string;
    targetGroupId?: string;
  }): Promise<any> {
    return this.request(
      `/groups/${this.config.groupId}/clusters/${params.clusterName}/backupSnapshots/${params.snapshotId}/restoreJobs`,
      {
        method: 'POST',
        body: JSON.stringify({
          deliveryType: 'automated',
          targetClusterName: params.targetClusterName,
          targetGroupId: params.targetGroupId || this.config.groupId
        })
      }
    );
  }

  // ========================================
  // MÉTRICAS E MONITORAMENTO
  // ========================================

  /**
   * Busca métricas do cluster
   */
  async getClusterMetrics(params: {
    clusterName: string;
    granularity: 'PT1M' | 'PT5M' | 'PT1H' | 'P1D'; // 1min, 5min, 1hour, 1day
    period: 'PT1H' | 'P1D' | 'P7D' | 'P30D'; // 1hour, 1day, 7days, 30days
    measurements: string[]; // Ex: ['CONNECTIONS', 'OPCOUNTER_CMD', 'QUERY_EXECUTOR_SCANNED']
  }): Promise<any> {
    const query = new URLSearchParams({
      granularity: params.granularity,
      period: params.period,
      m: params.measurements.join(',')
    }).toString();

    return this.request(
      `/groups/${this.config.groupId}/processes/${params.clusterName}/measurements?${query}`
    );
  }

  /**
   * Lista eventos do projeto
   */
  async listEvents(params?: {
    minDate?: string; // ISO 8601
    maxDate?: string;
  }): Promise<{ results: any[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/groups/${this.config.groupId}/events?${query}`);
  }

  // ========================================
  // ALERTAS
  // ========================================

  /**
   * Configura alerta
   */
  async createAlert(alert: {
    eventTypeName: string; // Ex: 'CLUSTER_MONGOS_IS_MISSING'
    enabled: boolean;
    notifications?: Array<{
      typeName: 'EMAIL' | 'SMS' | 'SLACK' | 'PAGERDUTY' | 'WEBHOOK';
      emailAddress?: string;
      mobileNumber?: string;
      channelName?: string;
      apiToken?: string;
    }>;
  }): Promise<any> {
    return this.request(`/groups/${this.config.groupId}/alertConfigs`, {
      method: 'POST',
      body: JSON.stringify(alert)
    });
  }

  /**
   * Lista alertas ativos
   */
  async listActiveAlerts(): Promise<{ results: any[] }> {
    return this.request(`/groups/${this.config.groupId}/alerts`);
  }

  // ========================================
  // PROJECTS (GROUPS)
  // ========================================

  /**
   * Busca informações do projeto
   */
  async getProject(): Promise<any> {
    return this.request(`/groups/${this.config.groupId}`);
  }

  /**
   * Lista todos os projetos do usuário
   */
  async listProjects(): Promise<{ results: any[] }> {
    return this.request('/groups');
  }
}

// Exemplo de uso:
/*
const atlas = new MongoDBAtlasMCP({
  publicKey: 'your-public-key',
  privateKey: 'your-private-key',
  groupId: 'your-project-id'
});

// Criar cluster M10 na AWS (us-east-1)
const cluster = await atlas.createCluster({
  name: 'production-cluster',
  clusterType: 'REPLICASET',
  mongoDBVersion: '7.0',
  providerSettings: {
    providerName: 'AWS',
    regionName: 'US_EAST_1',
    instanceSizeName: 'M10'
  },
  diskSizeGB: 10,
  backupEnabled: true,
  autoScaling: {
    diskGBEnabled: true,
    compute: {
      enabled: true,
      scaleDownEnabled: true,
      minInstanceSize: 'M10',
      maxInstanceSize: 'M30'
    }
  }
});

console.log('Cluster criado:', cluster.name);
console.log('Estado:', cluster.stateName); // CREATING

// Criar usuário do database
const user = await atlas.createDatabaseUser({
  username: 'app-user',
  password: 'SecurePassword123!',
  databaseName: 'admin',
  roles: [{
    databaseName: 'myapp',
    roleName: 'readWrite'
  }]
});

// Adicionar IP à whitelist
await atlas.addIPToWhitelist([{
  ipAddress: '203.0.113.45',
  comment: 'Production Server'
}]);

// Buscar string de conexão
const conn = await atlas.getConnectionString('production-cluster');
console.log('Connection String:', conn.standardSrv);

// Criar backup on-demand
const backup = await atlas.createOnDemandBackup('production-cluster', {
  description: 'Pre-deployment backup',
  retentionInDays: 7
});

// Buscar métricas
const metrics = await atlas.getClusterMetrics({
  clusterName: 'production-cluster',
  granularity: 'PT5M',
  period: 'P1D',
  measurements: ['CONNECTIONS', 'OPCOUNTER_CMD', 'QUERY_EXECUTOR_SCANNED']
});
*/
