import { DatabaseService } from '../database/database.service';
import { Repository } from 'typeorm';
import { EntityTarget } from 'typeorm/common/EntityTarget';

export class BaseService {
  constructor(private readonly dbService: DatabaseService) {}

  async getRepository<T>(
    databaseName: string,
    entityClass: EntityTarget<T>,
  ): Promise<Repository<T>> {
    const ds = await this.dbService.getConnection(databaseName);
    return ds.getRepository<T>(entityClass);
  }
}
