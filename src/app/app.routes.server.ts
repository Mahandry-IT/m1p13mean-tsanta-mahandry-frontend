import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Routes with dynamic parameters - use Server rendering (not prerender)
  { path: 'manager/orders/:id', renderMode: RenderMode.Server },
  
  // All other routes - prerender
  { path: '**', renderMode: RenderMode.Prerender }
];
