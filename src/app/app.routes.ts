import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'campanhas',
    loadComponent: () =>
      import('./features/campanhas/campanhas.component').then((m) => m.CampanhasComponent)
  },
  {
    path: 'ongs',
    loadComponent: () =>
      import('./features/ongs/ongs.component').then((m) => m.OngsComponent)
  },
  {
    path: 'campanhas/painel',
    loadComponent: () =>
      import('./features/campanhas-painel/campanhas-painel.component').then((m) => m.CampanhasPainelComponent)
  },
  {
    path: 'campanhas/editar/:id',
    loadComponent: () =>
      import('./features/campanhas-editar/campanhas-editar.component').then((m) => m.CampanhasEditarComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
