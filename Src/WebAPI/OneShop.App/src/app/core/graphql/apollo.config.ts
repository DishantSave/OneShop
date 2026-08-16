import { inject } from '@angular/core';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';

export function createApollo() {
  const httpLink = inject(HttpLink);

  const publicOperations = new Set([
    'AuthenticateUser',
    'RegisterCompany',
    'RegisterUser'
  ]);

  const authLink = new SetContextLink(
    (prevContext, operation) => {

      const operationName = operation.operationName;

      // Public GraphQL operations do not require authentication
      if (
        operationName &&
        publicOperations.has(operationName)
      ) {
        return {};
      }

      // All other operations require authentication
      const token = localStorage.getItem('authToken');

      return {
        headers: {
          ...prevContext.headers,
          ...(token
            ? {
              Authorization: `Bearer ${token}`
            }
            : {})
        }
      };
    }
  );

  const http = httpLink.create({
    uri: 'https://localhost:7117/graphql'
  });

  return {
    link: authLink.concat(http),
    cache: new InMemoryCache()
  };
}
