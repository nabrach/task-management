import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

export const testProviders = [
  provideZonelessChangeDetection(),
  provideHttpClient(),
  provideHttpClientTesting(),
  provideRouter([])
];