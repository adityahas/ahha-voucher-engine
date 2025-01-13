export class BaseController {
  getDatabaseName(req: Request): string {
    const databaseName = req['client'].database_name;
    if (!databaseName) {
      throw new Error('Database name not found.');
    }
    return databaseName;
  }
}
