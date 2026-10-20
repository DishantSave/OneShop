import { inject } from '@angular/core';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache, ApolloLink, Observable } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { EmbeddedDatabaseService } from '../services/embedded-database.service';

export function createApollo() {
  const httpLink = inject(HttpLink);
  const embeddedDb = inject(EmbeddedDatabaseService);

  const publicOperations = new Set([
    'AuthenticateUser',
    'RegisterCompany',
    'RegisterUser'
  ]);

  const authLink = new SetContextLink((prevContext, operation) => {
    const operationName = operation.operationName;
    if (operationName && publicOperations.has(operationName)) {
      return {};
    }
    const token = localStorage.getItem('authToken');
    return {
      headers: {
        ...prevContext.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };
  });

  const uri = embeddedDb.serverUrl();
  const http = httpLink.create({ uri });

  // Self-included database fallback link:
  // Catches network connection failures or explicit LOCAL DB mode and services via embedded DB
  const embeddedFallbackLink = new ApolloLink((operation, forward) => {
    const opName = operation.operationName || '';
    const queryStr = operation.query ? operation.query.loc?.source?.body || '' : '';
    const vars = operation.variables || {};

    if (embeddedDb.dbMode() === 'LOCAL') {
      return new Observable(observer => {
        const result = embeddedDb.handleOperation(opName, queryStr, vars);
        observer.next(result);
        observer.complete();
      });
    }

    return new Observable(observer => {
      let sub: any;
      try {
        sub = forward(operation).subscribe({
          next: result => {
            embeddedDb.activeSource.set('LIVE_SERVER');
            observer.next(result);
          },
          error: networkErr => {
            console.warn(`[OneShop Live Server Offline] Serving ${opName} from Embedded Local Database:`, networkErr);
            const fallback = embeddedDb.handleOperation(opName, queryStr, vars);
            observer.next(fallback);
            observer.complete();
          },
          complete: () => observer.complete()
        });
      } catch (err) {
        console.warn(`[OneShop Link Catch] Serving ${opName} from Embedded Local Database:`, err);
        const fallback = embeddedDb.handleOperation(opName, queryStr, vars);
        observer.next(fallback);
        observer.complete();
      }

      return () => {
        if (sub) sub.unsubscribe();
      };
    });
  });

  return {
    link: ApolloLink.from([authLink, embeddedFallbackLink, http]),
    cache: new InMemoryCache()
  };
}
