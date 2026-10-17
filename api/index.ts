let cachedApp: any = null;

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    const serverModule = await import('../apps/api/dist/server.js');
    cachedApp = serverModule.app;
  }
  return cachedApp(req, res);
}
