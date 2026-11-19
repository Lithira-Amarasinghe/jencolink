import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { mergeApplicationConfig } from '@angular/core';
import { RenderMode, provideServerRendering, withRoutes } from '@angular/ssr';
import { App } from './app/app';
import { appConfig } from './app/app.config';

const config = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering(withRoutes([{ path: '', renderMode: RenderMode.Prerender }]))],
});

export default (context: BootstrapContext) => bootstrapApplication(App, config, context);
