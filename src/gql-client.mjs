import {GraphQLClient} from 'graphql-request';

// gql-client factory
export const createGqlClient = ({workspaceId = '', environment, idToken}) => {
  let url = `https://api.8base.com`;
  if (workspaceId) url+=`/${workspaceId}`;
  if (environment) url+=`_${environment}`;
  return new GraphQLClient(url, {
    headers: { authorization: `Bearer ${idToken}` },
  });
}